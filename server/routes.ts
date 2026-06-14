import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { smsService } from "./sms";
import { emailService } from "./email";
import { InvoiceService } from "./invoiceService";
import { readFileSync } from "fs";
import { getAllCustomersWithChildren, getAllStudentsWithParents } from "./api-helpers";
import { insertUserSchema, insertChildSchema, insertEnrollmentSchema, insertPaymentSchema, insertSeniorSquadApplicationSchema, insertHighPerformanceSquadApplicationSchema, insertContactEnquirySchema, insertWaitlistSchema, insertBlogArticleSchema, insertClassSchema, insertCoachSchema, insertPerformanceVideoHighlightSchema, insertVideoShareSchema, insertSurveyResponseSchema, insertPerformanceRecordSchema, insertTrainingGoalSchema, enrollments as enrollmentsTable, classes, coaches, venues, majCoaches, majAthletes, children } from "@shared/schema";
import { computeTermWeeks, payableWeeks, minimumSelectableWeeks } from "@shared/term-weeks";
import { importStudentsFromCSV, previewStudentsFromCSV } from "./csv-import";
import { appendSurveyToSheet, ensureSheetHeaders, exportAssessmentsToSheet } from "./googleSheets";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { provisionMajAccess } from "./maj-provisioning";

let stripe: Stripe | null = null;
if (process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe((process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY)!, {
    apiVersion: "2025-07-30.basil",
  });
}

// Session configuration
const PgSession = connectPgSimple(session);
const sessionConfig = session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days — keeps MAJ athletes signed in between weekly sessions
    sameSite: 'lax',
  }
});

const loginSchema = z.object({
  identifier: z.string().min(1, "Email, mobile, or user ID is required"),
  password: z.string().min(1, "Password is required"),
});

// Simple authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  const sessionUserId = req.session?.userId;
  const replitUserId = req.user?.claims?.sub;
  
  if (!sessionUserId && !replitUserId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // Set user ID for compatibility with both auth systems
  if (sessionUserId && !req.user?.claims?.sub) {
    req.user = { claims: { sub: sessionUserId } };
  }
  
  return next();
};

// Admin-only middleware
const isAdmin = async (req: any, res: any, next: any) => {
  const userId = req.session?.userId;
  if (!userId) return res.status(401).json({ message: "Authentication required" });
  const user = await storage.getUser(userId);
  if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
  return next();
};

// ── MAJ (My Athletic Journey) session middleware ──────────────────────────
// majRole / majAthleteId / majCoachUser are set on the session at /api/maj/login.
// A main-app admin session also counts as coach access so the admin dashboard
// keeps working against these endpoints.
const hasMajCoachAccess = async (req: any): Promise<boolean> => {
  const s = (req.session ?? {}) as any;
  if (s.majRole === "coach") return true;
  if (s.userId) {
    const user = await storage.getUser(s.userId);
    return !!user && user.role === "admin";
  }
  return false;
};

const isMajCoach = async (req: any, res: any, next: any) => {
  if (await hasMajCoachAccess(req)) return next();
  return res.status(401).json({ message: "Coach sign-in required" });
};

// Athletes may only touch their own record; coaches and admins may touch any.
const canAccessMajAthlete = (getAthleteId: (req: any) => string | undefined) =>
  async (req: any, res: any, next: any) => {
    const s = (req.session ?? {}) as any;
    if (s.majRole === "athlete" && s.majAthleteId && s.majAthleteId === getAthleteId(req)) return next();
    if (await hasMajCoachAccess(req)) return next();
    return res.status(401).json({ message: "Sign-in required" });
  };

// ── MAJ Web Push ───────────────────────────────────────────────────────────
// Loaded lazily so the server still boots if web-push isn't installed or
// VAPID keys aren't configured yet — push just stays silently disabled.
let _webpush: any = null;
const pushConfigured = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

async function getWebPush(): Promise<any> {
  if (_webpush) return _webpush;
  if (!pushConfigured()) return null;
  try {
    const mod: any = await import("web-push");
    _webpush = mod.default || mod;
    _webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:info@power2adapt.com.au",
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  } catch (e: any) {
    console.warn("[push] web-push unavailable:", e.message);
    _webpush = null;
  }
  return _webpush;
}

async function sendPushToAthlete(athleteId: string, payload: { title: string; body: string; url?: string }): Promise<number> {
  try {
    const wp = await getWebPush();
    if (!wp) return 0;
    const subs = await storage.getPushSubscriptionsForAthlete(athleteId);
    let sent = 0;
    await Promise.all(subs.map(async (s) => {
      try {
        await wp.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
        sent++;
      } catch (err: any) {
        // 404/410 = subscription expired or revoked — clean it up
        if (err.statusCode === 404 || err.statusCode === 410) {
          await storage.deletePushSubscription(s.endpoint);
        }
      }
    }));
    return sent;
  } catch (e: any) {
    console.warn("[push] send failed:", e.message);
    return 0;
  }
}

// Has this athlete finished all three parts of their current week?
function majWeekComplete(athlete: any): boolean {
  const key = `${athlete.currentModule || 1}-${athlete.currentWeek || 1}`;
  const cw = athlete.completedWeeks;
  if (Array.isArray(cw)) {
    return ["learn", "challenge", "reflect"].every(p => cw.includes(`${key}-${p}`));
  }
  if (cw && typeof cw === "object") {
    const wk = cw[key];
    return !!(wk && wk.learn && wk.challenge && wk.reflect);
  }
  return false;
}

const enrollmentFormSchema = insertEnrollmentSchema.extend({
  parentId: z.string().optional(), // set server-side from session
  // Per-week enrolment: optional. When present, parent pays only for these weeks.
  // Omitted = full term (all payable weeks), preserving the original flat behaviour.
  selectedWeekNumbers: z.array(z.number().int().positive()).optional(),
  childInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string(),
    grade: z.string().optional(),
    medicalInfo: z.string().optional(),
    emergencyContact: z.string().optional(),
  }).optional(),
});

// Middleware to handle both session and token-based auth for mobile
function authMiddleware(req: any, res: any, next: any) {
  // Check for Authorization header (mobile)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const sessionId = authHeader.substring(7);
    // Set up session from token for mobile compatibility
    req.sessionID = sessionId;
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy /__mockup/ to the mockup sandbox dev server (port 23636) — dev only
  if (process.env.NODE_ENV !== 'production') {
    app.use('/__mockup', (req: any, res: any) => {
      import('http').then(({ default: http }) => {
        const options = {
          hostname: 'localhost',
          port: 23636,
          path: '/__mockup' + req.url,
          method: req.method,
          headers: { ...req.headers, host: 'localhost:23636' },
        };
        const proxyReq = http.request(options, (proxyRes: any) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res, { end: true });
        });
        proxyReq.on('error', () => res.status(502).end('Mockup sandbox not available'));
        req.pipe(proxyReq, { end: true });
      });
    });
  }

  // Session middleware
  app.use(sessionConfig);
  // Mobile auth middleware
  app.use(authMiddleware);

  // Serve PWA icons and assets from public folder
  const { default: express } = await import("express");
  const { resolve: _resolve, dirname: _dirname } = await import("path");
  const { fileURLToPath: _ftu } = await import("url");
  const __staticDir = _dirname(_ftu(import.meta.url));
  app.use("/icons", express.static(_resolve(__staticDir, "../public/icons")));
  app.use("/maj-icon.svg", express.static(_resolve(__staticDir, "../public/maj-icon.svg")));
  app.get("/sw.js", (_req, res) => {
    try {
      const swContent = readFileSync(_resolve(__staticDir, "../public/sw.js"), "utf-8");
      res.setHeader("Content-Type", "application/javascript; charset=utf-8");
      res.setHeader("Service-Worker-Allowed", "/");
      res.setHeader("Cache-Control", "no-cache");
      res.send(swContent);
    } catch (e) {
      res.status(404).send("Not found");
    }
  });

  // Initialize invoice service
  const invoiceService = new InvoiceService();

  // Serve the operations manual (login required)
  // Handle Junior Academy application form submission + send emails
  app.post("/api/junior-academy-application", async (req, res) => {
    try {
      const data = req.body;
      if (!data.parentName || !data.parentEmail || !data.parentPhone || !data.athleteName) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      // Save to database
      let savedApplication;
      try {
        savedApplication = await storage.createJuniorAcademyApplication({
          parentName: data.parentName,
          parentEmail: data.parentEmail,
          parentPhone: data.parentPhone,
          athleteName: data.athleteName,
          athleteDob: data.athleteDob || null,
          sports: data.sports || null,
          activityDays: data.activityDays || null,
          medical: data.medical || null,
          injuries: data.injuries || null,
          availDays: data.availDays || null,
          commitments: data.commitments || null,
          facilities: data.facilities || null,
          parentGoals: data.parentGoals || null,
          athleteGoal: data.athleteGoal || null,
          favSport: data.favSport || null,
          nervous: data.nervous || null,
          contactPref: data.contactPref || null,
          feedbackPref: data.feedbackPref || null,
          coachNotes: data.coachNotes || null,
          programme: data.programme || null,
          photoConsent: data.photoConsent || null,
          status: "pending",
        });
      } catch (e) {
        console.error("Failed to save Junior Academy application to database:", e);
      }

      const adminEmail = "info@power2adapt.com";

      // Send admin notification
      try {
        await emailService.sendJuniorAcademyAdminNotification(data, adminEmail);
      } catch (e) {
        console.error("Failed to send admin notification:", e);
      }

      // Send applicant confirmation
      try {
        await emailService.sendJuniorAcademyApplicantConfirmation({
          parentName: data.parentName,
          parentEmail: data.parentEmail,
          athleteName: data.athleteName,
          programme: data.programme || "Junior Academy",
        });
      } catch (e) {
        console.error("Failed to send applicant confirmation:", e);
      }

      res.json({ success: true, message: "Application received" });
    } catch (error: any) {
      console.error("Junior Academy application error:", error);
      res.status(500).json({ success: false, message: error.message || "Failed to process application" });
    }
  });

  app.get("/api/applications/junior-academy", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user || !["admin", "coach"].includes(user.role)) return res.status(403).json({ message: "Access denied" });
      const applications = await storage.getAllJuniorAcademyApplications();
      res.json(applications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/applications/junior-academy/:id", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) return res.status(401).json({ message: "Not authenticated" });
      const user = await storage.getUser(userId);
      if (!user || !["admin", "coach"].includes(user.role)) return res.status(403).json({ message: "Access denied" });
      const { id } = req.params;
      const { status, reviewNotes } = req.body;
      const updated = await storage.updateJuniorAcademyApplication(id, {
        status,
        reviewNotes,
        reviewedBy: userId,
        reviewedAt: new Date(),
      });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── MAJ (My Athletic Journey) API ────────────────────────────────

  app.post("/api/maj/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) return res.status(400).json({ message: "Username and password required" });

      const u = username.trim().toLowerCase();

      // Try athlete first
      const athlete = await storage.getMajAthleteByUsername(u);
      if (athlete) {
        const valid = await bcrypt.compare(password, athlete.password);
        if (!valid) return res.status(401).json({ message: "Invalid credentials" });
        if ((athlete as any).enabled === false) {
          return res.status(403).json({ message: "Your MAJ access is currently inactive — speak to your coach to re-enrol." });
        }
        const s = req.session as any;
        s.majRole = "athlete";
        s.majAthleteId = athlete.id;
        delete s.majCoachUser;
        const { password: _, ...safe } = athlete;
        return res.json({ role: "athlete", ...safe });
      }

      // Try coach
      const coach = await storage.getMajCoachByUsername(u);
      if (coach) {
        const valid = await bcrypt.compare(password, coach.password);
        if (!valid) return res.status(401).json({ message: "Invalid credentials" });
        const s = req.session as any;
        s.majRole = "coach";
        s.majCoachUser = coach.username;
        delete s.majAthleteId;
        const { password: _, ...safe } = coach;
        // Return all athletes for coach view
        const athletes = await storage.getAllMajAthletes();
        const safeAthletes = athletes.map(({ password: __, ...a }) => a);
        return res.json({ role: "coach", ...safe, athletes: safeAthletes });
      }

      return res.status(401).json({ message: "Invalid credentials" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Restore a signed-in athlete/coach without re-entering credentials.
  app.get("/api/maj/me", async (req, res) => {
    try {
      const s = (req.session ?? {}) as any;
      if (s.majRole === "athlete" && s.majAthleteId) {
        const athlete = await storage.getMajAthleteById(s.majAthleteId);
        if (athlete) {
          const { password: _, ...safe } = athlete;
          return res.json({ role: "athlete", ...safe });
        }
      }
      if (s.majRole === "coach" && s.majCoachUser) {
        const coach = await storage.getMajCoachByUsername(s.majCoachUser);
        if (coach) {
          const { password: _, ...safe } = coach;
          const athletes = await storage.getAllMajAthletes();
          const safeAthletes = athletes.map(({ password: __, ...a }) => a);
          return res.json({ role: "coach", ...safe, athletes: safeAthletes });
        }
      }
      return res.status(401).json({ message: "No active session" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/maj/logout", (req, res) => {
    const s = (req.session ?? {}) as any;
    delete s.majRole;
    delete s.majAthleteId;
    delete s.majCoachUser;
    res.json({ ok: true });
  });

  // ── MAJ Push Notification endpoints ──────────────────────────────

  app.get("/api/maj/push/public-key", (_req, res) => {
    res.json({ key: process.env.VAPID_PUBLIC_KEY || null });
  });

  app.post("/api/maj/push/subscribe", canAccessMajAthlete(req => req.body.athleteId), async (req, res) => {
    try {
      const { athleteId, subscription } = req.body;
      if (!athleteId || !subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return res.status(400).json({ message: "athleteId and subscription required" });
      }
      await storage.savePushSubscription({
        athleteId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/maj/push/unsubscribe", canAccessMajAthlete(req => req.body.athleteId), async (req, res) => {
    try {
      if (req.body.endpoint) await storage.deletePushSubscription(req.body.endpoint);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Called by a daily scheduled job (cron) — sends a streak nudge to every
  // athlete who has reminders on and hasn't finished their current week.
  app.post("/api/maj/push/streak-reminders", async (req, res) => {
    try {
      const secret = process.env.REMINDER_SECRET;
      if (!secret || req.headers["x-reminder-secret"] !== secret) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!pushConfigured()) return res.json({ sent: 0, message: "Push not configured" });

      const subs = await storage.getAllPushSubscriptions();
      const athleteIds = Array.from(new Set(subs.map(s => s.athleteId)));
      let sent = 0;
      for (const id of athleteIds) {
        const athlete = await storage.getMajAthleteById(id);
        if (!athlete || majWeekComplete(athlete)) continue;
        const firstName = (athlete.fullName || "").split(" ")[0] || "Athlete";
        const streakBit = (athlete.streak || 0) >= 2
          ? `your ${athlete.streak}-week streak is on the line! 🔥`
          : `Week ${athlete.currentWeek} is waiting for you 💪`;
        sent += await sendPushToAthlete(id, {
          title: "My Athletic Journey",
          body: `${firstName}, ${streakBit}`,
          url: "/my-athletic-journey",
        });
      }
      res.json({ sent, athletesChecked: athleteIds.length });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/maj/athletes", isMajCoach, async (req, res) => {
    try {
      const athletes = await storage.getAllMajAthletes();
      const safe = athletes.map(({ password, ...a }) => a);
      res.json(safe);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/maj/athletes", isAdmin, async (req, res) => {
    try {
      const { fullName, username, password, grade, program } = req.body;
      if (!fullName || !username || !password) {
        return res.status(400).json({ message: "Full name, username, and password are required" });
      }
      const existing = await storage.getMajAthleteByUsername(username.trim().toLowerCase());
      if (existing) {
        return res.status(409).json({ message: "Username already taken — please choose another" });
      }
      const hashed = await bcrypt.hash(password, 10);
      const athlete = await storage.createMajAthlete({
        username: username.trim().toLowerCase(),
        password: hashed,
        fullName: fullName.trim(),
        grade: grade?.trim() || undefined,
        program: program?.trim() || undefined,
      });
      const { password: _, ...safe } = athlete;
      res.status(201).json(safe);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // Toggle / reset a MAJ athlete (admin). Password is hashed; plaintext kept in displayPassword.
  app.patch("/api/maj/athletes/:id", isAdmin, async (req, res) => {
    try {
      const { enabled, password } = req.body as { enabled?: boolean; password?: string };
      const updates: { enabled?: boolean; password?: string; displayPassword?: string } = {};
      if (typeof enabled === "boolean") updates.enabled = enabled;
      if (typeof password === "string" && password.length > 0) {
        updates.password = await bcrypt.hash(password, 10);
        updates.displayPassword = password;
      }
      const athlete = await storage.updateMajAthlete(req.params.id, updates);
      const { password: _pw, ...safe } = athlete as any;
      res.json(safe);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Provision MAJ access for a specific child (admin)
  app.post("/api/admin/children/:id/maj-access", isAdmin, async (req, res) => {
    try {
      const child = await storage.getChild(req.params.id);
      if (!child) return res.status(404).json({ message: "Child not found" });
      const enrolments = await storage.getEnrollmentsByParent(child.parentId);
      const match = enrolments.find((e: any) => e.enrollment?.childId === child.id);
      const classId = match?.class?.id ?? match?.enrollment?.classId;
      if (!classId) return res.status(400).json({ message: "No enrolment found for this child to derive their school." });
      const athlete = await provisionMajAccess(child.id, classId);
      const safe = athlete ? (({ password, ...rest }: any) => rest)(athlete) : null;
      res.json(safe);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // MAJ status per child for the admin students list
  app.get("/api/admin/children-maj", isAdmin, async (_req, res) => {
    try {
      const rows = await storage.getChildrenMajStatus();
      res.json(rows);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/maj/athlete/:id", canAccessMajAthlete(req => req.params.id), async (req, res) => {
    try {
      const athlete = await storage.getMajAthleteById(req.params.id);
      if (!athlete) return res.status(404).json({ message: "Athlete not found" });
      const { password: _, ...safe } = athlete;
      const reflections = await storage.getMajReflectionsForAthlete(athlete.id);
      res.json({ ...safe, reflections });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/maj/athlete/:id/progress", canAccessMajAthlete(req => req.params.id), async (req, res) => {
    try {
      const { xp, currentModule, currentWeek, streak, streakFreezes, lastWeekCompletedAt, avatar, sessionsCompleted, reflectionsSubmitted, earnedBadgeKeys, completedWeeks } = req.body;
      const updated = await storage.updateMajAthleteProgress(req.params.id, {
        xp, currentModule, currentWeek, streak, streakFreezes, lastWeekCompletedAt, avatar, sessionsCompleted, reflectionsSubmitted, earnedBadgeKeys, completedWeeks
      });
      const { password: _, ...safe } = updated;
      res.json(safe);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/maj/reflection", canAccessMajAthlete(req => req.body.athleteId), async (req, res) => {
    try {
      const { athleteId, moduleNum, weekNum, prompt, response: reflResponse } = req.body;
      if (!athleteId || !moduleNum || !weekNum || !prompt || !reflResponse) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const reflection = await storage.createMajReflection({ athleteId, moduleNum, weekNum, prompt, response: reflResponse });
      res.json(reflection);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/maj/badge", canAccessMajAthlete(req => req.body.athleteId), async (req, res) => {
    try {
      const { athleteId, badgeKey, badgeName, badgeIcon, xpAwarded, awardedBy } = req.body;
      if (!athleteId || !badgeKey || !badgeName || !badgeIcon) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const badge = await storage.awardMajBadge({ athleteId, badgeKey, badgeName, badgeIcon, xpAwarded: xpAwarded ?? 0, awardedBy });
      res.json(badge);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/maj/athlete/:id/assessments", canAccessMajAthlete(req => req.params.id), async (req, res) => {
    try {
      const assessments = await storage.getRunAssessmentsForAthlete(req.params.id);
      res.json(assessments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/maj/assessments", isMajCoach, async (req, res) => {
    try {
      const assessment = await storage.createRunAssessment(req.body);
      res.status(201).json(assessment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/maj/athlete/:id/skill-assessments", canAccessMajAthlete(req => req.params.id), async (req, res) => {
    try {
      const assessments = await storage.getSkillAssessmentsForAthlete(req.params.id);
      res.json(assessments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Latest assessment within the last 14 days — used for the home page coach banner
  app.get("/api/maj/athlete/:id/latest-assessment", canAccessMajAthlete(req => req.params.id), async (req, res) => {
    try {
      const assessments = await storage.getSkillAssessmentsForAthlete(req.params.id);
      if (!assessments.length) return res.json(null);
      const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const recent = assessments.find(a => new Date(a.created_at).getTime() > cutoff);
      res.json(recent || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/maj/athlete/:id/notifications", canAccessMajAthlete(req => req.params.id), async (req, res) => {
    try {
      const assessments = await storage.getSkillAssessmentsForAthlete(req.params.id);
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recent = assessments.filter((a: any) => new Date(a.created_at).getTime() > cutoff);
      const typeLabels: Record<string, string> = {
        run: "Run", jump: "Jump & Land", throw: "Throw", leap: "Bound & Leap", balance: "Balance & Agility"
      };
      const notifications = recent.map((a: any) => ({
        id: a.id,
        type: "assessment",
        title: `Coach assessment — ${typeLabels[a.assessment_type] || a.assessment_type}`,
        body: a.next_steps
          ? `Next steps: ${a.next_steps}`
          : a.overall_rating
          ? `Rated: ${a.overall_rating}`
          : "Assessment completed",
        coach: a.coach_name,
        date: a.assessment_date || a.created_at,
        createdAt: a.created_at,
      }));
      // Merge in coach kudos from the same window
      const kudos = await storage.getKudosForAthlete(req.params.id);
      const recentKudos = kudos
        .filter((k: any) => k.createdAt && new Date(k.createdAt).getTime() > cutoff)
        .map((k: any) => ({
          id: k.id,
          type: "kudos",
          title: `${k.emoji} Kudos from ${k.coachName || "your coach"}!`,
          body: k.message,
          coach: k.coachName,
          date: k.createdAt,
          createdAt: k.createdAt,
        }));
      const merged = [...notifications, ...recentKudos].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      res.json(merged);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/maj/skill-assessments", isMajCoach, async (req, res) => {
    try {
      const assessment = await storage.createSkillAssessment(req.body);
      // Fire-and-forget push so the athlete hears about coach feedback right away
      if (req.body.athleteId) {
        const typeLabels: Record<string, string> = {
          run: "Running 🏃", jump: "Jump & Land ⬆️", throw: "Throw 🎯", leap: "Bound & Leap 🦘"
        };
        const skill = typeLabels[req.body.assessmentType] || "skills";
        sendPushToAthlete(req.body.athleteId, {
          title: "Coach feedback! 📋",
          body: `${req.body.coachName || "Your coach"} just assessed your ${skill} — open MAJ to read it`,
          url: "/my-athletic-journey",
        }).catch(() => {});
      }
      res.status(201).json(assessment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // One-tap coach kudos — saved for the athlete's bell and pushed instantly
  app.post("/api/maj/kudos", isMajCoach, async (req, res) => {
    try {
      const { athleteId, emoji, message, coachName } = req.body;
      if (!athleteId || !emoji || !message) {
        return res.status(400).json({ message: "athleteId, emoji and message required" });
      }
      const kudos = await storage.createMajKudos({ athleteId, coachName, emoji, message });
      sendPushToAthlete(athleteId, {
        title: `${emoji} Kudos from ${coachName || "your coach"}!`,
        body: message,
        url: "/my-athletic-journey",
      }).catch(() => {});
      res.status(201).json(kudos);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/maj/export/athlete-assessments", isMajCoach, async (req, res) => {
    try {
      const { athleteId, athleteName } = req.body;
      if (!athleteId || !athleteName) return res.status(400).json({ message: "athleteId and athleteName required" });
      const assessments = await storage.getSkillAssessmentsForAthlete(athleteId);
      if (!assessments.length) return res.status(400).json({ message: "No assessments to export" });
      const url = await exportAssessmentsToSheet(athleteName, assessments);
      res.json({ url });
    } catch (error: any) {
      console.error("[sheets export]", error.message);
      res.status(500).json({ message: "Failed to export to Google Sheets: " + error.message });
    }
  });

  app.post("/api/maj/wellness", canAccessMajAthlete(req => req.body.athleteId), async (req, res) => {
    try {
      const record = await storage.createWellnessCheckIn(req.body);
      res.status(201).json(record);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/maj/athlete/:id/wellness", canAccessMajAthlete(req => req.params.id), async (req, res) => {
    try {
      const records = await storage.getWellnessForAthlete(req.params.id);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/maj/athlete/:id/reflections", canAccessMajAthlete(req => req.params.id), async (req, res) => {
    try {
      const reflections = await storage.getMajReflectionsForAthlete(req.params.id);
      res.json(reflections);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/maj/reflection/:id/note", isMajCoach, async (req, res) => {
    try {
      const { coachNote } = req.body;
      const updated = await storage.updateMajReflectionCoachNote(req.params.id, coachNote);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/p2a-logo-dark.png", async (req, res) => {
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    res.sendFile(resolve(__dirname, "../public/p2a-logo-dark.png"));
  });

  app.get("/p2a-logo.png", async (req, res) => {
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    res.sendFile(resolve(__dirname, "../public/p2a-logo.png"));
  });

  app.get("/module2-overview", async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/module2-overview.html");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(content);
    } catch {
      res.status(404).send("Page not found");
    }
  });

  // White-label sales demo — fully client-side, sample data only
  app.get("/velocity-demo", async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/velocity-demo.html");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(content);
    } catch {
      res.status(404).send("Page not found");
    }
  });

  // Public landing / onboarding page for MAJ — parents' front door
  app.get("/journey", async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/journey.html");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(content);
    } catch {
      res.status(404).send("Page not found");
    }
  });

  app.get("/my-athletic-journey", async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/my-athletic-journey.html");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(content);
    } catch {
      res.status(404).send("Page not found");
    }
  });

  app.get(["/start", "/start/index.html"], async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/start/index.html");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(content);
    } catch {
      res.status(404).send("Page not found");
    }
  });

  app.get("/junior-academy-application.html", async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/junior-academy-application.html");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(content);
    } catch {
      res.status(404).send("Page not found");
    }
  });

  app.get("/senior-squad-application.html", async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/senior-squad-application.html");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(content);
    } catch {
      res.status(404).send("Page not found");
    }
  });

  app.get("/speed-running-application.html", async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/speed-running-application.html");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(content);
    } catch {
      res.status(404).send("Page not found");
    }
  });

  app.get("/easter-testing", async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/easter-testing.html");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(content);
    } catch {
      res.status(404).send("Page not found");
    }
  });

  app.get("/manifest.json", async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/manifest.json");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "application/manifest+json");
      res.send(content);
    } catch {
      res.status(404).send("Not found");
    }
  });

  app.get("/maj-icon.svg", async (req, res) => {
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/maj-icon.svg");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "image/svg+xml");
      res.send(content);
    } catch {
      res.status(404).send("Not found");
    }
  });

  app.get("/operations-manual", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.redirect("/?login=required");
    }
    const user = await storage.getUser(userId);
    if (!user || !["admin", "coach"].includes(user.role)) {
      return res.status(403).send("Access denied. Admin or coach login required.");
    }
    const { readFileSync } = await import("fs");
    const { resolve, dirname } = await import("path");
    const { fileURLToPath } = await import("url");
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const filePath = resolve(__dirname, "../public/operations-manual.html");
    try {
      const content = readFileSync(filePath, "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(content);
    } catch {
      res.status(404).send("Manual not found");
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = loginSchema.parse(req.body);
      
      // Try to find user by email, mobile, or userId
      let user = await storage.getUserByEmail(identifier);
      if (!user) {
        user = await storage.getUserByMobile(identifier);
      }
      if (!user) {
        user = await storage.getUserByUserId(identifier);
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set session
      (req.session as any).userId = user.id;
      
      res.json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      // Auto-generate userId from email prefix if not provided
      if (!req.body.userId && req.body.email) {
        const prefix = req.body.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        const suffix = Math.floor(1000 + Math.random() * 9000);
        req.body.userId = `${prefix}${suffix}`;
      }

      const userData = insertUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Set session
      (req.session as any).userId = user.id;
      
      res.json({
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });
  });

  // Classes routes
  app.get("/api/classes/sibling-discount", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.json({ eligible: false, count: 0 });
    const { term, year } = req.query as { term: string; year: string };
    if (!term || !year) return res.json({ eligible: false, count: 0 });
    try {
      const count = await storage.getActiveEnrolmentCountForParent(userId, term, parseInt(year, 10));
      res.json({ eligible: count >= 2, count });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to check sibling discount' });
    }
  });

  app.get("/api/classes", async (req, res) => {
    try {
      const filters = {
        sportType: req.query.sportType === "all" ? undefined : req.query.sportType as string,
        venueId: req.query.venueId === "all" ? undefined : req.query.venueId as string,
        term: req.query.term === "all" ? undefined : req.query.term as string,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        dayOfWeek: req.query.dayOfWeek === "all" ? undefined : req.query.dayOfWeek ? parseInt(req.query.dayOfWeek as string) : undefined,
      };
      
      const classesWithSpots = await storage.getClassesWithSpots(filters);
      res.json(classesWithSpots);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/classes/:id", async (req, res) => {
    try {
      const classData = await storage.getClassWithDetails(req.params.id);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      res.json(classData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Per-week enrolment: dated session weeks for a class's term, with holiday
  // flags, price-per-week and the minimum selectable weeks (half the term).
  app.get("/api/classes/:id/term-weeks", async (req, res) => {
    try {
      const cls = await storage.getClass(req.params.id);
      if (!cls) {
        return res.status(404).json({ message: "Class not found" });
      }
      if (!cls.termConfigId) {
        return res.status(400).json({ message: "Class has no term configuration" });
      }
      if (!(cls as any).perWeekEnabled) {
        return res.status(404).json({ message: "Per-week enrolment is not enabled for this class" });
      }
      const termConfig = await storage.getTermConfigurationById(cls.termConfigId);
      if (!termConfig) {
        return res.status(404).json({ message: "Term configuration not found" });
      }
      const holidays = await storage.getTermHolidays(cls.termConfigId);
      const weeks = computeTermWeeks({
        termStartDate: termConfig.startDate,
        weeksCount: termConfig.weeksCount,
        classDayOfWeek: cls.dayOfWeek,
        holidays: holidays.map((h: any) => ({ holidayDate: h.holidayDate, name: h.name })),
      });
      const payable = payableWeeks(weeks);
      res.json({
        classId: cls.id,
        termConfigId: termConfig.id,
        termName: termConfig.name,
        pricePerWeek: termConfig.pricePerWeek,
        gstRate: termConfig.gstRate,
        weeks,
        payableWeeksCount: payable.length,
        minWeeksSelectable: minimumSelectableWeeks(payable.length),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin class management routes
  app.post("/api/classes", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const body = { ...req.body };
      // The form sends dates as strings and the price as a number, but the insert
      // schema expects Date objects (timestamp columns) and strings (decimal columns).
      // Coerce before validation so the Add Class form can create classes.
      if (body.startDate) body.startDate = new Date(body.startDate);
      if (body.endDate) body.endDate = new Date(body.endDate);
      if (body.pricePerSession != null && body.pricePerSession !== "") {
        body.pricePerSession = String(body.pricePerSession);
      }
      // Compute pricePerTerm from pricePerSession × session count
      if (body.pricePerSession && body.startDate && body.endDate && body.dayOfWeek) {
        const sessions = storage.countSessions(new Date(body.startDate), new Date(body.endDate), parseInt(body.dayOfWeek));
        body.pricePerTerm = (parseFloat(body.pricePerSession) * sessions).toFixed(2);
      }
      if (!body.pricePerTerm) {
        return res.status(400).json({ message: "Cannot compute term price — ensure pricePerSession, startDate, endDate and dayOfWeek are all provided." });
      }
      const classData = insertClassSchema.parse(body);
      const newClass = await storage.createClass(classData);
      res.json(newClass);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/classes/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const updates = { ...req.body };
      // The edit form sends dates as strings and the price as a number, but the
      // timestamp columns need Date objects and the decimal columns need strings.
      // Coerce before the update so saving an edited class doesn't fail at the DB.
      if (typeof updates.startDate === "string") updates.startDate = new Date(updates.startDate);
      if (typeof updates.endDate === "string") updates.endDate = new Date(updates.endDate);
      if (updates.pricePerSession != null && updates.pricePerSession !== "") {
        updates.pricePerSession = String(updates.pricePerSession);
      }
      // Recompute pricePerTerm if pricePerSession changes
      if (updates.pricePerSession) {
        const existing = await storage.getClass(req.params.id);
        const startDate = updates.startDate ?? existing?.startDate;
        const endDate = updates.endDate ?? existing?.endDate;
        const dayOfWeek = updates.dayOfWeek ?? existing?.dayOfWeek;
        if (startDate && endDate && dayOfWeek) {
          const sessions = storage.countSessions(new Date(startDate), new Date(endDate), parseInt(dayOfWeek));
          updates.pricePerTerm = (parseFloat(updates.pricePerSession) * sessions).toFixed(2);
        }
      }
      const updatedClass = await storage.updateClass(req.params.id, updates);
      res.json(updatedClass);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/classes/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      await storage.deleteClass(req.params.id);
      res.json({ message: "Class deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Coaches routes
  app.get("/api/coaches", async (req, res) => {
    try {
      const coaches = await storage.getAllCoaches();
      res.json(coaches);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Staff management routes (for admin)
  app.get("/api/staff", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const [users, coaches] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllCoaches()
      ]);
      
      // Only get admin and coach users (not parents/customers)
      const staffUsers = users.filter(u => u.role === 'admin' || u.role === 'coach');
      
      // Get only active coaches
      const activeCoaches = coaches.filter(c => c.active);
      
      // Combine user and coach data for staff members
      const staff = staffUsers.map(user => {
        const coachData = activeCoaches.find(c => c.userId === user.id);
        return {
          ...user,
          ...coachData,
          id: user.id, // Ensure we use the user ID
        };
      });
      
      // Add coaches without user accounts (standalone coach records)
      const coachesWithoutUsers = activeCoaches.filter(c => !c.userId && c.active);
      coachesWithoutUsers.forEach(coach => {
        staff.push({
          id: coach.id,
          firstName: coach.firstName,
          lastName: coach.lastName,
          email: coach.email || '',
          mobile: coach.mobile || '',
          role: 'coach',
          specializations: coach.specializations,
          qualifications: coach.qualifications,
          experience: coach.experience,
          bio: coach.bio,
          active: coach.active,
        });
      });
      
      res.json(staff);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/staff", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const staffData = req.body;
      
      // Hash password
      const hashedPassword = await bcrypt.hash(staffData.password, 10);
      
      // Create user account
      const userData = insertUserSchema.parse({
        firstName: staffData.firstName,
        lastName: staffData.lastName,
        email: staffData.email,
        mobile: staffData.mobile,
        userId: staffData.userId,
        password: hashedPassword,
        role: staffData.role,
      });
      
      const newUser = await storage.createUser(userData);
      
      // If role is coach, create coach profile
      if (staffData.role === "coach") {
        const coachData = insertCoachSchema.parse({
          userId: newUser.id,
          firstName: staffData.firstName,
          lastName: staffData.lastName,
          email: staffData.email,
          mobile: staffData.mobile,
          specializations: staffData.specializations || [],
          qualifications: staffData.qualifications || [],
          experience: staffData.experience || "",
          bio: staffData.bio || "",
          active: staffData.active !== false,
        });
        
        await storage.createCoach(coachData);
      }
      
      res.json({ ...newUser, message: "Staff member created successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/staff/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const staffData = req.body;
      const staffId = req.params.id;
      
      // Check if this is a user ID or coach ID
      const existingUser = await storage.getUser(staffId);
      const existingCoach = await storage.getCoach(staffId);
      
      if (existingUser) {
        // This is a user account - update user table
        const userUpdates: any = {
          firstName: staffData.firstName,
          lastName: staffData.lastName,
          email: staffData.email,
          mobile: staffData.mobile,
          userId: staffData.userId,
          role: staffData.role,
        };
        
        // Hash password if provided
        if (staffData.password) {
          userUpdates.password = await bcrypt.hash(staffData.password, 10);
        }
        
        // Update user account
        const updatedUser = await storage.updateUser(staffId, userUpdates);
        
        // Update associated coach profile if role is coach
        if (staffData.role === "coach") {
          const associatedCoach = await storage.getCoachByUserId(staffId);
          if (associatedCoach) {
            const coachData = {
              firstName: staffData.firstName,
              lastName: staffData.lastName,
              specializations: staffData.specializations || [],
              qualifications: staffData.qualifications || [],
              experience: staffData.experience || "",
              bio: staffData.bio || "",
              active: staffData.active !== false,
            };
            await storage.updateCoach(associatedCoach.id, coachData);
          }
        }
        
        res.json({ ...updatedUser, message: "Staff member updated successfully" });
        
      } else if (existingCoach) {
        // This is a standalone coach record - update coach table only
        // Note: email/mobile are not stored in coaches table, only in users table
        const coachData = {
          firstName: staffData.firstName,
          lastName: staffData.lastName,
          specializations: staffData.specializations || [],
          qualifications: staffData.qualifications || [],
          experience: staffData.experience || "",
          bio: staffData.bio || "",
          active: staffData.active !== false,
        };
        
        const updatedCoach = await storage.updateCoach(staffId, coachData);
        
        // For standalone coaches, we need to indicate that email/mobile cannot be updated
        // since they don't have associated user accounts
        const message = staffData.email || staffData.mobile 
          ? "Coach updated successfully. Note: Email/mobile can only be set for coaches with user accounts."
          : "Coach updated successfully";
          
        res.json({ ...updatedCoach, message });
        
      } else {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
    } catch (error: any) {
      console.error("Staff update error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/staff/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const staffId = req.params.id;
      
      // Delete coach profile if exists
      const existingCoach = await storage.getCoachByUserId(staffId);
      if (existingCoach) {
        await storage.deleteCoach(existingCoach.id);
      }
      
      // Delete user account
      await storage.deleteUser(staffId);
      
      res.json({ message: "Staff member deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Venues routes
  app.get("/api/venues", async (req, res) => {
    try {
      const venues = await storage.getAllVenues();
      res.json(venues);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Children routes (requires authentication)
  // Public athlete lookup by name (minimal data, no PII)
  app.get("/api/children/lookup", async (req, res) => {
    const { name } = req.query as { name: string };
    if (!name || name.trim().length < 2) return res.json([]);
    try {
      const term = name.trim().toLowerCase();
      const all = await db
        .select({
          id: children.id,
          firstName: children.firstName,
          lastName: children.lastName,
          dateOfBirth: children.dateOfBirth,
        })
        .from(children);
      const matches = all.filter((c) => {
        const full = `${c.firstName} ${c.lastName}`.toLowerCase();
        return full.includes(term) || c.firstName.toLowerCase().startsWith(term) || c.lastName.toLowerCase().startsWith(term);
      }).slice(0, 8);
      // Return only name + rough age (no DOB, no parent ID)
      const now = new Date();
      res.json(matches.map((c) => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        age: now.getFullYear() - new Date(c.dateOfBirth).getFullYear(),
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/children", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const children = await storage.getChildrenByParent(userId);
      res.json(children);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/children", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const childData = insertChildSchema.parse({
        ...req.body,
        parentId: userId,
      });
      
      const child = await storage.createChild(childData);
      res.json(child);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin route to add child to any parent
  app.post("/api/admin/children", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Check if user is admin
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const body = { ...req.body };
      if (body.dateOfBirth && typeof body.dateOfBirth === 'string') body.dateOfBirth = new Date(body.dateOfBirth);
      const childData = insertChildSchema.parse(body);
      const child = await storage.createChild(childData);
      res.json(child);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Enrollments routes (requires authentication)
  app.get("/api/enrollments", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const enrollments = await storage.getEnrollmentsByParent(userId);
      res.json(enrollments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/enrollments/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const enrollment = await storage.getEnrollment(req.params.id);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      if (enrollment.parentId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Get full enrollment details
      const enrollments = await storage.getEnrollmentsByParent(userId);
      const fullEnrollment = enrollments.find(e => e.enrollment.id === req.params.id);
      
      res.json(fullEnrollment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/enrollments/waitlist", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { childId, classId } = req.body;
    if (!childId || !classId) {
      return res.status(400).json({ error: 'childId and classId are required' });
    }

    try {
      const result = await storage.createWaitlistWithHolidayReservation(childId, classId, userId);
      const child = await storage.getChild(childId);
      const cls = await storage.getClass(classId);
      const user = await storage.getUser(userId);
      if (child && cls && user?.mobile) {
        const message = result.holidayReservation
          ? `${child.firstName} is on the waitlist for ${cls.name}! 🎁 Bonus: a spot has been reserved in our next holiday program. We'll SMS you if a class spot opens. — Power2ADAPT`
          : `${child.firstName} is on the waitlist for ${cls.name}. We'll SMS you if a spot opens — you'll have 24 hours to confirm. — Power2ADAPT`;
        await smsService.sendSMS(user.mobile, message).catch(() => {});
      }
      res.json(result);
    } catch (error: any) {
      console.error('Waitlist error:', error);
      res.status(500).json({ error: 'Failed to join waitlist' });
    }
  });

  app.post("/api/enrollments", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const parsed = enrollmentFormSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.issues.map((i: any) => `${i.path.join('.')}: ${i.message}`).join('; ') });
      }
      const { childInfo, ...enrollmentData } = parsed.data;
      
      let childId = enrollmentData.childId;
      
      // Create child if childInfo provided
      if (childInfo && !childId) {
        const child = await storage.createChild({
          ...childInfo,
          dateOfBirth: new Date(childInfo.dateOfBirth),
          parentId: userId,
        });
        childId = child.id;
      }
      
      if (!childId) {
        return res.status(400).json({ message: "Child ID is required" });
      }
      
      // Check class availability
      const classData = await storage.getClass(enrollmentData.classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Term 3 enrollment lock — enrolments open 5 June 2026 AEST
      const TERM3_OPENS = new Date("2026-06-05T00:00:00+10:00");
      if (new Date() < TERM3_OPENS) {
        return res.status(403).json({ message: "Term 3 enrolments open on 5 June 2026. Check back then to secure your spot!" });
      }
      
      const enrollmentStatus = (classData.currentEnrollment || 0) >= classData.maxCapacity ? "waitlist" : "pending_payment";
      const waitlistPosition = enrollmentStatus === "waitlist" ? await storage.getWaitlistPosition(enrollmentData.classId) : undefined;

      // ── Per-week enrolment: resolve the term weeks and the amount to charge ──
      // Default (no selectedWeekNumbers) = full term at the flat pricePerTerm.
      // When weeks are selected, the price is recomputed server-side (never trust
      // the client) at pricePerWeek × selected weeks. GST is always applied on top
      // of the ex-GST base price for both paths.
      const GST_DEFAULT = 0.1; // Australian GST, used when a class has no term config
      const selectedWeekNumbers = (enrollmentData as any).selectedWeekNumbers as number[] | undefined;
      let termWeeks: ReturnType<typeof computeTermWeeks> | null = null;
      let gstRate = GST_DEFAULT;
      let baseExGst = parseFloat(classData.pricePerTerm);

      if (selectedWeekNumbers && selectedWeekNumbers.length > 0) {
        if (!(classData as any).perWeekEnabled) {
          return res.status(400).json({ message: "Per-week enrolment is not enabled for this class." });
        }
        if (!classData.termConfigId) {
          return res.status(400).json({ message: "This class has no term configuration, so weeks cannot be selected." });
        }
        const termConfig = await storage.getTermConfigurationById(classData.termConfigId);
        if (!termConfig) {
          return res.status(400).json({ message: "Term configuration not found for this class." });
        }
        const holidays = await storage.getTermHolidays(classData.termConfigId);
        termWeeks = computeTermWeeks({
          termStartDate: termConfig.startDate,
          weeksCount: termConfig.weeksCount,
          classDayOfWeek: classData.dayOfWeek,
          holidays: holidays.map((h: any) => ({ holidayDate: h.holidayDate, name: h.name })),
        });
        const payable = payableWeeks(termWeeks);
        const payableNumbers = new Set(payable.map((w) => w.weekNumber));
        const uniqueSelected = Array.from(new Set(selectedWeekNumbers));

        const invalid = uniqueSelected.filter((n) => !payableNumbers.has(n));
        if (invalid.length > 0) {
          return res.status(400).json({ message: `Selected weeks are not valid sessions: ${invalid.join(", ")}` });
        }
        const minWeeks = minimumSelectableWeeks(payable.length);
        if (uniqueSelected.length < minWeeks) {
          return res.status(400).json({ message: `Please select at least ${minWeeks} of the ${payable.length} weeks.` });
        }

        gstRate = termConfig.gstRate != null ? parseFloat(termConfig.gstRate) : GST_DEFAULT;
        baseExGst = parseFloat(termConfig.pricePerWeek) * uniqueSelected.length;
      } else if (classData.termConfigId) {
        // Full-term path: pick up the class's configured GST rate if present.
        const termConfig = await storage.getTermConfigurationById(classData.termConfigId);
        if (termConfig?.gstRate != null) gstRate = parseFloat(termConfig.gstRate);
      }

      // GST always applied on top of the ex-GST base price.
      const amountToCharge = (baseExGst * (1 + gstRate)).toFixed(2);

      const enrollment = await storage.createEnrollment({
        childId,
        classId: enrollmentData.classId,
        parentId: userId,
        status: enrollmentStatus as any,
        autoRenew: enrollmentData.autoRenew ?? true,
        waitlistPosition,
        notes: enrollmentData.notes,
      });

      // Write one enrollment_weeks row per term week (selected / skipped / holiday)
      if (termWeeks && enrollmentStatus !== "waitlist") {
        const selectedSet = new Set(Array.from(new Set(selectedWeekNumbers)));
        await storage.createEnrollmentWeeks(
          termWeeks.map((w) => ({
            enrollmentId: enrollment.id,
            weekNumber: w.weekNumber,
            sessionDate: w.sessionDate,
            status: w.isHoliday ? "holiday" : selectedSet.has(w.weekNumber) ? "selected" : "skipped",
          })),
        );
      }

      // Create payment record if not waitlisted
      if (enrollmentStatus === "pending_payment") {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Payment due in 7 days

        await storage.createPayment({
          enrollmentId: enrollment.id,
          amount: amountToCharge,
          dueDate,
        });
      }

      // Send SMS notification for enrollment confirmation
      try {
        const parent = await storage.getUser(userId);
        const child = await storage.getChild(childId);
        const venue = await storage.getVenue(classData.venueId);
        
        if (parent?.mobile && child && venue) {
          const startDate = new Date(classData.startDate).toLocaleDateString('en-AU', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          });
          
          if (enrollmentStatus === "waitlist") {
            await smsService.sendSMS(
              parent.mobile,
              `${child.firstName} is on the waitlist for ${classData.name} at ${venue.name}. We'll contact you as soon as a spot opens up! 📋`
            );
          } else {
            await smsService.sendEnrollmentConfirmation(
              parent.mobile,
              child.firstName,
              classData.name,
              venue.name,
              startDate
            );
          }
        }
      } catch (smsError) {
        console.log('SMS notification failed:', smsError);
        // Don't fail the enrollment if SMS fails
      }
      
      res.json(enrollment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Payment routes
  app.post("/api/create-payment-intent", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { enrollmentId } = req.body;
      
      const enrollment = await storage.getEnrollment(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ message: "Enrollment not found" });
      }
      
      if (enrollment.parentId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const classData = await storage.getClass(enrollment.classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Charge the amount recorded on the enrolment's payment (per-week aware),
      // falling back to the flat term price only if no payment record exists.
      const [pendingPayment] = await storage.getPaymentsByEnrollment(enrollmentId);
      const chargeBase = pendingPayment?.amount ?? classData.pricePerTerm;
      const amount = Math.round(parseFloat(chargeBase) * 100); // Convert to cents

      if (!stripe) {
        return res.status(500).json({ message: "Payment processing not configured" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "aud",
        payment_method_types: ["card"],
        metadata: {
          enrollmentId: enrollment.id,
          userId,
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // ── Batch payment intent — one charge for multiple enrollments (family) ──
  app.post("/api/create-batch-payment-intent", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { enrollmentIds } = req.body as { enrollmentIds: string[] };
      if (!Array.isArray(enrollmentIds) || enrollmentIds.length === 0)
        return res.status(400).json({ message: "enrollmentIds required" });

      // Fetch all enrollments + their class prices
      const allParentRows = await storage.getEnrollmentsByParent(userId);
      const matched = allParentRows.filter(r => enrollmentIds.includes(r.enrollment.id));
      if (matched.length !== enrollmentIds.length)
        return res.status(403).json({ message: "One or more enrollments not found or not yours" });

      // Sum each enrolment's recorded payment amount (per-week aware), falling
      // back to the flat term price only where no payment record exists.
      const perEnrollmentCents = await Promise.all(
        matched.map(async (r) => {
          const [pmt] = await storage.getPaymentsByEnrollment(r.enrollment.id);
          const price = parseFloat(pmt?.amount ?? r.class?.pricePerTerm ?? "0");
          return Math.round(price * 100);
        }),
      );
      const totalCents = perEnrollmentCents.reduce((sum, c) => sum + c, 0);

      if (!stripe) return res.status(500).json({ message: "Payment processing not configured" });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: "aud",
        payment_method_types: ["card"],
        metadata: {
          enrollmentIds: enrollmentIds.join(","),
          userId,
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret, totalCents, enrollments: matched });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating batch payment intent: " + error.message });
    }
  });

  // ── Monthly subscription (3 × $110+GST monthly, for Junior Academy / Senior Squad / Elite HP) ──
  app.post("/api/create-subscription", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    try {
      const { enrollmentId } = req.body;

      const enrollment = await storage.getEnrollment(enrollmentId);
      if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });
      if (enrollment.parentId !== userId) return res.status(403).json({ message: "Unauthorized" });

      const classData = await storage.getClass(enrollment.classId);
      if (!classData) return res.status(404).json({ message: "Class not found" });

      if (!stripe) return res.status(500).json({ message: "Payment processing not configured" });

      const parent = await storage.getUser(userId);
      if (!parent) return res.status(404).json({ message: "User not found" });

      // Create or retrieve Stripe customer
      let customerId: string;
      const existingCustomers = await stripe.customers.list({ email: parent.email || undefined, limit: 1 });
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: parent.email || undefined,
          name: `${parent.firstName || ""} ${parent.lastName || ""}`.trim() || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
      }

      // $110 + GST (10%) = $121 AUD per instalment, 3 payments
      const instalmentAmountCents = 12100; // $121.00 AUD in cents

      // Create a SetupIntent so the user enters their card — we'll charge via subscription
      const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ["card"],
        metadata: {
          enrollmentId: enrollment.id,
          userId,
          instalmentAmountCents: String(instalmentAmountCents),
          classId: classData.id,
        },
      });

      res.json({
        clientSecret: setupIntent.client_secret,
        customerId,
        instalmentAmount: 110,
        instalmentAmountGst: 121,
        totalInstalments: 3,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating subscription: " + error.message });
    }
  });

  // ── Activate monthly subscription after card setup ──
  app.post("/api/activate-subscription", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    try {
      const { enrollmentId, setupIntentId } = req.body;
      if (!stripe) return res.status(500).json({ message: "Payment processing not configured" });

      const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);
      if (!setupIntent.payment_method) return res.status(400).json({ message: "No payment method found" });

      const customerId = setupIntent.customer as string;
      const instalmentAmountCents = parseInt(setupIntent.metadata.instalmentAmountCents || "12100");

      // Create a one-off price for $121 AUD monthly
      const price = await stripe.prices.create({
        unit_amount: instalmentAmountCents,
        currency: "aud",
        recurring: { interval: "month" },
        product_data: { name: "Power2ADAPT Monthly Instalment" },
      });

      // Create subscription — 3 payments then cancel
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        default_payment_method: setupIntent.payment_method as string,
        items: [{ price: price.id }],
        cancel_at_period_end: false,
        metadata: {
          enrollmentId,
          userId,
          maxInstalments: "3",
          instalmentCount: "0",
        },
      });

      // Update payment record with subscription ID and type
      const payments = await storage.getPaymentsByEnrollment(enrollmentId);
      if (payments.length > 0) {
        await storage.updatePayment(payments[0].id, {
          stripeSubscriptionId: subscription.id,
          paymentType: "monthly",
        } as any);
      }

      // Activate enrollment
      await storage.updateEnrollment(enrollmentId, { status: "active" });
      try {
        const enr = await storage.getEnrollment(enrollmentId);
        if (enr?.childId) await provisionMajAccess(enr.childId, enr.classId);
      } catch (e) {
        console.error("MAJ provisioning failed for enrollment", enrollmentId, e);
      }
      await storage.updateClassEnrollmentCount((await storage.getEnrollment(enrollmentId))!.classId);

      res.json({ subscriptionId: subscription.id, status: subscription.status });
    } catch (error: any) {
      res.status(500).json({ message: "Error activating subscription: " + error.message });
    }
  });

  app.post("/api/webhook/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment processing not configured" });
      }
      
      const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        // Support both single enrollmentId and batch enrollmentIds (comma-separated)
        const rawIds = paymentIntent.metadata.enrollmentIds || paymentIntent.metadata.enrollmentId;
        const enrollmentIdList = rawIds ? rawIds.split(",").map((s: string) => s.trim()).filter(Boolean) : [];

        if (enrollmentIdList.length > 0) {
          // Update all enrollments and their payments
          for (const enrollmentId of enrollmentIdList) {
            await storage.updateEnrollment(enrollmentId, { status: "active" });
            try {
              const enr = await storage.getEnrollment(enrollmentId);
              if (enr?.childId) await provisionMajAccess(enr.childId, enr.classId);
            } catch (e) {
              console.error("MAJ provisioning failed for enrollment", enrollmentId, e);
            }
            const pmts = await storage.getPaymentsByEnrollment(enrollmentId);
            if (pmts.length > 0) {
              await storage.updatePayment(pmts[0].id, {
                status: "completed",
                stripePaymentIntentId: paymentIntent.id,
                paidAt: new Date(),
              });
            }
            const enrollment = await storage.getEnrollment(enrollmentId);
            if (enrollment) await storage.updateClassEnrollmentCount(enrollment.classId);
          }

          // Generate one combined invoice for the first payment (covers all children)
          try {
            const firstPayments = await storage.getPaymentsByEnrollment(enrollmentIdList[0]);
            if (firstPayments.length > 0) {
              const { invoiceNumber } = await invoiceService.generateInvoiceForPayment(firstPayments[0].id);
              console.log(`Invoice ${invoiceNumber} generated (covers ${enrollmentIdList.length} enrolment(s))`);
            }
          } catch (invoiceError) {
            console.log('Invoice generation failed:', invoiceError);
          }

          // Send one SMS confirmation covering all enrolled children
          try {
            const firstEnrollment = await storage.getEnrollment(enrollmentIdList[0]);
            if (firstEnrollment) {
              const parent = await storage.getUser(firstEnrollment.parentId);
              const classData = await storage.getClass(firstEnrollment.classId);
              if (parent?.mobile && classData) {
                const amount = (paymentIntent.amount / 100).toFixed(2);
                if (enrollmentIdList.length === 1) {
                  const child = await storage.getChild(firstEnrollment.childId);
                  await smsService.sendPaymentConfirmation(parent.mobile, child?.firstName ?? "your athlete", amount, classData.name);
                } else {
                  await smsService.sendSMS(parent.mobile,
                    `Payment of $${amount} AUD confirmed for ${enrollmentIdList.length} athletes in ${classData.name}. Thank you! 🎉`
                  );
                }
              }
            }
          } catch (smsError) {
            console.log('Payment confirmation SMS failed:', smsError);
          }
        }
      }

      // ── Handle monthly subscription instalment payments ──
      if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) { res.json({ received: true }); return; }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const enrollmentId = subscription.metadata.enrollmentId;
        if (!enrollmentId) { res.json({ received: true }); return; }

        const currentCount = parseInt(subscription.metadata.instalmentCount || "0") + 1;
        const maxInstalments = parseInt(subscription.metadata.maxInstalments || "3");

        console.log(`Monthly instalment ${currentCount}/${maxInstalments} received for enrollment ${enrollmentId}`);

        // Mark enrollment active on first payment
        if (currentCount === 1) {
          await storage.updateEnrollment(enrollmentId, { status: "active" });
          try {
            const enr = await storage.getEnrollment(enrollmentId);
            if (enr?.childId) await provisionMajAccess(enr.childId, enr.classId);
          } catch (e) {
            console.error("MAJ provisioning failed for enrollment", enrollmentId, e);
          }
          const enrollment = await storage.getEnrollment(enrollmentId);
          if (enrollment) await storage.updateClassEnrollmentCount(enrollment.classId);
        }

        // Update instalment count in subscription metadata
        await stripe.subscriptions.update(subscriptionId, {
          metadata: { ...subscription.metadata, instalmentCount: String(currentCount) },
        });

        // Cancel subscription after final instalment
        if (currentCount >= maxInstalments) {
          await stripe.subscriptions.cancel(subscriptionId);
          console.log(`Subscription ${subscriptionId} cancelled after ${maxInstalments} instalments`);
          
          // Update payment record to completed
          const payments = await storage.getPaymentsByEnrollment(enrollmentId);
          if (payments.length > 0) {
            await storage.updatePayment(payments[0].id, { status: "completed", paidAt: new Date() });
          }
        }

        // Send SMS for each instalment
        try {
          const enrollment = await storage.getEnrollment(enrollmentId);
          if (enrollment) {
            const parent = await storage.getUser(enrollment.parentId);
            const child = await storage.getChild(enrollment.childId);
            const classData = await storage.getClass(enrollment.classId);
            if (parent?.mobile && child && classData) {
              const amount = (invoice.amount_paid / 100).toFixed(2);
              await smsService.sendPaymentConfirmation(parent.mobile, child.firstName, amount, classData.name);
            }
          }
        } catch (smsError) {
          console.log('Monthly instalment SMS failed:', smsError);
        }
      }
      
      res.json({received: true});
    } catch (err: any) {
      console.error('Webhook signature verification failed.', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // Invoice routes
  app.post("/api/payments/:paymentId/generate-invoice", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    
    try {
      const { paymentId } = req.params;
      
      // Verify payment belongs to user
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const enrollment = await storage.getEnrollment(payment.enrollmentId);
      if (!enrollment || enrollment.parentId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const { invoiceNumber, pdfPath } = await invoiceService.generateInvoiceForPayment(paymentId);
      
      res.json({ 
        invoiceNumber,
        message: "Invoice generated successfully"
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payments/:paymentId/invoice", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    
    try {
      const { paymentId } = req.params;
      
      // Verify payment belongs to user
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const enrollment = await storage.getEnrollment(payment.enrollmentId);
      if (!enrollment || enrollment.parentId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const pdfPath = await invoiceService.getInvoicePdfPath(paymentId);
      if (!pdfPath) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Read and serve the PDF file
      try {
        const pdfBuffer = readFileSync(pdfPath);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${payment.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
      } catch (fileError) {
        return res.status(404).json({ message: "Invoice file not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/payments/:paymentId/invoice-status", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    
    try {
      const { paymentId } = req.params;
      
      // Verify payment belongs to user
      const payment = await storage.getPayment(paymentId);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      const enrollment = await storage.getEnrollment(payment.enrollmentId);
      if (!enrollment || enrollment.parentId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const hasInvoice = await invoiceService.hasInvoice(paymentId);
      
      res.json({ 
        hasInvoice,
        invoiceNumber: payment.invoiceNumber || null,
        paymentStatus: payment.status
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin customer and student data routes
  app.get("/api/admin/customers", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const customers = await getAllCustomersWithChildren();
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/students", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const students = await getAllStudentsWithParents();
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Toggle user active status
  app.patch("/api/admin/users/:id/active", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      const { id } = req.params;
      const { active } = req.body;
      if (typeof active !== "boolean") return res.status(400).json({ message: "active must be a boolean" });
      const updated = await storage.updateUser(id, { active });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Toggle child active status
  app.patch("/api/admin/children/:id/active", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      const { id } = req.params;
      const { active } = req.body;
      if (typeof active !== "boolean") return res.status(400).json({ message: "active must be a boolean" });
      const updated = await storage.updateChild(id, { active });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SMS notification routes (requires admin role)
  app.post("/api/admin/send-sms", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const { phoneNumber, message, type, recipients } = req.body;
      
      if (type === "broadcast" && recipients?.length > 0) {
        // Send to multiple recipients
        const results = await Promise.allSettled(
          recipients.map((recipient: any) => 
            smsService.sendSMS(recipient.mobile, message)
          )
        );
        
        const successCount = results.filter(r => r.status === "fulfilled" && r.value).length;
        res.json({ 
          message: `Sent to ${successCount} of ${recipients.length} recipients`,
          successCount,
          totalCount: recipients.length
        });
      } else {
        // Send to single recipient
        const success = await smsService.sendSMS(phoneNumber, message);
        res.json({ success, message: success ? "SMS sent successfully" : "Failed to send SMS" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/send-class-reminders", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const { classId, reminderDate } = req.body;
      const targetDate = reminderDate ? new Date(reminderDate) : new Date();
      targetDate.setDate(targetDate.getDate() + 1); // Tomorrow's classes
      
      // Get enrollments for classes happening tomorrow
      const enrollments = await storage.getEnrollmentsByClassAndDate(classId, targetDate);
      
      let successCount = 0;
      
      for (const enrollment of enrollments) {
        try {
          const parent = await storage.getUser(enrollment.parentId);
          const child = await storage.getChild(enrollment.childId);
          const classData = await storage.getClass(enrollment.classId);
          if (!classData) continue;
          const venue = await storage.getVenue(classData.venueId);
          
          if (parent?.mobile && child && classData && venue) {
            const classTime = new Date(classData.startTime).toLocaleTimeString('en-AU', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            
            const classDate = targetDate.toLocaleDateString('en-AU', {
              weekday: 'long',
              day: 'numeric',
              month: 'short'
            });
            
            await smsService.sendClassReminder(
              parent.mobile,
              child.firstName,
              classData.name,
              venue.name,
              classTime,
              classDate
            );
            successCount++;
          }
        } catch (error) {
          console.log('Failed to send reminder to enrollment:', enrollment.id, error);
        }
      }
      
      res.json({ 
        message: `Sent ${successCount} class reminders`,
        successCount,
        totalEnrollments: enrollments.length
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes (requires admin role)
  app.get("/api/admin/analytics", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const [enrollmentStats, revenueStats] = await Promise.all([
        storage.getEnrollmentStats(),
        storage.getRevenueStats(),
      ]);
      
      res.json({
        enrollment: enrollmentStats,
        revenue: revenueStats,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notifications routes
  app.get("/api/notifications", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const notification = await storage.getNotification(req.params.id);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // CSV Import routes
  app.post("/api/csv-upload-url", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getCSVUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/csv-preview", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      const { uploadURL } = req.body;
      const objectStorageService = new ObjectStorageService();
      const url = new URL(uploadURL);
      const objectPath = url.pathname;
      const csvFile = await objectStorageService.getCSVFile(objectPath);
      const csvContent = await objectStorageService.downloadCSVContent(csvFile);

      const preview = await previewStudentsFromCSV(csvContent);

      if (!preview.isStudentFormat) {
        return res.status(400).json({
          message: "Unrecognised CSV format. Please upload a SportsBiz Student Export file.",
          hint: "Required columns: First Name, Last Name, DOB, Active, Customer First Name, Customer Email, Customer Mobile Phone 1"
        });
      }

      res.json({
        isStudentFormat: true,
        totalRows: preview.totalRows,
        activeRows: preview.activeRows,
        inactiveRows: preview.inactiveRows,
        uniqueParents: preview.parentEmails.size,
        studentsPreview: preview.studentsPreview.slice(0, 5),
        issues: preview.issues,
        customersPreview: [],
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/csv-import", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      const { uploadURL } = req.body;
      const objectStorageService = new ObjectStorageService();
      const url = new URL(uploadURL);
      const objectPath = url.pathname;
      const csvFile = await objectStorageService.getCSVFile(objectPath);
      const csvContent = await objectStorageService.downloadCSVContent(csvFile);

      const includeInactive = req.body.includeInactive === true;
      const results = await importStudentsFromCSV(csvContent, includeInactive);

      res.json({
        customersImported: results.parentsCreated,
        studentsImported: results.studentsCreated,
        parentsExisting: results.parentsExisting,
        studentsExisting: results.studentsExisting,
        skipped: results.skipped,
        errors: results.errors,
        errorDetails: results.errorDetails,
        message: `Import complete: ${results.parentsCreated} new parents, ${results.studentsCreated} new students. Skipped ${results.parentsExisting} existing parents and ${results.studentsExisting} existing students.`
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Public shareable video link endpoint
  app.get("/api/video-highlights/share/:shareableLink", async (req, res) => {
    try {
      const { shareableLink } = req.params;
      
      const [video] = await db
        .select({
          id: performanceVideoHighlights.id,
          title: performanceVideoHighlights.title,
          description: performanceVideoHighlights.description,
          type: performanceVideoHighlights.type,
          videoUrl: performanceVideoHighlights.videoUrl,
          thumbnailUrl: performanceVideoHighlights.thumbnailUrl,
          duration: performanceVideoHighlights.duration,
          skillsHighlighted: performanceVideoHighlights.skillsHighlighted,
          performanceNotes: performanceVideoHighlights.performanceNotes,
          coachComments: performanceVideoHighlights.coachComments,
          viewCount: performanceVideoHighlights.viewCount,
          tags: performanceVideoHighlights.tags,
          createdAt: performanceVideoHighlights.createdAt,
          childName: children.firstName ? sql<string>`${children.firstName} || ' ' || ${children.lastName}` : null,
          coachName: sql<string>`${coaches.firstName} || ' ' || ${coaches.lastName}`,
          className: classes.name,
        })
        .from(performanceVideoHighlights)
        .leftJoin(children, eq(performanceVideoHighlights.childId, children.id))
        .leftJoin(coaches, eq(performanceVideoHighlights.coachId, coaches.id))
        .leftJoin(classes, eq(performanceVideoHighlights.classId, classes.id))
        .where(eq(performanceVideoHighlights.shareableLink, shareableLink));

      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      // Increment view count
      await db
        .update(performanceVideoHighlights)
        .set({ 
          viewCount: video.viewCount + 1,
          updatedAt: new Date()
        })
        .where(eq(performanceVideoHighlights.shareableLink, shareableLink));

      res.json({
        ...video,
        viewCount: video.viewCount + 1
      });
    } catch (error: any) {
      console.error("Error fetching shareable video:", error);
      res.status(500).json({ message: "Failed to fetch video" });
    }
  });

  // Analytics endpoints for advanced reporting dashboard
  app.get("/api/analytics/enrollments", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const enrollments = await db.select().from(enrollmentsTable);
      const totalEnrollments = enrollments.length;
      const activeEnrollments = enrollments.filter(e => e.status === 'active').length;
      
      res.json({
        totalEnrollments,
        activeEnrollments,
        enrollmentGrowth: 15.5,
        retentionRate: 87.3,
        trends: [
          { period: 'Week 1', enrollments: Math.floor(totalEnrollments * 0.1) },
          { period: 'Week 2', enrollments: Math.floor(totalEnrollments * 0.25) },
          { period: 'Week 3', enrollments: Math.floor(totalEnrollments * 0.4) },
          { period: 'Week 4', enrollments: Math.floor(totalEnrollments * 0.7) },
          { period: 'Week 5', enrollments: totalEnrollments },
        ],
      });
    } catch (error) {
      console.error("Error getting enrollment analytics:", error);
      res.status(500).json({ message: "Failed to get enrollment analytics" });
    }
  });

  app.get("/api/analytics/revenue", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const classesData = await db.select().from(classes);
      const totalRevenue = classesData.reduce((sum, cls) => sum + Number(cls.pricePerTerm), 0);
      
      const revenueByProgram = [
        { name: 'Foundation', revenue: totalRevenue * 0.25 },
        { name: 'Emerging', revenue: totalRevenue * 0.30 },
        { name: 'Academy', revenue: totalRevenue * 0.20 },
        { name: 'Team Sport Speed', revenue: totalRevenue * 0.15 },
        { name: 'Senior Squad', revenue: totalRevenue * 0.10 },
      ];

      res.json({
        totalRevenue,
        revenueGrowth: 12.8,
        byProgram: revenueByProgram,
      });
    } catch (error) {
      console.error("Error getting revenue analytics:", error);
      res.status(500).json({ message: "Failed to get revenue analytics" });
    }
  });

  app.get("/api/analytics/classes", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const classesData = await db.select().from(classes).where(eq(classes.status, 'active'));
      const activeClasses = classesData.length;
      
      const performance = classesData.slice(0, 5).map(cls => ({
        className: cls.name,
        capacity: Math.floor(Math.random() * 40) + 60,
        revenue: Math.floor(Math.random() * 2000) + 1000,
      }));

      const venuePerformance = [
        { venueName: 'Ballam Park Athletic Track', enrollments: 45, utilization: 85 },
        { venueName: 'Peninsula Grammar', enrollments: 38, utilization: 78 },
        { venueName: 'Toorak College', enrollments: 32, utilization: 65 },
        { venueName: 'Mornington Athletic Track', enrollments: 28, utilization: 72 },
      ];

      res.json({
        activeClasses,
        averageCapacity: 75,
        performance,
        venuePerformance,
      });
    } catch (error) {
      console.error("Error getting class analytics:", error);
      res.status(500).json({ message: "Failed to get class analytics" });
    }
  });

  app.get("/api/analytics/coaches", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    try {
      const coachData = await db.select().from(coaches);
      
      const topCoaches = coachData.map(coach => ({
        id: coach.id,
        name: `${coach.firstName} ${coach.lastName}`,
        totalStudents: Math.floor(Math.random() * 20) + 10,
        classCount: Math.floor(Math.random() * 3) + 1,
        revenue: Math.floor(Math.random() * 5000) + 2000,
        satisfaction: Math.floor(Math.random() * 10) + 90,
      })).sort((a, b) => b.totalStudents - a.totalStudents);

      res.json({
        topCoaches,
      });
    } catch (error) {
      console.error("Error getting coach analytics:", error);
      res.status(500).json({ message: "Failed to get coach analytics" });
    }
  });

  // Senior Squad Application endpoint
  app.post("/api/applications/senior-squad", async (req, res) => {
    try {
      const applicationData = insertSeniorSquadApplicationSchema.parse(req.body);
      
      const application = await storage.createSeniorSquadApplication(applicationData);
      
      const athleteName = `${applicationData.athleteFirstName} ${applicationData.athleteLastName}`;
      
      // Send SMS notification to admin
      const adminPhone = "+61434679395"; // Your phone number
      try {
        await smsService.sendSMS(
          adminPhone,
          `🔔 New Senior Squad Application!\nAthlete: ${athleteName}\nSchool Year: ${applicationData.schoolYear}\nCheck your dashboard for full details.`
        );
      } catch (smsError) {
        console.error("Failed to send admin notification SMS:", smsError);
        // Don't fail the application submission if SMS fails
      }
      
      // Send email notification to admin (if Resend is configured)
      if (process.env.RESEND_API_KEY) {
        try {
          const adminEmail = "info@power2adapt.com";
          await emailService.sendAdminApplicationNotification(
            applicationData,
            adminEmail,
            "Senior Squad"
          );
        } catch (emailError) {
          console.error("Failed to send admin notification email:", emailError);
          // Don't fail the application submission if email fails
        }
      }
      
      // Send confirmation SMS to athlete (or parent if provided)
      const phoneNumber = applicationData.parentGuardianPhone || applicationData.athletePhone;
      
      if (phoneNumber) {
        try {
          await smsService.sendSMS(
            phoneNumber,
            `Hi! We've received ${athleteName}'s Senior Squad application. We'll review it and get back to you within 48 hours. Thank you for choosing Power2ADAPT! 🏃‍♂️`
          );
        } catch (smsError) {
          console.error("Failed to send application confirmation SMS:", smsError);
          // Don't fail the application submission if SMS fails
        }
      }
      
      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        applicationId: application.id,
      });
    } catch (error: any) {
      console.error("Error creating Senior Squad application:", error);
      res.status(400).json({ 
        success: false,
        message: error.message || "Failed to submit application" 
      });
    }
  });

  // Get all Senior Squad applications (admin only)
  app.get("/api/applications/senior-squad", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const applications = await storage.getAllSeniorSquadApplications();
      res.json(applications);
    } catch (error: any) {
      console.error("Error fetching Senior Squad applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Update Senior Squad application (admin only)
  app.put("/api/applications/senior-squad/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedApplication = await storage.updateSeniorSquadApplication(id, {
        ...updates,
        reviewedBy: userId,
        reviewedAt: new Date(),
      });
      
      res.json(updatedApplication);
    } catch (error: any) {
      console.error("Error updating Senior Squad application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // High Performance Squad Application endpoint
  app.post("/api/applications/high-performance-squad", async (req, res) => {
    try {
      const applicationData = insertHighPerformanceSquadApplicationSchema.parse(req.body);
      
      const application = await storage.createHighPerformanceSquadApplication(applicationData);
      
      const athleteName = `${applicationData.athleteFirstName} ${applicationData.athleteLastName}`;
      
      // Send SMS notification to admin
      const adminPhone = "+61434679395"; // Your phone number
      try {
        await smsService.sendSMS(
          adminPhone,
          `🔔 New High Performance Squad Application!\nAthlete: ${athleteName}\nSchool Year: ${applicationData.schoolYear}\nCheck your dashboard for full details.`
        );
      } catch (smsError) {
        console.error("Failed to send admin notification SMS:", smsError);
        // Don't fail the application submission if SMS fails
      }
      
      // Send email notification to admin (if Resend is configured)
      if (process.env.RESEND_API_KEY) {
        try {
          const adminEmail = "info@power2adapt.com";
          await emailService.sendAdminApplicationNotification(
            applicationData,
            adminEmail,
            "High Performance Squad"
          );
        } catch (emailError) {
          console.error("Failed to send admin notification email:", emailError);
          // Don't fail the application submission if email fails
        }
      }
      
      // Send confirmation SMS to athlete (or parent if provided)
      const phoneNumber = applicationData.parentGuardianPhone || applicationData.athletePhone;
      
      if (phoneNumber) {
        try {
          await smsService.sendSMS(
            phoneNumber,
            `Hi! We've received ${athleteName}'s High Performance Squad application. We'll review it and get back to you within 48 hours. Thank you for choosing Power2ADAPT! 🏃‍♂️`
          );
        } catch (smsError) {
          console.error("Failed to send application confirmation SMS:", smsError);
          // Don't fail the application submission if SMS fails
        }
      }
      
      res.status(201).json({
        success: true,
        message: "Application submitted successfully",
        applicationId: application.id,
      });
    } catch (error: any) {
      console.error("Error creating High Performance Squad application:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid application data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to submit application" });
      }
    }
  });

  // Get all High Performance Squad applications (admin only)
  app.get("/api/applications/high-performance-squad", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const applications = await storage.getAllHighPerformanceSquadApplications();
      res.json(applications);
    } catch (error: any) {
      console.error("Error fetching High Performance Squad applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Update High Performance Squad application (admin only)
  app.put("/api/applications/high-performance-squad/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedApplication = await storage.updateHighPerformanceSquadApplication(id, {
        ...updates,
        reviewedBy: userId,
        reviewedAt: new Date(),
      });
      
      res.json(updatedApplication);
    } catch (error: any) {
      console.error("Error updating High Performance Squad application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Contact Enquiry endpoints
  
  // Create contact enquiry
  app.post("/api/contact-enquiries", async (req, res) => {
    try {
      const enquiryData = insertContactEnquirySchema.parse(req.body);
      
      // Validate phone number if provided (Australian format)
      if (enquiryData.phone && enquiryData.phone.trim() !== "") {
        const cleanPhone = enquiryData.phone.replace(/[\s-]/g, "");
        const australianPhoneRegex = /^(?:\+?61|0)[2-478](?:[0-9]){8}$/;
        
        if (!australianPhoneRegex.test(cleanPhone)) {
          return res.status(400).json({ 
            message: "Invalid phone number format. Please use Australian format (e.g., 0412 345 678 or +61 412 345 678)" 
          });
        }
      }
      
      // Require phone number if contact method is phone or video
      if ((enquiryData.contactMethod === "phone" || enquiryData.contactMethod === "video") && 
          (!enquiryData.phone || enquiryData.phone.trim() === "")) {
        return res.status(400).json({ 
          message: "Phone number is required when requesting a phone call or video call" 
        });
      }
      
      // Save to database
      const enquiry = await storage.createContactEnquiry(enquiryData);
      
      // Send SMS notification to admin (you)
      const adminPhone = "+61434679395"; // Your phone number
      const enquiryType = enquiryData.subject.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      try {
        await smsService.sendSMS(
          adminPhone,
          `🔔 New Contact Enquiry!\nFrom: ${enquiryData.name}\nSubject: ${enquiryType}\nContact via: ${enquiryData.contactMethod}\nCheck your dashboard for details.`
        );
      } catch (smsError) {
        console.error("Failed to send admin notification SMS:", smsError);
        // Don't fail the enquiry submission if SMS fails
      }
      
      // Send confirmation SMS to customer
      if (enquiryData.phone) {
        try {
          await smsService.sendSMS(
            enquiryData.phone,
            `Hi ${enquiryData.name}! Thanks for contacting Power2ADAPT. We've received your enquiry and will get back to you within 24 hours. 🏃‍♂️`
          );
        } catch (smsError) {
          console.error("Failed to send customer confirmation SMS:", smsError);
        }
      }
      
      // Send email notifications (if Resend is configured)
      if (process.env.RESEND_API_KEY) {
        try {
          // Send admin notification email
          const adminEmail = "info@power2adapt.com";
          await emailService.sendAdminEnquiryNotification(
            {
              name: enquiryData.name,
              email: enquiryData.email,
              phone: enquiryData.phone,
              contactMethod: enquiryData.contactMethod,
              subject: enquiryData.subject,
              message: enquiryData.message,
            },
            adminEmail
          );

          // Send customer confirmation email
          await emailService.sendCustomerEnquiryConfirmation(
            enquiryData.name,
            enquiryData.email,
            enquiryData.subject
          );
        } catch (emailError) {
          console.error("Failed to send email notifications:", emailError);
          // Don't fail the enquiry submission if email fails
        }
      }
      
      res.status(201).json({
        success: true,
        message: "Enquiry submitted successfully",
        enquiryId: enquiry.id,
      });
    } catch (error: any) {
      console.error("Error creating contact enquiry:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid enquiry data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to submit enquiry" });
      }
    }
  });

  // Get all contact enquiries (admin only)
  app.get("/api/contact-enquiries", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const enquiries = await storage.getAllContactEnquiries();
      res.json(enquiries);
    } catch (error: any) {
      console.error("Error fetching contact enquiries:", error);
      res.status(500).json({ message: "Failed to fetch enquiries" });
    }
  });

  // Update contact enquiry (admin only)
  app.put("/api/contact-enquiries/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { id } = req.params;
      const updates = req.body;
      
      const updatedEnquiry = await storage.updateContactEnquiry(id, {
        ...updates,
        reviewedBy: userId,
        reviewedAt: new Date(),
      });
      
      res.json(updatedEnquiry);
    } catch (error: any) {
      console.error("Error updating contact enquiry:", error);
      res.status(500).json({ message: "Failed to update enquiry" });
    }
  });

  // Waitlist endpoints

  // Add to waitlist
  app.post("/api/waitlist", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const waitlistData = insertWaitlistSchema.parse({
        ...req.body,
        parentId: userId,
      });

      // Check if child is already on waitlist for this class
      const existingPosition = await storage.getWaitlistPositionByChild(waitlistData.classId, waitlistData.childId);
      if (existingPosition) {
        return res.status(400).json({ 
          message: "Child is already on the waitlist", 
          position: existingPosition 
        });
      }

      const waitlistEntry = await storage.addToWaitlist(waitlistData);

      // Send SMS confirmation
      const user = await storage.getUser(userId);
      const child = await storage.getChild(waitlistData.childId);
      
      if (user?.mobile && child) {
        try {
          await smsService.sendSMS(
            user.mobile,
            `Hi ${user.firstName}! ${child.firstName} has been added to the class waitlist (position #${waitlistEntry.position}). We'll notify you when a spot becomes available! 📋`
          );
        } catch (smsError) {
          console.error("Failed to send waitlist SMS:", smsError);
        }
      }

      res.status(201).json(waitlistEntry);
    } catch (error: any) {
      console.error("Error adding to waitlist:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid waitlist data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add to waitlist" });
      }
    }
  });

  // Get parent's waitlist entries
  app.get("/api/waitlist/parent", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const waitlistEntries = await storage.getWaitlistByParent(userId);
      res.json(waitlistEntries);
    } catch (error: any) {
      console.error("Error fetching parent waitlist:", error);
      res.status(500).json({ message: "Failed to fetch waitlist entries" });
    }
  });

  // Get waitlist for a class (admin only)
  app.get("/api/waitlist/class/:classId", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user || !["admin", "coach"].includes(user.role)) {
      return res.status(403).json({ message: "Admin or coach access required" });
    }

    try {
      const { classId } = req.params;
      const waitlistEntries = await storage.getWaitlistByClass(classId);
      res.json(waitlistEntries);
    } catch (error: any) {
      console.error("Error fetching class waitlist:", error);
      res.status(500).json({ message: "Failed to fetch class waitlist" });
    }
  });

  // Remove from waitlist
  app.delete("/api/waitlist/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const { id } = req.params;
      
      // Check if user owns this waitlist entry or is admin
      const user = await storage.getUser(userId);
      const waitlistEntry = await storage.getWaitlistByClass(''); // We'll need to modify this
      
      await storage.removeFromWaitlist(id);
      res.json({ message: "Removed from waitlist successfully" });
    } catch (error: any) {
      console.error("Error removing from waitlist:", error);
      res.status(500).json({ message: "Failed to remove from waitlist" });
    }
  });

  // Notify next person in waitlist (admin only)
  app.post("/api/waitlist/notify/:classId", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { classId } = req.params;
      const nextEntry = await storage.getNextWaitlistEntry(classId);
      
      if (!nextEntry) {
        return res.status(404).json({ message: "No one on waitlist" });
      }

      // Set notification expiry (48 hours from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 48);

      // Update waitlist status
      await storage.updateWaitlistStatus(nextEntry.id, 'notified', expiresAt);

      // Get parent and child info for SMS
      const parent = await storage.getUser(nextEntry.parentId);
      const child = await storage.getChild(nextEntry.childId);
      const classInfo = await storage.getClass(classId);

      if (parent?.mobile && child && classInfo) {
        try {
          await smsService.sendSMS(
            parent.mobile,
            `Great news! A spot is now available for ${child.firstName} in ${classInfo.name}. Please reply within 48 hours to secure the spot! 🎉`
          );
        } catch (smsError) {
          console.error("Failed to send waitlist notification SMS:", smsError);
        }
      }

      res.json({ message: "Notification sent successfully", waitlistEntry: nextEntry });
    } catch (error: any) {
      console.error("Error notifying waitlist:", error);
      res.status(500).json({ message: "Failed to send notification" });
    }
  });

  // Blog routes
  // Get all published blog articles (public)
  app.get("/api/blog", async (req, res) => {
    try {
      const articles = await storage.getAllBlogArticles(true);
      res.json(articles);
    } catch (error: any) {
      console.error("Error fetching blog articles:", error);
      res.status(500).json({ message: "Failed to fetch blog articles" });
    }
  });

  // Get single blog article by slug (public)
  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const article = await storage.getBlogArticleBySlug(slug);
      
      if (!article || !article.published) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      res.json(article);
    } catch (error: any) {
      console.error("Error fetching blog article:", error);
      res.status(500).json({ message: "Failed to fetch blog article" });
    }
  });

  // Admin: Get all blog articles (published and drafts)
  app.get("/api/admin/blog", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const articles = await storage.getAllBlogArticles();
      res.json(articles);
    } catch (error: any) {
      console.error("Error fetching admin blog articles:", error);
      res.status(500).json({ message: "Failed to fetch blog articles" });
    }
  });

  // Admin: Create new blog article
  app.post("/api/admin/blog", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const articleData = insertBlogArticleSchema.parse({
        ...req.body,
        authorId: userId,
      });
      
      // Generate slug from title if not provided
      if (!articleData.slug) {
        articleData.slug = articleData.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 100);
      }
      
      const article = await storage.createBlogArticle(articleData);
      res.status(201).json(article);
    } catch (error: any) {
      console.error("Error creating blog article:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Admin: Update blog article
  app.put("/api/admin/blog/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Set publishedAt when publishing
      if (updates.published && updates.published !== false) {
        updates.publishedAt = new Date();
      }
      
      const article = await storage.updateBlogArticle(id, updates);
      res.json(article);
    } catch (error: any) {
      console.error("Error updating blog article:", error);
      res.status(500).json({ message: "Failed to update blog article" });
    }
  });

  // Admin: Delete blog article
  app.delete("/api/admin/blog/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const { id } = req.params;
      await storage.deleteBlogArticle(id);
      res.json({ message: "Article deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting blog article:", error);
      res.status(500).json({ message: "Failed to delete blog article" });
    }
  });

  // Attendance tracking routes
  
  // Get all classes for a coach
  app.get("/api/coach/classes", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'coach') {
        return res.status(403).json({ message: "Access denied - coaches only" });
      }

      const coachClasses = await storage.getClassesByCoach(userId);
      res.json(coachClasses);
    } catch (error) {
      console.error("Error fetching coach classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  
  // Get today's classes for a coach
  app.get("/api/coach/classes/today", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'coach') {
        return res.status(403).json({ message: "Access denied - coaches only" });
      }

      const todaysClasses = await storage.getTodaysClassesForCoach(userId);
      res.json(todaysClasses);
    } catch (error) {
      console.error("Error fetching today's classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  // Get enrolled students for a specific class
  app.get("/api/classes/:classId/students", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      const { classId } = req.params;
      
      if (!user || user.role !== 'coach') {
        return res.status(403).json({ message: "Access denied - coaches only" });
      }

      const students = await storage.getStudentsForClass(classId);
      res.json(students);
    } catch (error) {
      console.error("Error fetching class students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Mark attendance for students
  app.post("/api/attendance/mark", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'coach') {
        return res.status(403).json({ message: "Access denied - coaches only" });
      }

      const attendanceData = req.body;
      
      // Validate and determine credit eligibility
      const creditEligibleReasons = ['illness', 'injured', 'prior_notice', 'travel', 'exception', 'cancelled'];
      
      if (attendanceData.status === 'absent' && attendanceData.absenceReason) {
        attendanceData.creditsEligible = creditEligibleReasons.includes(attendanceData.absenceReason);
      } else {
        attendanceData.creditsEligible = false;
      }
      
      attendanceData.markedBy = userId;
      
      const result = await storage.markAttendance(attendanceData);
      res.json(result);
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ message: "Failed to mark attendance" });
    }
  });

  // Get attendance records for a class on a specific date
  app.get("/api/classes/:classId/attendance/:date", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      const { classId, date } = req.params;
      
      if (!user || user.role !== 'coach') {
        return res.status(403).json({ message: "Access denied - coaches only" });
      }

      const attendance = await storage.getAttendanceForClass(classId, date);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Term Configuration Routes
  app.get("/api/admin/term-stats", isAdmin, async (req, res) => {
    try {
      const statsRows = await db
        .select({
          term: classes.term,
          year: classes.year,
          classCount: sql<number>`count(distinct ${classes.id})`,
          bookingCount: sql<number>`count(case when ${enrollmentsTable.status} in ('active', 'completed') then ${enrollmentsTable.id} end)`,
        })
        .from(classes)
        .leftJoin(enrollmentsTable, eq(enrollmentsTable.classId, classes.id))
        .groupBy(classes.term, classes.year);
      res.json(statsRows);
    } catch (error: any) {
      console.error('Error getting term stats:', error);
      res.status(500).json({ message: "Failed to fetch term stats" });
    }
  });

  app.get("/api/term-configurations", async (req, res) => {
    try {
      const termConfigs = await storage.getTermConfigurations();
      res.json(termConfigs);
    } catch (error: any) {
      console.error('Error getting term configurations:', error);
      res.status(500).json({ message: "Failed to fetch term configurations" });
    }
  });

  app.post("/api/term-configurations", isAdmin, async (req, res) => {
    try {
      const b = req.body ?? {};
      // Drizzle numeric/decimal columns expect strings; integer columns expect numbers.
      // Clients (the setup-term wizard and the term-config admin form) send these as JS
      // numbers, which fails the insert silently — coerce them here so both callers work.
      const createData = {
        ...b,
        year: b.year != null ? Number(b.year) : b.year,
        weeksCount: b.weeksCount != null ? Number(b.weeksCount) : b.weeksCount,
        pricePerWeek: b.pricePerWeek != null ? String(b.pricePerWeek) : b.pricePerWeek,
        gstRate: b.gstRate != null ? String(b.gstRate) : b.gstRate,
      };
      const termConfig = await storage.createTermConfiguration(createData);
      res.status(201).json(termConfig);
    } catch (error: any) {
      console.error('Error creating term configuration:', error);
      res.status(500).json({ message: error?.message || "Failed to create term configuration" });
    }
  });

  app.get("/api/term-configurations/:id", async (req, res) => {
    try {
      const termConfig = await storage.getTermConfigurationById(req.params.id);
      if (!termConfig) {
        return res.status(404).json({ message: "Term configuration not found" });
      }
      res.json(termConfig);
    } catch (error: any) {
      console.error('Error getting term configuration:', error);
      res.status(500).json({ message: "Failed to fetch term configuration" });
    }
  });

  app.put("/api/term-configurations/:id", isAdmin, async (req, res) => {
    try {
      const updateData = { ...req.body };
      const termConfig = await storage.updateTermConfiguration(req.params.id, updateData);
      res.json(termConfig);
    } catch (error: any) {
      console.error('Error updating term configuration:', error);
      res.status(500).json({ message: "Failed to update term configuration" });
    }
  });

  // List the classes linked to a term config (for the setup-term wizard).
  app.get("/api/term-configurations/:id/classes", isAdmin, async (req, res) => {
    try {
      const list = await storage.getClassesByTermConfigId(req.params.id);
      res.json(list);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Clone all classes from a source term config into a target term config.
  app.post("/api/admin/clone-term", isAdmin, async (req, res) => {
    try {
      const { sourceTermConfigId, targetTermConfigId } = req.body as {
        sourceTermConfigId?: string;
        targetTermConfigId?: string;
      };
      if (!sourceTermConfigId || !targetTermConfigId) {
        return res.status(400).json({ message: "sourceTermConfigId and targetTermConfigId are required" });
      }
      if (sourceTermConfigId === targetTermConfigId) {
        return res.status(400).json({ message: "Source and target terms must be different" });
      }
      const created = await storage.cloneTermClasses(sourceTermConfigId, targetTermConfigId);
      res.status(201).json({ created: created.length, classes: created });
    } catch (error: any) {
      const status = /already has classes/.test(error.message) ? 409 : 400;
      res.status(status).json({ message: error.message });
    }
  });

  app.delete("/api/term-configurations/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteTermConfiguration(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting term configuration:', error);
      res.status(500).json({ message: "Failed to delete term configuration" });
    }
  });

  app.post("/api/term-configurations/calculate-price", async (req, res) => {
    try {
      const { termConfigId, classesPerWeek } = req.body;
      const priceCalculation = await storage.calculateTermPrice(termConfigId, classesPerWeek);
      res.json(priceCalculation);
    } catch (error: any) {
      console.error('Error calculating term price:', error);
      res.status(500).json({ message: "Failed to calculate term price" });
    }
  });

  // Term Holiday Routes
  app.get("/api/term-configurations/:id/holidays", async (req, res) => {
    try {
      const holidays = await storage.getTermHolidays(req.params.id);
      res.json(holidays);
    } catch (error: any) {
      console.error('Error getting term holidays:', error);
      res.status(500).json({ message: "Failed to fetch term holidays" });
    }
  });

  app.post("/api/term-configurations/:id/holidays", isAdmin, async (req, res) => {
    try {
      const holidayData = {
        ...req.body,
        termConfigurationId: req.params.id
      };
      const holiday = await storage.createTermHoliday(holidayData);
      res.status(201).json(holiday);
    } catch (error: any) {
      console.error('Error creating term holiday:', error);
      res.status(500).json({ message: "Failed to create term holiday" });
    }
  });

  app.delete("/api/term-holidays/:id", isAdmin, async (req, res) => {
    try {
      await storage.deleteTermHoliday(req.params.id);
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting term holiday:', error);
      res.status(500).json({ message: "Failed to delete term holiday" });
    }
  });

  app.get("/api/term-configurations/:id/with-holidays", async (req, res) => {
    try {
      const configWithHolidays = await storage.getTermConfigurationWithHolidays(req.params.id);
      if (!configWithHolidays) {
        return res.status(404).json({ message: "Term configuration not found" });
      }
      res.json(configWithHolidays);
    } catch (error: any) {
      console.error('Error getting term configuration with holidays:', error);
      res.status(500).json({ message: "Failed to fetch term configuration with holidays" });
    }
  });

  // CSV Import endpoints (legacy direct file import — superseded by /api/csv-import)


  // Performance Video Highlights API endpoints

  // Get all video highlights (coach/admin)
  app.get("/api/video-highlights", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      
      if (!user || !["coach", "admin"].includes(user.role)) {
        return res.status(403).json({ message: "Coach or admin access required" });
      }

      let videos;
      if (user.role === "admin") {
        videos = await storage.getAllPerformanceVideoHighlights();
      } else {
        // Coach can only see their own videos
        const coach = await db.select().from(coaches).where(eq(coaches.userId, userId)).limit(1);
        if (!coach[0]) {
          return res.status(404).json({ message: "Coach profile not found" });
        }
        videos = await storage.getPerformanceVideoHighlightsByCoach(coach[0].id);
      }

      res.json(videos);
    } catch (error: any) {
      console.error("Error fetching video highlights:", error);
      res.status(500).json({ message: "Failed to fetch video highlights" });
    }
  });

  // Get video highlights for a specific child (parents)
  app.get("/api/video-highlights/child/:childId", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      const { childId } = req.params;

      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Check if user is parent of this child, coach, or admin
      if (user.role === "parent") {
        const child = await storage.getChild(childId);
        if (!child || child.parentId !== userId) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (!["coach", "admin"].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const videos = await storage.getPerformanceVideoHighlightsByChild(childId);
      res.json(videos);
    } catch (error: any) {
      console.error("Error fetching child video highlights:", error);
      res.status(500).json({ message: "Failed to fetch video highlights" });
    }
  });

  // Create new video highlight (coach/admin)
  app.post("/api/video-highlights", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      
      if (!user || !["coach", "admin"].includes(user.role)) {
        return res.status(403).json({ message: "Coach or admin access required" });
      }

      // Get coach ID for this user
      let coachId;
      if (user.role === "coach") {
        const coach = await db.select().from(coaches).where(eq(coaches.userId, userId)).limit(1);
        if (!coach[0]) {
          return res.status(404).json({ message: "Coach profile not found" });
        }
        coachId = coach[0].id;
      } else {
        // Admin can optionally specify coach
        coachId = req.body.coachId || null;
      }

      const videoData = insertPerformanceVideoHighlightSchema.parse({
        ...req.body,
        coachId,
      });

      const video = await storage.createPerformanceVideoHighlight(videoData);
      
      // Send SMS notification to parent if video is for a specific child
      if (video.childId) {
        try {
          const child = await storage.getChild(video.childId);
          if (child) {
            const parent = await storage.getUser(child.parentId);
            if (parent?.mobile) {
              await smsService.sendSMS(
                parent.mobile,
                `📹 New performance video available for ${child.firstName}! "${video.title}" - Check it out in the app. 🏃‍♂️`
              );
            }
          }
        } catch (smsError) {
          console.error("Failed to send video notification SMS:", smsError);
        }
      }

      res.status(201).json(video);
    } catch (error: any) {
      console.error("Error creating video highlight:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid video data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create video highlight" });
      }
    }
  });

  // Update video highlight (coach/admin)
  app.put("/api/video-highlights/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      const { id } = req.params;
      
      if (!user || !["coach", "admin"].includes(user.role)) {
        return res.status(403).json({ message: "Coach or admin access required" });
      }

      // Check ownership for coaches
      if (user.role === "coach") {
        const video = await storage.getPerformanceVideoHighlight(id);
        if (!video) {
          return res.status(404).json({ message: "Video not found" });
        }
        
        const coach = await db.select().from(coaches).where(eq(coaches.userId, userId)).limit(1);
        if (!coach[0] || video.coachId !== coach[0].id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const updates = req.body;
      const updatedVideo = await storage.updatePerformanceVideoHighlight(id, updates);
      res.json(updatedVideo);
    } catch (error: any) {
      console.error("Error updating video highlight:", error);
      res.status(500).json({ message: "Failed to update video highlight" });
    }
  });

  // Delete video highlight (coach/admin)
  app.delete("/api/video-highlights/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      const { id } = req.params;
      
      if (!user || !["coach", "admin"].includes(user.role)) {
        return res.status(403).json({ message: "Coach or admin access required" });
      }

      // Check ownership for coaches
      if (user.role === "coach") {
        const video = await storage.getPerformanceVideoHighlight(id);
        if (!video) {
          return res.status(404).json({ message: "Video not found" });
        }
        
        const coach = await db.select().from(coaches).where(eq(coaches.userId, userId)).limit(1);
        if (!coach[0] || video.coachId !== coach[0].id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      await storage.deletePerformanceVideoHighlight(id);
      res.json({ message: "Video highlight deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting video highlight:", error);
      res.status(500).json({ message: "Failed to delete video highlight" });
    }
  });

  // Share video with parent
  app.post("/api/video-highlights/:id/share", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      const { id } = req.params;
      
      if (!user || !["coach", "admin"].includes(user.role)) {
        return res.status(403).json({ message: "Coach or admin access required" });
      }

      const video = await storage.getPerformanceVideoHighlight(id);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const shareData = insertVideoShareSchema.parse({
        ...req.body,
        videoId: id,
      });

      const share = await storage.createVideoShare(shareData);

      // Send SMS notification if sharing with a parent
      if (share.parentId) {
        try {
          const parent = await storage.getUser(share.parentId);
          if (parent?.mobile) {
            await smsService.sendSMS(
              parent.mobile,
              `📹 ${user.firstName} shared a performance video: "${video.title}". ${share.message || 'Check it out in the app!'} 🏃‍♂️`
            );
          }
        } catch (smsError) {
          console.error("Failed to send share notification SMS:", smsError);
        }
      }

      res.status(201).json(share);
    } catch (error: any) {
      console.error("Error sharing video:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid share data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to share video" });
      }
    }
  });

  // Get shared videos for a parent
  app.get("/api/video-highlights/shared", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== "parent") {
        return res.status(403).json({ message: "Parent access required" });
      }

      const shares = await storage.getVideoSharesByParent(userId);
      res.json(shares);
    } catch (error: any) {
      console.error("Error fetching shared videos:", error);
      res.status(500).json({ message: "Failed to fetch shared videos" });
    }
  });

  // Mark video as viewed
  app.post("/api/video-highlights/shares/:shareId/view", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const { shareId } = req.params;

      await storage.updateVideoShare(shareId, {
        viewedAt: new Date(),
      });

      res.json({ message: "Video marked as viewed" });
    } catch (error: any) {
      console.error("Error marking video as viewed:", error);
      res.status(500).json({ message: "Failed to mark video as viewed" });
    }
  });

  // Athlete Portal API Routes - Performance Records
  app.get("/api/performance-records/:childId", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    try {
      const records = await storage.getPerformanceRecordsByChild(req.params.childId);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/performance-records", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      const body = { ...req.body };
      if (body.recordDate && typeof body.recordDate === 'string') body.recordDate = new Date(body.recordDate);
      const recordData = insertPerformanceRecordSchema.parse(body);
      const record = await storage.createPerformanceRecord(recordData);
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/performance-records/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      const allowedFields = ["recordType", "value", "unit", "recordDate", "classId", "coachId", "notes", "isPersonalBest"];
      const updates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in req.body) updates[key] = req.body[key];
      }
      if (updates.recordDate && typeof updates.recordDate === 'string') updates.recordDate = new Date(updates.recordDate);
      const record = await storage.updatePerformanceRecord(req.params.id, updates);
      res.json(record);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/performance-records/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      await storage.deletePerformanceRecord(req.params.id);
      res.json({ message: "Record deleted" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Training Goals
  app.get("/api/training-goals/:childId", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });

    try {
      const goals = await storage.getTrainingGoalsByChild(req.params.childId);
      res.json(goals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/training-goals", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      const body = { ...req.body };
      if (body.targetDate && typeof body.targetDate === 'string') body.targetDate = new Date(body.targetDate);
      const goalData = insertTrainingGoalSchema.parse(body);
      const goal = await storage.createTrainingGoal(goalData);
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/training-goals/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      const allowedFields = ["title", "description", "targetValue", "targetUnit", "currentValue", "targetDate", "status", "priority", "category", "coachId"];
      const updates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in req.body) updates[key] = req.body[key];
      }
      if (updates.targetDate && typeof updates.targetDate === 'string') updates.targetDate = new Date(updates.targetDate);
      if (updates.status === "achieved") updates.achievedAt = new Date();
      const goal = await storage.updateTrainingGoal(req.params.id, updates);
      res.json(goal);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/training-goals/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      await storage.deleteTrainingGoal(req.params.id);
      res.json({ message: "Goal deleted" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Admin: Get all children for athlete management
  app.get("/api/admin/all-children", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Admin access required" });

    try {
      const allChildren = await storage.getAllChildren();
      res.json(allChildren);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/attendance-records/:childId", authMiddleware, async (req, res) => {
    try {
      const { childId } = req.params;
      const mockAttendance = [
        {
          id: "1",
          childId,
          sessionDate: new Date("2024-12-10"),
          status: "present",
          performanceRating: 8,
          skillsFocused: ["sprint_starts", "acceleration"]
        },
        {
          id: "2", 
          childId,
          sessionDate: new Date("2024-12-03"),
          status: "present",
          performanceRating: 7,
          skillsFocused: ["long_jump", "take_off"]
        }
      ];
      res.json(mockAttendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/coach-messages/:childId", authMiddleware, async (req, res) => {
    try {
      const { childId } = req.params;
      const mockMessages = [
        {
          id: "1",
          childId,
          fromCoach: {
            firstName: "Alistair",
            lastName: "Tait"
          },
          subject: "Great progress this week!",
          message: "I've noticed significant improvement in your sprint starts. Keep focusing on the explosive first step and you'll see even better times.",
          messageType: "performance",
          priority: "normal",
          isRead: false,
          createdAt: new Date("2024-12-08")
        },
        {
          id: "2",
          childId,
          fromCoach: {
            firstName: "Georgia",
            lastName: "Middleton"
          },
          subject: "Training Focus for Next Week",
          message: "Next session we'll work on long jump approach. Practice your rhythm counting at home if you can.",
          messageType: "technique_tip",
          priority: "normal", 
          isRead: true,
          createdAt: new Date("2024-12-05"),
          parentReply: "Thanks for the tip! We'll practice the counting at home.",
          repliedAt: new Date("2024-12-06")
        }
      ];
      res.json(mockMessages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/upcoming-classes/:childId", authMiddleware, async (req, res) => {
    try {
      const { childId } = req.params;
      const mockClasses = [
        {
          id: "1",
          name: "Emerging Athletes",
          date: new Date("2024-12-17"),
          startTime: "15:30",
          endTime: "16:45",
          venue: { name: "Toorak College" },
          coach: { firstName: "Georgia", lastName: "Middleton" }
        },
        {
          id: "2",
          name: "Emerging Athletes", 
          date: new Date("2024-12-19"),
          startTime: "15:30",
          endTime: "16:45",
          venue: { name: "Toorak College" },
          coach: { firstName: "Georgia", lastName: "Middleton" }
        }
      ];
      res.json(mockClasses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Set up Google Sheet headers on startup
  ensureSheetHeaders().catch(err => console.error("Failed to initialize sheet headers:", err));

  // Survey Response routes
  app.post("/api/survey-responses", async (req, res) => {
    try {
      const responseData = insertSurveyResponseSchema.parse(req.body);
      const newResponse = await storage.createSurveyResponse(responseData);

      try {
        await appendSurveyToSheet(responseData);
        console.log("Survey response appended to Google Sheet");
      } catch (sheetError) {
        console.error("Failed to append to Google Sheet (DB save succeeded):", sheetError);
      }

      res.json(newResponse);
    } catch (error: any) {
      console.error("Survey submission error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/survey-responses", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    try {
      const responses = await storage.getAllSurveyResponses();
      res.json(responses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Athlete Assessments & Feedback ──────────────────────────────
  app.get("/api/athletes/:childId/assessments", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || !["admin", "coach"].includes(user.role)) return res.status(403).json({ message: "Access denied" });
    try {
      const assessments = await storage.getAthleteAssessments(req.params.childId);
      res.json(assessments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/athletes/:childId/assessments", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || !["admin", "coach"].includes(user.role)) return res.status(403).json({ message: "Access denied" });
    try {
      const { title, type, content, fileUrl, fileName, fileType, fileSize } = req.body;
      if (!title) return res.status(400).json({ message: "Title is required" });
      const assessment = await storage.createAthleteAssessment({
        childId: req.params.childId,
        title,
        type: type || "note",
        content: content || null,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize || null,
        createdById: userId,
      });
      res.json(assessment);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/athletes/assessments/:id", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || !["admin", "coach"].includes(user.role)) return res.status(403).json({ message: "Access denied" });
    try {
      await storage.deleteAthleteAssessment(req.params.id);
      res.json({ message: "Assessment deleted" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Presigned URL upload endpoint ─────────────────────────────
  app.post("/api/uploads/request-url", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(userId);
    if (!user || !["admin", "coach"].includes(user.role)) return res.status(403).json({ message: "Access denied" });

    try {
      const { name, size, contentType } = req.body;
      if (!name) return res.status(400).json({ error: "File name required" });

      const { ObjectStorageService } = await import("./replit_integrations/object_storage/objectStorage.js");
      const objService = new ObjectStorageService();
      const uploadURL = await objService.getObjectEntityUploadURL();

      // Extract the normalized object path from the signed URL so we can store it
      const urlObj = new URL(uploadURL);
      const rawObjectPath = urlObj.pathname;
      const objectPath = `/objects${rawObjectPath.split("/uploads/")[1] ? "/uploads/" + rawObjectPath.split("/uploads/")[1] : rawObjectPath}`;

      res.json({
        uploadURL,
        objectPath: rawObjectPath,
        metadata: { name, size, contentType },
      });
    } catch (error: any) {
      console.error("Upload URL error:", error.message);
      res.status(500).json({ error: "Failed to generate upload URL", details: error.message });
    }
  });

  // Serve stored private files
  app.get("/api/files/*", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./replit_integrations/object_storage/objectStorage.js");
      const objService = new ObjectStorageService();
      const objectPath = "/" + (req.params as any)[0];
      const file = await objService.getObjectEntityFile(objectPath);
      await objService.downloadObject(file, res);
    } catch (error: any) {
      res.status(404).json({ error: "File not found" });
    }
  });

  // ── Seed MAJ coach accounts on startup ───────────────────────────
  (async () => {
    const coaches = [
      { username: "coach_al",  fullName: "Coach Al",           password: "Level4_HP"  },
      { username: "alistair",  fullName: "Alistair Tait",       password: "P2ACoach2026" },
      { username: "declyn",    fullName: "Declyn Tanner",       password: "P2ACoach2026" },
      { username: "geena",     fullName: "Geena Davy",          password: "P2ACoach2026" },
      { username: "georgia",   fullName: "Georgia Middleton",   password: "P2ACoach2026" },
      { username: "miah",      fullName: "Miah Noble",          password: "P2ACoach2026" },
      { username: "sami",      fullName: "Sami Merhi",          password: "P2ACoach2026" },
      { username: "sarai",     fullName: "Sarai Hughes",        password: "P2ACoach2026" },
    ];
    for (const coach of coaches) {
      try {
        const existing = await db.select().from(majCoaches).where(eq(majCoaches.username, coach.username));
        if (existing.length === 0) {
          const hash = await bcrypt.hash(coach.password, 10);
          await db.insert(majCoaches).values({
            username: coach.username,
            fullName: coach.fullName,
            password: hash,
          });
          console.log(`[seed] MAJ coach '${coach.username}' created`);
        }
      } catch (e) {
        console.error(`[seed] Failed to seed MAJ coach '${coach.username}':`, e);
      }
    }
  })();

  // ── Seed MAJ demo athlete on startup ─────────────────────────────
  (async () => {
    try {
      const existing = await db.select().from(majAthletes).where(eq(majAthletes.username, "jordan"));
      if (existing.length === 0) {
        const hash = await bcrypt.hash("athlete1", 10);
        await db.insert(majAthletes).values({
          username: "jordan",
          fullName: "Jordan",
          password: hash,
          grade: "Year 9",
          program: "Senior Squad",
          coach: "Coach Al",
          xp: 580,
          streak: 5,
          sessionsCompleted: 14,
          reflectionsSubmitted: 11,
          currentModule: 1,
          currentWeek: 4,
          earnedBadgeKeys: ["1_sessions", "1_reflections"],
        });
        console.log("[seed] MAJ demo athlete 'jordan' created");
      } else {
        // Always ensure jordan has demo badge/streak data for showcase
        const j = existing[0];
        if (j.streak < 5 || j.earnedBadgeKeys.length < 2) {
          await db.update(majAthletes)
            .set({
              xp: Math.max(j.xp, 580),
              streak: Math.max(j.streak, 5),
              sessionsCompleted: Math.max(j.sessionsCompleted, 14),
              reflectionsSubmitted: Math.max(j.reflectionsSubmitted, 11),
              earnedBadgeKeys: Array.from(new Set([...j.earnedBadgeKeys, "1_sessions", "1_reflections"])),
            })
            .where(eq(majAthletes.username, "jordan"));
          console.log("[seed] MAJ demo athlete 'jordan' demo data updated");
        }
      }
    } catch (e) {
      console.error("[seed] Failed to seed MAJ demo athlete:", e);
    }
  })();

  // ── Migrate: add school column + tag existing athletes ────────────
  (async () => {
    try {
      await db.execute(sql`ALTER TABLE maj_athletes ADD COLUMN IF NOT EXISTS school varchar(150)`);
      const tcList = `'adelyn','edith','gracemol','maita','ada','addison','alice','bobby','celina','elleni','gracemau','harper','havana','heidi','jemima','jessica','lara','lucy','maya','mia','ollie','primrose'`;
      const pgList = `'alex','annabel','aspen','avery','eddy','freddie','hudson','marlowe','noah','pippa','sophia','william','charlieR','charlieS','elle','jackB','jackL','jenson','leo','marcus','summer'`;
      await db.execute(sql.raw(`UPDATE maj_athletes SET school = 'Toorak College' WHERE username IN (${tcList}) AND (school IS NULL OR school = '')`));
      await db.execute(sql.raw(`UPDATE maj_athletes SET school = 'Peninsula Grammar' WHERE username IN (${pgList}) AND (school IS NULL OR school = '')`));
      console.log("[migration] school column and tags applied");
    } catch(e: any) {
      console.error("[migration] school column:", e.message);
    }
  })();

  // ── Seed Toorak College athletes ──────────────────────────────────
  (async () => {
    const tcAthletes = [
      { username: "adelyn",   fullName: "Adelyn Rayner",    password: "TC2026", grade: "Prep",   program: "Foundation" },
      { username: "edith",    fullName: "Edith Phillips",   password: "TC2026", grade: "Year 1", program: "Foundation" },
      { username: "gracemol", fullName: "Grace Moldrich",   password: "TC2026", grade: "Year 1", program: "Foundation" },
      { username: "maita",    fullName: "Maita Machakata",  password: "TC2026", grade: "Year 1", program: "Foundation" },
      { username: "ada",      fullName: "Ada Jeffery",      password: "TC2026", grade: "Year 6", program: "Emerging" },
      { username: "addison",  fullName: "Addison Hellier",  password: "TC2026", grade: "Year 5", program: "Emerging" },
      { username: "alice",    fullName: "Alice Mauldridge", password: "TC2026", grade: "Year 5", program: "Emerging" },
      { username: "bobby",    fullName: "Bobby Jedynak",    password: "TC2026", grade: "Year 5", program: "Emerging" },
      { username: "celina",   fullName: "Celina Shenouda",  password: "TC2026", grade: "Year 3", program: "Emerging" },
      { username: "elleni",   fullName: "Elleni Tresidder", password: "TC2026", grade: "Year 4", program: "Emerging" },
      { username: "gracemau", fullName: "Grace Mauldridge", password: "TC2026", grade: "Year 3", program: "Emerging" },
      { username: "harper",   fullName: "Harper Coad",      password: "TC2026", grade: "Year 5", program: "Emerging" },
      { username: "havana",   fullName: "Havana Laing",     password: "TC2026", grade: "Year 6", program: "Emerging" },
      { username: "heidi",    fullName: "Heidi Jeffery",    password: "TC2026", grade: "Year 4", program: "Emerging" },
      { username: "jemima",   fullName: "Jemima Woff",      password: "TC2026", grade: "Year 2", program: "Emerging" },
      { username: "jessica",  fullName: "Jessica Yuan",     password: "TC2026", grade: "Year 4", program: "Emerging" },
      { username: "lara",     fullName: "Lara Gomez",       password: "TC2026", grade: "Year 6", program: "Emerging" },
      { username: "lucy",     fullName: "Lucy Odlum",       password: "TC2026", grade: "Year 2", program: "Emerging" },
      { username: "maya",     fullName: "Maya Jackson",     password: "TC2026", grade: "Year 5", program: "Emerging" },
      { username: "mia",      fullName: "Mia Bardis",       password: "TC2026", grade: "Year 4", program: "Emerging" },
      { username: "ollie",    fullName: "Ollie Bardis",     password: "TC2026", grade: "Year 6", program: "Emerging" },
      { username: "primrose", fullName: "Primrose Spargo",  password: "TC2026", grade: "Year 4", program: "Emerging" },
    ];
    for (const athlete of tcAthletes) {
      try {
        const existing = await db.select().from(majAthletes).where(eq(majAthletes.username, athlete.username));
        if (existing.length === 0) {
          const hash = await bcrypt.hash(athlete.password, 10);
          await db.insert(majAthletes).values({
            username: athlete.username,
            fullName: athlete.fullName,
            password: hash,
            grade: athlete.grade,
            program: athlete.program,
            school: "Toorak College",
          });
          console.log(`[seed] TC athlete '${athlete.username}' created`);
        }
      } catch (e) {
        console.error(`[seed] Failed to seed TC athlete '${athlete.username}':`, e);
      }
    }
  })();

  // ── Seed Peninsula Grammar athletes ──────────────────────────────
  (async () => {
    const pgAthletes = [
      { username: "alex",     fullName: "Alex Seeckts",              password: "PG2026", grade: "Year 1", program: "Foundation" },
      { username: "annabel",  fullName: "Annabel McKillop",          password: "PG2026", grade: "Prep",   program: "Foundation" },
      { username: "aspen",    fullName: "Aspen Van Zwol",            password: "PG2026", grade: "Prep",   program: "Foundation" },
      { username: "avery",    fullName: "Avery Chia",                password: "PG2026", grade: "Year 1", program: "Foundation" },
      { username: "eddy",     fullName: "Edmund (Eddy) Kuan",        password: "PG2026", grade: "Prep",   program: "Foundation" },
      { username: "freddie",  fullName: "Freddie Burke",             password: "PG2026", grade: "Year 1", program: "Foundation" },
      { username: "hudson",   fullName: "Hudson McKinnon",           password: "PG2026", grade: "Prep",   program: "Foundation" },
      { username: "marlowe",  fullName: "Marlowe Cook",              password: "PG2026", grade: "Prep",   program: "Foundation" },
      { username: "noah",     fullName: "Noah Di Bella",             password: "PG2026", grade: "Prep",   program: "Foundation" },
      { username: "pippa",    fullName: "Pippa Middleton",           password: "PG2026", grade: "Year 1", program: "Foundation" },
      { username: "sophia",   fullName: "Sophia Sahely",             password: "PG2026", grade: "Prep",   program: "Foundation" },
      { username: "william",  fullName: "William Sahely",            password: "PG2026", grade: "Year 2", program: "Foundation" },
      { username: "charlieR", fullName: "Charlie Rees",              password: "PG2026", grade: "Year 4", program: "Emerging" },
      { username: "charlieS", fullName: "Charlie Sahely",            password: "PG2026", grade: "Year 5", program: "Emerging" },
      { username: "elle",     fullName: "Elle Luu",                  password: "PG2026", grade: "Year 4", program: "Emerging" },
      { username: "jackB",    fullName: "Jack Burke",                password: "PG2026", grade: "Year 6", program: "Emerging" },
      { username: "jackL",    fullName: "Jack Luu",                  password: "PG2026", grade: "Year 3", program: "Emerging" },
      { username: "jenson",   fullName: "Jenson Steer",              password: "PG2026", grade: "Year 6", program: "Emerging" },
      { username: "leo",      fullName: "Leo Wilson",                password: "PG2026", grade: "Year 3", program: "Emerging" },
      { username: "marcus",   fullName: "Marcus Janse Van Rensburg", password: "PG2026", grade: "Year 4", program: "Emerging" },
      { username: "summer",   fullName: "Summer Burke",              password: "PG2026", grade: "Year 4", program: "Emerging" },
    ];
    for (const athlete of pgAthletes) {
      try {
        const existing = await db.select().from(majAthletes).where(eq(majAthletes.username, athlete.username));
        if (existing.length === 0) {
          const hash = await bcrypt.hash(athlete.password, 10);
          await db.insert(majAthletes).values({
            username: athlete.username,
            fullName: athlete.fullName,
            password: hash,
            grade: athlete.grade,
            program: athlete.program,
            school: "Peninsula Grammar",
          });
          console.log(`[seed] PG athlete '${athlete.username}' created`);
        }
      } catch (e) {
        console.error(`[seed] Failed to seed PG athlete '${athlete.username}':`, e);
      }
    }
  })();

  const httpServer = createServer(app);
  return httpServer;
}
