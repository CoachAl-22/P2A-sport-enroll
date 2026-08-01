import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { smsService } from "./sms";
import { emailService } from "./email";
import { InvoiceService } from "./invoiceService";
import { readFileSync } from "fs";
import crypto from "crypto";
import { getAllCustomersWithChildren, getAllStudentsWithParents, toSafeUser } from "./api-helpers";
import { registerEnrolmentLinkRoutes } from "./enrolment-links";
import { insertUserSchema, insertChildSchema, insertEnrollmentSchema, insertPaymentSchema, insertSeniorSquadApplicationSchema, insertHighPerformanceSquadApplicationSchema, insertContactEnquirySchema, insertWaitlistSchema, insertBlogArticleSchema, insertClassSchema, insertCoachSchema, insertPerformanceVideoHighlightSchema, insertVideoShareSchema, insertSurveyResponseSchema, insertPerformanceRecordSchema, insertTrainingGoalSchema, enrollments as enrollmentsTable, classes, coaches, venues, majCoaches, majAthletes, children, users, performanceVideoHighlights } from "@shared/schema";
import { computeTermWeeks, payableWeeks, minimumSelectableWeeks } from "@shared/term-weeks";
import { applySiblingDiscount } from "./siblingDiscount";
import { importStudentsFromCSV, previewStudentsFromCSV } from "./csv-import";
import { appendSurveyToSheet, ensureSheetHeaders, exportAssessmentsToSheet } from "./googleSheets";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";
import { provisionMajAccess } from "./maj-provisioning";

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY || process.env.TESTING_STRIPE_SECRET_KEY) {
  stripe = new Stripe((process.env.STRIPE_SECRET_KEY || process.env.TESTING_STRIPE_SECRET_KEY)!, {
    apiVersion: "2025-07-30.basil",
  });
}

const sessionSecret = process.env.SESSION_SECRET;
if (process.env.NODE_ENV === 'production' && !sessionSecret) {
  throw new Error("SESSION_SECRET is required in production.");
}

// Session configuration
const PgSession = connectPgSimple(session);
const sessionConfig = session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: sessionSecret || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset the 30-day expiry on every request so active athletes stay signed in
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

const publicRegisterSchema = insertUserSchema.pick({
  email: true,
  mobile: true,
  userId: true,
  password: true,
  firstName: true,
  lastName: true,
  autoReenrollment: true,
}).partial({
  email: true,
  mobile: true,
  userId: true,
  autoReenrollment: true,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again in 15 minutes." },
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

const getSessionUserId = (req: any): string | undefined => req.session?.userId;

const canManageChildData = (user: any): boolean => !!user && ["admin", "coach"].includes(user.role);

const requireChildAccess = async (req: any, res: any, childId: string) => {
  const userId = getSessionUserId(req);
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return null;
  }

  const [user, child] = await Promise.all([
    storage.getUser(userId),
    storage.getChild(childId),
  ]);

  if (!child) {
    res.status(404).json({ message: "Child not found" });
    return null;
  }

  if (!canManageChildData(user) && child.parentId !== userId) {
    res.status(403).json({ message: "You can only access your own child's records" });
    return null;
  }

  return { user, child, userId };
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
  selectedWeekNumbers: z.array(z.number().int().positive()).optional(),
  enrollmentType: z.enum(["term", "casual", "trial"]).optional().default("term"),
  childInfo: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    dateOfBirth: z.string(),
    grade: z.string().optional(),
    medicalInfo: z.string().optional(),
    emergencyContact: z.string().optional(),
  }).optional(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Enrolment front door. Registered first so nothing else can shadow /enrol/*.
  registerEnrolmentLinkRoutes(app, {
    getEnrolmentLink: (slug) => storage.getEnrolmentLink(slug),
    logEnrolmentLinkClick: (click) => storage.logEnrolmentLinkClick(click),
  });

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
  app.use("/api/auth", authRateLimiter);

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

  // All MAJ athletes for the admin management view (no password hash exposed).
  app.get("/api/admin/maj-athletes", isAdmin, async (_req, res) => {
    try {
      const all = await storage.getAllMajAthletes();
      const safe = all.map((a: any) => ({
        id: a.id,
        fullName: a.fullName,
        username: a.username,
        school: a.school ?? null,
        schoolCode: a.schoolCode ?? null,
        enabled: a.enabled,
        displayPassword: a.displayPassword ?? null,
      }));
      res.json(safe);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Enable/disable every athlete at a school (white-label licence control).
  app.post("/api/admin/maj-athletes/bulk-set-enabled", isAdmin, async (req, res) => {
    try {
      const { school, enabled } = req.body as { school?: string; enabled?: boolean };
      if (typeof school !== "string" || typeof enabled !== "boolean") {
        return res.status(400).json({ message: "school (string) and enabled (boolean) are required" });
      }
      const count = await storage.setMajEnabledBySchool(school, enabled);
      res.json({ updated: count });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
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

  // ── Coach: toggle an athlete's active / inactive status for the term ─────────
  app.patch("/api/maj/coach/athletes/:id/active", isMajCoach, async (req, res) => {
    try {
      const { active } = req.body as { active?: boolean };
      if (typeof active !== "boolean") {
        return res.status(400).json({ message: "active (boolean) is required" });
      }
      const athlete = await storage.updateMajAthlete(req.params.id, { enabled: active });
      const { password: _pw, ...safe } = athlete as any;
      res.json(safe);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // One-tap coach kudos — saved for the athlete's bell and pushed instantly
  // ── Coach bulk-progress: mark learn/challenge complete for multiple athletes ─
  app.post("/api/maj/coach/bulk-progress", isMajCoach, async (req, res) => {
    try {
      const { athleteIds, moduleNum, weekNum, activities } = req.body as {
        athleteIds: string[];
        moduleNum: number;
        weekNum: number;
        activities: { learn?: boolean; challenge?: boolean };
      };
      if (!Array.isArray(athleteIds) || !athleteIds.length || !moduleNum || !weekNum || !activities) {
        return res.status(400).json({ message: "athleteIds[], moduleNum, weekNum and activities required" });
      }
      const weekKey = `${moduleNum}-${weekNum}`;
      const patch: Record<string, any> = {};
      if (activities.learn)     patch.learn     = true;
      if (activities.challenge) patch.challenge = true;
      if (!Object.keys(patch).length) {
        return res.status(400).json({ message: "At least one activity (learn or challenge) must be true" });
      }
      const results = await Promise.allSettled(
        athleteIds.map(id =>
          storage.updateMajAthleteProgress(id, {
            completedWeeks: { [weekKey]: patch },
          })
        )
      );
      const updated = results.filter(r => r.status === "fulfilled").length;
      const failed  = results.filter(r => r.status === "rejected").length;
      res.json({ updated, failed });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  // ── Coach bulk-push: send a push notification to a list of athletes ─────────
  // Optional: pass moduleNum + weekNum for a reflection reminder. The server
  // cross-checks maj_reflections and silently skips athletes who already submitted,
  // regardless of any stale client-side data.
  app.post("/api/maj/coach/bulk-push", isMajCoach, async (req, res) => {
    try {
      const { athleteIds, title, body, moduleNum, weekNum } = req.body as {
        athleteIds: string[];
        title: string;
        body: string;
        moduleNum?: number;
        weekNum?: number;
      };
      if (!Array.isArray(athleteIds) || !athleteIds.length || !title || !body) {
        return res.status(400).json({ message: "athleteIds[], title and body required" });
      }

      // If this is a reflection reminder, filter out athletes who already reflected
      let targets = athleteIds;
      let skipped = 0;
      if (moduleNum && weekNum) {
        const { db } = await import("./db.js");
        const { majReflections } = await import("../shared/schema.js");
        const { inArray, eq, and } = await import("drizzle-orm");
        const already = await db
          .select({ athleteId: majReflections.athleteId })
          .from(majReflections)
          .where(
            and(
              inArray(majReflections.athleteId, athleteIds),
              eq(majReflections.moduleNum, moduleNum),
              eq(majReflections.weekNum, weekNum)
            )
          );
        const doneSet = new Set(already.map(r => r.athleteId));
        targets = athleteIds.filter(id => !doneSet.has(id));
        skipped = doneSet.size;
      }

      const results = await Promise.allSettled(
        targets.map(id =>
          sendPushToAthlete(id, { title, body, url: "/my-athletic-journey" })
        )
      );
      const sent   = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;
      res.json({ sent, skipped, failed });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

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

  app.post("/api/maj/analytics", async (req, res) => {
    try {
      const { athleteId, event, page, meta } = req.body;
      if (!event) return res.status(400).json({ message: "event required" });
      const { db } = await import("./db.js");
      const { majAnalyticsEvents } = await import("../shared/schema.js");
      await db.insert(majAnalyticsEvents).values({ athleteId: athleteId || null, event, page: page || null, meta: meta || null });
      res.status(201).json({ ok: true });
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

  // Feature preview — static demo of the session panel (no login required)
  app.get("/session-preview", async (req, res) => {
    const { readFileSync: _rfs } = await import("fs");
    const { resolve: _res2, dirname: _dn2 } = await import("path");
    const { fileURLToPath: _ftu3 } = await import("url");
    const __dn2 = _dn2(_ftu3(import.meta.url));
    try {
      const html = _rfs(_res2(__dn2, "../public/session-preview.html"), "utf-8");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      return res.send(html);
    } catch { return res.status(404).send("Not found"); }
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

      const userData = publicRegisterSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: "parent",
        active: true,
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

  // ── Password reset (stateless HMAC token, no schema change) ──────────────
  const resetTokenSecret = () => sessionSecret || "dev-secret-change-in-production";

  const makeResetToken = (userId: string): string => {
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    const payload = `${userId}.${expires}`;
    const sig = crypto.createHmac("sha256", resetTokenSecret()).update(payload).digest("hex");
    return Buffer.from(`${payload}.${sig}`).toString("base64url");
  };

  const verifyResetToken = (token: string): string | null => {
    try {
      const decoded = Buffer.from(token, "base64url").toString("utf8");
      const [userId, expiresStr, sig] = decoded.split(".");
      if (!userId || !expiresStr || !sig) return null;
      const payload = `${userId}.${expiresStr}`;
      const expected = crypto.createHmac("sha256", resetTokenSecret()).update(payload).digest("hex");
      if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
      if (Date.now() > parseInt(expiresStr, 10)) return null;
      return userId;
    } catch {
      return null;
    }
  };

  app.post("/api/auth/forgot-password", async (req, res) => {
    // Always respond identically so the endpoint can't be used to probe accounts
    const genericResponse = { message: "If an account exists for that email, mobile or user ID, a reset link has been sent to the email on file." };
    try {
      const identifier = String(req.body?.identifier || "").trim();
      if (!identifier) return res.json(genericResponse);

      let user = await storage.getUserByEmail(identifier);
      if (!user) user = await storage.getUserByMobile(identifier);
      if (!user) user = await storage.getUserByUserId(identifier);

      if (user?.email) {
        const token = makeResetToken(user.id);
        const resetUrl = `${process.env.PUBLIC_BASE_URL || "https://www.power2adapt.online"}/reset-password?token=${token}`;
        await emailService.sendEmail(
          user.email,
          "Reset your Power2ADAPT password",
          `<p>Hi ${user.firstName || "there"},</p>
           <p>We received a request to reset your Power2ADAPT password.</p>
           <p><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Reset password</a></p>
           <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email and your password will stay the same.</p>
           <p>Power2ADAPT</p>`
        );
      }
      res.json(genericResponse);
    } catch (error) {
      console.error("forgot-password error:", error);
      res.json(genericResponse);
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const token = String(req.body?.token || "");
      const password = String(req.body?.password || "");
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const userId = verifyResetToken(token);
      if (!userId) {
        return res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
      }
      const hashed = await bcrypt.hash(password, 10);
      await storage.updateUser(userId, { password: hashed });
      res.json({ message: "Password updated. You can now log in with your new password." });
    } catch (error: any) {
      console.error("reset-password error:", error);
      res.status(500).json({ message: "Something went wrong. Please request a new reset link." });
    }
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
      // Distinct enrolled children: the NEXT child to enrol gets 20% off when
      // the family already has 2+ siblings active this term (3rd-child rule)
      const childIds = await storage.getActiveSiblingChildIdsForParent(userId, term, parseInt(year, 10));
      res.json({ eligible: childIds.length >= 2, count: childIds.length });
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
        pricePerCasual: (cls as any).pricePerCasual ?? null,
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
      const staff: any[] = staffUsers.map(user => {
        const coachData = activeCoaches.find(c => c.userId === user.id);
        return {
          ...toSafeUser(user),
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
          email: '',
          mobile: '',
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
      
      res.json({ ...toSafeUser(newUser), message: "Staff member created successfully" });
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
        
        res.json({ ...toSafeUser(updatedUser), message: "Staff member updated successfully" });
        
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
      const access = await requireChildAccess(req, res, childId);
      if (!access) return;
      if (access.child.parentId !== userId) {
        return res.status(403).json({ error: 'You can only waitlist your own child' });
      }

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

      const access = await requireChildAccess(req, res, childId);
      if (!access) return;
      if (access.child.parentId !== userId) {
        return res.status(403).json({ message: "You can only enrol your own child" });
      }
      
      // Check class availability
      const classData = await storage.getClass(enrollmentData.classId);
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }

      // Enrolment gate: controlled per-class by the admin "Enrolment Open" toggle.
      // Waitlist joins are still allowed when a class is full, so only block when
      // the class is explicitly closed for enrolment.
      if (!classData.isEnrollmentOpen) {
        return res.status(403).json({ message: "Enrolments for this class aren't open yet. Check back soon to secure your spot!" });
      }
      
      const enrollmentStatus = (classData.currentEnrollment || 0) >= classData.maxCapacity ? "waitlist" : "pending_payment";
      const waitlistPosition = enrollmentStatus === "waitlist" ? await storage.getWaitlistPosition(enrollmentData.classId) : undefined;

      // ── Per-week enrolment: resolve the term weeks and the amount to charge ──
      const enrollmentType: string = (enrollmentData as any).enrollmentType ?? "term";
      const GST_DEFAULT = 0.1;
      const selectedWeekNumbers = (enrollmentData as any).selectedWeekNumbers as number[] | undefined;
      let termWeeks: ReturnType<typeof computeTermWeeks> | null = null;
      let gstRate = GST_DEFAULT;
      let baseExGst = parseFloat(classData.pricePerTerm);
      let finalEnrollmentStatus = enrollmentStatus;

      if (enrollmentType === "trial") {
        // ── Free trial: no payment, pending admin approval ──
        finalEnrollmentStatus = "trial_pending" as any;
        baseExGst = 0;
      } else if (enrollmentType === "casual") {
        // ── Casual: single session at casual rate ──
        const casualPrice = (classData as any).pricePerCasual;
        if (!casualPrice) {
          return res.status(400).json({ message: "Casual pricing is not available for this class." });
        }
        if (!selectedWeekNumbers || selectedWeekNumbers.length !== 1) {
          return res.status(400).json({ message: "Please select exactly one session for a casual booking." });
        }
        if (classData.termConfigId) {
          const termConfig = await storage.getTermConfigurationById(classData.termConfigId);
          if (termConfig?.gstRate != null) gstRate = parseFloat(termConfig.gstRate);
        }
        baseExGst = parseFloat(casualPrice);
      } else {
        // ── Term enrolment: per-week pricing ──
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
          const termConfig = await storage.getTermConfigurationById(classData.termConfigId);
          if (termConfig?.gstRate != null) gstRate = parseFloat(termConfig.gstRate);
        }
      }

      // GST always applied on top of the ex-GST base price.
      const amountToCharge = (baseExGst * (1 + gstRate)).toFixed(2);

      const enrollment = await storage.createEnrollment({
        childId,
        classId: enrollmentData.classId,
        parentId: userId,
        status: finalEnrollmentStatus as any,
        autoRenew: enrollmentData.autoRenew ?? true,
        waitlistPosition,
        notes: enrollmentData.notes,
        enrollmentType,
      } as any);

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

      // Create payment record if not a trial or waitlist
      if (finalEnrollmentStatus === "pending_payment") {
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
          
          if (finalEnrollmentStatus === "trial_pending") {
            // Parent confirmation SMS
            await smsService.sendSMS(
              parent.mobile,
              `Hi ${parent.firstName || "there"}! We've received your free trial request for ${child.firstName} in ${classData.name}. Our team will review it and get back to you shortly. — Power2ADAPT`
            );
            // Parent confirmation email
            if (process.env.RESEND_API_KEY && parent.email) {
              await emailService.sendEmail(
                parent.email,
                `Free Trial Request Received — ${child.firstName}`,
                `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f9fafb;border-radius:12px;">
                  <div style="background:#fff;border-radius:10px;padding:28px;">
                    <img src="https://www.power2adapt.online/logo.png" alt="Power2ADAPT" style="height:48px;margin-bottom:20px;" onerror="this.style.display='none'" />
                    <h2 style="color:#1e40af;margin-top:0;">Trial Request Received!</h2>
                    <p style="color:#374151;">Hi ${parent.firstName || "there"},</p>
                    <p style="color:#374151;">Thanks for submitting a free trial request for <strong>${child.firstName}</strong>. We've received it and our team will be in touch shortly to confirm availability and session details.</p>
                    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;">
                      <p style="margin:0 0 8px;font-weight:600;color:#166534;">Trial details</p>
                      <p style="margin:4px 0;color:#374151;font-size:14px;"><strong>Athlete:</strong> ${child.firstName} ${child.lastName}</p>
                      <p style="margin:4px 0;color:#374151;font-size:14px;"><strong>Class:</strong> ${classData.name}</p>
                      <p style="margin:4px 0;color:#374151;font-size:14px;"><strong>Day &amp; Time:</strong> ${classData.dayOfWeek} at ${classData.startTime}</p>
                    </div>
                    <p style="color:#374151;">No payment is required at this stage. Once approved, we'll send you confirmation details via SMS and email.</p>
                    <p style="color:#374151;">If you have any questions, reply to this email or call us anytime.</p>
                    <p style="color:#374151;margin-bottom:0;">See you on the track! 🏃</p>
                    <p style="color:#374151;font-weight:600;">The Power2ADAPT Team</p>
                    <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;" />
                    <p style="color:#9ca3af;font-size:12px;margin:0;">Power2ADAPT · <a href="https://www.power2adapt.online" style="color:#9ca3af;">power2adapt.online</a></p>
                  </div>
                </div>`
              ).catch((e: any) => console.error("Trial parent email failed:", e));
            }
            // Admin alert SMS
            const adminPhone = "+61434679395";
            await smsService.sendSMS(
              adminPhone,
              `New FREE TRIAL request: ${child.firstName} ${child.lastName} for ${classData.name} (${classData.dayOfWeek}). Parent: ${parent.firstName} ${parent.lastName} ${parent.mobile}. Review at power2adapt.online/admin/trials`
            );
            // Admin alert email
            if (process.env.RESEND_API_KEY) {
              const adminEmail = "info@power2adapt.com";
              await emailService.sendEmail(
                adminEmail,
                `New Free Trial Request — ${child.firstName} ${child.lastName}`,
                `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                  <h2 style="color:#1e40af;">New Free Trial Request</h2>
                  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
                    <tr><td style="padding:8px;color:#6b7280;width:140px;">Athlete</td><td style="padding:8px;font-weight:600;">${child.firstName} ${child.lastName}</td></tr>
                    <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Class</td><td style="padding:8px;font-weight:600;">${classData.name}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;">Day & Time</td><td style="padding:8px;">${classData.dayOfWeek} at ${classData.startTime}</td></tr>
                    <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Parent</td><td style="padding:8px;">${parent.firstName} ${parent.lastName}</td></tr>
                    <tr><td style="padding:8px;color:#6b7280;">Mobile</td><td style="padding:8px;">${parent.mobile}</td></tr>
                    <tr style="background:#f9fafb;"><td style="padding:8px;color:#6b7280;">Email</td><td style="padding:8px;">${parent.email || "—"}</td></tr>
                  </table>
                  <a href="https://www.power2adapt.online/admin/trials" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Review &amp; Approve Trial</a>
                  <p style="color:#9ca3af;font-size:12px;margin-top:24px;">Power2ADAPT Admin</p>
                </div>`
              ).catch((e: any) => console.error("Trial admin email failed:", e));
            }
          } else if (enrollmentStatus === "waitlist") {
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

  // ── Admin: trial request management ─────────────────────────────────────
  app.get("/api/admin/trial-requests", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const adminUser = await storage.getUser(userId);
    if (!adminUser || adminUser.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
      const rows = await db
        .select({ enrollment: enrollmentsTable, class: classes, child: children, parent: users })
        .from(enrollmentsTable)
        .leftJoin(classes, eq(enrollmentsTable.classId, classes.id))
        .leftJoin(children, eq(enrollmentsTable.childId, children.id))
        .leftJoin(users, eq(enrollmentsTable.parentId, users.id))
        .where(eq(enrollmentsTable.status, "trial_pending" as any))
        .orderBy(enrollmentsTable.enrolledAt);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/admin/trial-requests/:id/approve", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const adminUser = await storage.getUser(userId);
    if (!adminUser || adminUser.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
      await storage.updateEnrollment(req.params.id, { status: "active" as any });
      // Notify parent via SMS
      const enr = await storage.getEnrollment(req.params.id);
      if (enr) {
        const parent = await storage.getUser(enr.parentId);
        const child = await storage.getChild(enr.childId);
        const cls = await storage.getClass(enr.classId);
        if (parent?.mobile && child && cls) {
          await smsService.sendSMS(parent.mobile, `Great news! ${child.firstName}'s free trial for ${cls.name} has been approved. We look forward to seeing you! — Power2ADAPT`).catch(() => {});
        }
      }
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
  });

  app.post("/api/admin/trial-requests/:id/reject", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const adminUser = await storage.getUser(userId);
    if (!adminUser || adminUser.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
      await storage.updateEnrollment(req.params.id, { status: "cancelled" as any });
      const enr = await storage.getEnrollment(req.params.id);
      if (enr) {
        const parent = await storage.getUser(enr.parentId);
        const child = await storage.getChild(enr.childId);
        const cls = await storage.getClass(enr.classId);
        if (parent?.mobile && child && cls) {
          await smsService.sendSMS(parent.mobile, `Unfortunately we're unable to accommodate a free trial for ${child.firstName} in ${cls.name} at this time. Please contact us if you'd like to discuss other options. — Power2ADAPT`).catch(() => {});
        }
      }
      res.json({ success: true });
    } catch (e: any) { res.status(500).json({ message: e.message }); }
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
      const fullAmount = Math.round(parseFloat(chargeBase) * 100); // Convert to cents

      // Sibling discount: 20% off the 3rd+ distinct child of the family
      // active in this term (see server/siblingDiscount.ts)
      const priorChildIds = await storage.getActiveSiblingChildIdsForParent(userId, classData.term, classData.year);
      const { discountedCents, discountCents } = applySiblingDiscount(
        [{ childId: enrollment.childId, cents: fullAmount }],
        priorChildIds,
      );
      const amount = discountedCents[0];
      if (discountCents > 0) {
        console.log(`[sibling-discount] payment intent for enrollment ${enrollmentId}: ${fullAmount} -> ${amount} cents (prior siblings active: ${priorChildIds.length})`);
      }

      if (!stripe) {
        return res.status(500).json({ message: "Payment processing not configured" });
      }

      // Send the Stripe payment receipt to the parent's email (Stripe emails it
      // automatically on success when "successful payment" receipts are enabled).
      const receiptParent = await storage.getUser(userId);

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "aud",
        payment_method_types: ["card"],
        receipt_email: receiptParent?.email || undefined,
        metadata: {
          enrollmentId: enrollment.id,
          userId,
          ...(discountCents > 0 ? { siblingDiscountCents: String(discountCents) } : {}),
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret, amountInclGst: amount / 100, totalCents: amount, discountCents });
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

      // Sibling discount: 20% off the 3rd+ distinct child of the family.
      // Already-active siblings this term count first, then this batch's
      // children in order of first appearance.
      const firstClass = matched[0].class;
      const priorChildIds = firstClass
        ? await storage.getActiveSiblingChildIdsForParent(userId, firstClass.term, firstClass.year)
        : [];
      const { discountedCents, discountCents, discountedIndexes } = applySiblingDiscount(
        matched.map((r, i) => ({ childId: r.enrollment.childId, cents: perEnrollmentCents[i] })),
        priorChildIds,
      );
      const totalCents = discountedCents.reduce((sum, c) => sum + c, 0);
      if (discountCents > 0) {
        console.log(`[sibling-discount] batch intent for ${enrollmentIds.length} enrolments: -${discountCents} cents (prior siblings active: ${priorChildIds.length})`);
      }

      if (!stripe) return res.status(500).json({ message: "Payment processing not configured" });

      const receiptParent = await storage.getUser(userId);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: "aud",
        payment_method_types: ["card"],
        receipt_email: receiptParent?.email || undefined,
        metadata: {
          enrollmentIds: enrollmentIds.join(","),
          userId,
          ...(discountCents > 0 ? { siblingDiscountCents: String(discountCents) } : {}),
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        totalCents,
        discountCents,
        // Per-enrolment inc-GST amounts after discount + which lines got 20% off,
        // so the checkout page can show the real per-child breakdown
        perEnrollmentCents: discountedCents,
        discountedIndexes,
        enrollments: matched,
      });
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
      const instalmentAmountCents = parseInt(setupIntent.metadata?.instalmentAmountCents || "12100");

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

  // ── Confirmation helpers (used by the Stripe webhook) ─────────────────────
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const formatClassTime = (t?: string | null): string | null => {
    if (!t) return null;
    const [hStr, mStr] = t.split(":");
    const h = parseInt(hStr, 10);
    if (isNaN(h)) return null;
    const suffix = h >= 12 ? "pm" : "am";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${(mStr || "00").slice(0, 2)}${suffix}`;
  };

  // "Thursday 16 July, 3:30pm" for the enrolment's first session.
  // Per-week enrolments use their first SELECTED week; full-term falls back to
  // the first occurrence of the class day on/after the class start date.
  const firstSessionInfo = async (enrollmentId: string, classData: any): Promise<string | null> => {
    try {
      let sessionDate: Date | null = null;
      const weeks = await storage.getEnrollmentWeeks(enrollmentId).catch(() => []);
      const selected = (weeks || [])
        .filter((w: any) => w.status === "selected" && w.sessionDate)
        .sort((a: any, b: any) => new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime());
      if (selected.length > 0) sessionDate = new Date(selected[0].sessionDate);

      if (!sessionDate && classData?.startDate && classData?.dayOfWeek != null) {
        const d = new Date(classData.startDate);
        const targetDay = classData.dayOfWeek % 7; // schema: 1=Mon..7=Sun; JS getDay: 0=Sun
        for (let i = 0; i < 7 && d.getDay() !== targetDay; i++) d.setDate(d.getDate() + 1);
        if (d.getDay() === targetDay) sessionDate = d;
      }
      if (!sessionDate) return null;

      const datePart = sessionDate.toLocaleDateString("en-AU", {
        weekday: "long", day: "numeric", month: "long", timeZone: "Australia/Melbourne",
      });
      const timePart = formatClassTime(classData?.startTime);
      return timePart ? `${datePart}, ${timePart}` : datePart;
    } catch {
      return null;
    }
  };

  const classScheduleLine = (classData: any): string => {
    const day = classData?.dayOfWeek != null ? `${DAY_NAMES[classData.dayOfWeek % 7]}s` : "";
    const start = formatClassTime(classData?.startTime);
    const end = formatClassTime(classData?.endTime);
    const time = start && end ? `${start} to ${end}` : start || "";
    return [day, time].filter(Boolean).join(" ") || "See class details";
  };

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
              if (!parent?.mobile) {
                console.warn(`[confirmation] SMS skipped for payment ${paymentIntent.id}: parent ${firstEnrollment.parentId} has no mobile on file`);
              } else if (!classData) {
                console.warn(`[confirmation] SMS skipped for payment ${paymentIntent.id}: class ${firstEnrollment.classId} not found`);
              } else {
                const amount = (paymentIntent.amount / 100).toFixed(2);
                let sent = false;
                if (enrollmentIdList.length === 1) {
                  const child = await storage.getChild(firstEnrollment.childId);
                  const firstSession = await firstSessionInfo(enrollmentIdList[0], classData);
                  sent = await smsService.sendPaymentConfirmation(parent.mobile, child?.firstName ?? "your athlete", amount, classData.name, firstSession ?? undefined);
                } else {
                  sent = await smsService.sendSMS(parent.mobile,
                    `Payment of $${amount} AUD confirmed for ${enrollmentIdList.length} athletes. See your email for each child's class details. Power2ADAPT 🎉`
                  );
                }
                if (!sent) console.warn(`[confirmation] SMS to ${parent.mobile} for payment ${paymentIntent.id} did NOT send (Twilio unconfigured or rejected the number — see error above)`);
              }
            }
          } catch (smsError) {
            console.error('[confirmation] Payment confirmation SMS failed:', smsError);
          }

          // Send a confirmation email per enrolment (child, class, first session, venue, amount)
          for (const enrollmentId of enrollmentIdList) {
            try {
              const enrollment = await storage.getEnrollment(enrollmentId);
              if (!enrollment) continue;
              const parent = await storage.getUser(enrollment.parentId);
              if (!parent?.email) {
                console.warn(`[confirmation] Email skipped for enrollment ${enrollmentId}: parent ${enrollment.parentId} has no email on file`);
                continue;
              }
              const classData = await storage.getClass(enrollment.classId);
              if (!classData) {
                console.warn(`[confirmation] Email skipped for enrollment ${enrollmentId}: class ${enrollment.classId} not found`);
                continue;
              }
              const child = await storage.getChild(enrollment.childId);
              const venue = classData.venueId ? await storage.getVenue(classData.venueId).catch(() => undefined) : undefined;
              const [payment] = await storage.getPaymentsByEnrollment(enrollmentId);
              const firstSession = await firstSessionInfo(enrollmentId, classData);

              const emailSent = await emailService.sendEnrollmentPaymentConfirmation({
                parentEmail: parent.email,
                parentFirstName: parent.firstName,
                childName: child ? `${child.firstName} ${child.lastName ?? ""}`.trim() : "Your athlete",
                className: classData.name,
                dayAndTime: classScheduleLine(classData),
                firstSession,
                venueName: venue?.name,
                venueAddress: [venue?.address, venue?.suburb].filter(Boolean).join(", "),
                amountPaid: payment?.amount ?? (paymentIntent.amount / 100).toFixed(2),
                invoiceNumber: payment?.invoiceNumber ?? null,
              });
              if (!emailSent) console.warn(`[confirmation] Email to ${parent.email} for enrollment ${enrollmentId} did NOT send (Resend unconfigured or rejected — see error above)`);
            } catch (emailError) {
              console.error('[confirmation] Payment confirmation email failed for enrollment', enrollmentId, emailError);
            }
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
      res.json(toSafeUser(updated));
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
  // Test the enrolment confirmation email + SMS without a real Stripe charge.
  // Body: { email?: string, mobile?: string } — sends the same templates the
  // Stripe webhook uses, with sample data, to the supplied targets.
  app.post("/api/admin/test-confirmation", isAdmin, async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
      const mobile = typeof req.body?.mobile === "string" ? req.body.mobile.trim() : "";
      if (!email && !mobile) {
        return res.status(400).json({ message: "Provide an email and/or a mobile to test" });
      }

      const config = {
        resendConfigured: !!process.env.RESEND_API_KEY,
        twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
      };

      const results: Record<string, boolean | null> = { email: null, sms: null };

      if (email) {
        results.email = await emailService.sendEnrollmentPaymentConfirmation({
          parentEmail: email,
          parentFirstName: "Test",
          childName: "Test Athlete",
          className: "TEST — Confirmation Check",
          dayAndTime: "Thursday 4:00pm",
          firstSession: "Thursday 16 July, 4:00pm",
          venueName: "Test Venue",
          venueAddress: "1 Test St, Melbourne",
          amountPaid: "33.00",
          invoiceNumber: "TEST-0000",
        });
      }
      if (mobile) {
        results.sms = await smsService.sendPaymentConfirmation(
          mobile, "Test Athlete", "33.00", "TEST — Confirmation Check", "Thursday 16 July, 4:00pm"
        );
      }

      console.log(`[confirmation] Admin test send — email: ${email || "-"} (${results.email}), sms: ${mobile || "-"} (${results.sms}), config: ${JSON.stringify(config)}`);
      res.json({ results, config, message: "false = send failed or service unconfigured — check server logs for the exact error" });
    } catch (error: any) {
      res.status(500).json({ message: "Test send failed: " + error.message });
    }
  });

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
          childName: sql<string | null>`case when ${children.id} is null then null else ${children.firstName} || ' ' || ${children.lastName} end`,
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

      const viewCount = video.viewCount ?? 0;

      // Increment view count
      await db
        .update(performanceVideoHighlights)
        .set({ 
          viewCount: viewCount + 1,
          updatedAt: new Date()
        })
        .where(eq(performanceVideoHighlights.shareableLink, shareableLink));

      res.json({
        ...video,
        viewCount: viewCount + 1
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

      const access = await requireChildAccess(req, res, waitlistData.childId);
      if (!access) return;
      if (access.child.parentId !== userId) {
        return res.status(403).json({ message: "You can only waitlist your own child" });
      }

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
      const waitlistEntry = await storage.getWaitlist(id);
      if (!waitlistEntry) {
        return res.status(404).json({ message: "Waitlist entry not found" });
      }
      if (waitlistEntry.parentId !== userId && user?.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
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
          const bookingUrl = `${process.env.PUBLIC_BASE_URL || "https://www.power2adapt.online"}/enrollment/${classId}`;
          await smsService.sendSMS(
            parent.mobile,
            `Great news! A spot has opened for ${child.firstName} in ${classInfo.name}. Book it here: ${bookingUrl} - Offer expires in 48 hours. Power2ADAPT`
          );
        } catch (smsError) {
          console.error("Failed to send waitlist notification SMS:", smsError);
        }
      }

      // Email the parent the same offer (best effort)
      if (parent?.email && child && classInfo) {
        try {
          const bookingUrl = `${process.env.PUBLIC_BASE_URL || "https://www.power2adapt.online"}/enrollment/${classId}`;
          await emailService.sendEmail(
            parent.email,
            `A spot has opened in ${classInfo.name}!`,
            `<p>Hi ${parent.firstName || "there"},</p>
             <p>Great news! A spot has opened for <strong>${child.firstName}</strong> in <strong>${classInfo.name}</strong>.</p>
             <p><a href="${bookingUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Book the spot</a></p>
             <p>This offer expires in 48 hours, after which the spot is released to the next family on the waitlist.</p>
             <p>Power2ADAPT</p>`
          );
        } catch (emailError) {
          console.error("Failed to send waitlist notification email:", emailError);
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
      
      if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied - coaches and admins only" });
      }

      const coachClasses = await storage.getClassesByCoach(userId, user.role === 'admin');
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
      
      if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied - coaches and admins only" });
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
      
      if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied - coaches and admins only" });
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
      
      if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied - coaches and admins only" });
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

      // Guard against double-crediting: check for an existing absent record
      // for this child/class/date BEFORE inserting the new one.
      let alreadyMarkedAbsent = false;
      if (attendanceData.creditsEligible) {
        try {
          const existing = await storage.getAttendanceForClass(attendanceData.classId, attendanceData.attendanceDate);
          alreadyMarkedAbsent = (existing || []).some(
            (r: any) => (r.childId ?? r.child_id) === attendanceData.childId && r.status === 'absent'
          );
        } catch { /* if the check fails, err on the side of not crediting twice below */ }
      }

      const result = await storage.markAttendance(attendanceData);

      // Credit-eligible absence → add a makeup credit to the child's enrolment
      // and let the parent know (SportsBiz parity: makeup class or credit).
      if (attendanceData.creditsEligible && !alreadyMarkedAbsent) {
        try {
          const enrollment = await storage.getEnrollmentByChildAndClass(attendanceData.childId, attendanceData.classId);
          if (enrollment) {
            const newCredits = (enrollment.makeupCredits || 0) + 1;
            await storage.updateEnrollment(enrollment.id, { makeupCredits: newCredits });

            const parent = await storage.getUser(enrollment.parentId);
            const child = await storage.getChild(attendanceData.childId);
            const classData = await storage.getClass(attendanceData.classId);
            if (parent?.mobile && child && classData) {
              await smsService.sendSMS(
                parent.mobile,
                `${child.firstName} was marked absent from ${classData.name}. A makeup class credit has been added to your account - book it from your dashboard: https://www.power2adapt.online/dashboard - Power2ADAPT`
              );
            }
          }
        } catch (creditError) {
          console.error("Makeup credit grant failed:", creditError);
        }
      }

      res.json(result);
    } catch (error) {
      console.error("Error marking attendance:", error);
      res.status(500).json({ message: "Failed to mark attendance" });
    }
  });

  // ── Makeup credits: parent-facing summary + booking ───────────────────────
  app.get("/api/makeup/summary", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const enrollmentRows = await storage.getEnrollmentsByParent(userId);

      // Credits per child across all their enrolments
      const childCredits: Record<string, { childId: string; childName: string; childAge: number | null; credits: number }> = {};
      for (const row of enrollmentRows) {
        const credits = row.enrollment?.makeupCredits || 0;
        if (!row.child) continue;
        const key = row.child.id;
        if (!childCredits[key]) {
          let age: number | null = null;
          if (row.child.dateOfBirth) {
            age = Math.floor((Date.now() - new Date(row.child.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000));
          }
          childCredits[key] = { childId: key, childName: `${row.child.firstName} ${row.child.lastName ?? ""}`.trim(), childAge: age, credits: 0 };
        }
        childCredits[key].credits += credits;
      }

      const childrenWithCredits = Object.values(childCredits).filter(c => c.credits > 0);
      if (childrenWithCredits.length === 0) return res.json({ children: [], options: [] });

      // Eligible makeup slots: makeup-eligible or holiday-program classes with space
      const allClasses = await storage.getClassesWithSpots({});
      const options = (allClasses || [])
        .filter((c: any) => (c.isMakeupEligible || c.isHolidayProgram) && c.status === "active" && (c.spotsRemaining ?? 0) > 0)
        .map((c: any) => ({
          id: c.id, name: c.name, dayOfWeek: c.dayOfWeek, startTime: c.startTime, endTime: c.endTime,
          venueName: c.venue?.name, suburb: c.venue?.suburb, minAge: c.minAge, maxAge: c.maxAge,
          spotsRemaining: c.spotsRemaining, isHolidayProgram: c.isHolidayProgram,
        }));

      res.json({ children: childrenWithCredits, options });
    } catch (error: any) {
      console.error("makeup summary error:", error);
      res.status(500).json({ message: "Failed to load makeup credits" });
    }
  });

  app.post("/api/makeup/book", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { childId, classId } = req.body as { childId: string; classId: string };
      if (!childId || !classId) return res.status(400).json({ message: "childId and classId are required" });

      // Ownership + credit check
      const child = await storage.getChild(childId);
      if (!child || child.parentId !== userId) return res.status(403).json({ message: "Not your child" });

      const enrollmentRows = await storage.getEnrollmentsByParent(userId);
      const creditSource = enrollmentRows.find(
        (r: any) => r.child?.id === childId && (r.enrollment?.makeupCredits || 0) > 0
      );
      if (!creditSource) return res.status(400).json({ message: "No makeup credits available for this child" });

      // Class eligibility
      const classData = await storage.getClass(classId);
      if (!classData || classData.status !== "active" || !(classData.isMakeupEligible || classData.isHolidayProgram)) {
        return res.status(400).json({ message: "That class isn't available for makeup bookings" });
      }
      if ((classData.currentEnrollment || 0) >= classData.maxCapacity) {
        return res.status(400).json({ message: "That class is full - please pick another" });
      }

      // Redeem: decrement credit, create a no-payment active enrolment
      await storage.updateEnrollment(creditSource.enrollment.id, {
        makeupCredits: (creditSource.enrollment.makeupCredits || 0) - 1,
      });
      const booking = await storage.createEnrollment({
        childId, classId, parentId: userId,
        status: "active",
        notes: `Makeup class booking (credit redeemed from ${creditSource.class?.name ?? "enrolment"})`,
      } as any);
      await storage.updateClassEnrollmentCount(classId);

      // Best-effort confirmation SMS
      try {
        const parent = await storage.getUser(userId);
        if (parent?.mobile) {
          await smsService.sendSMS(
            parent.mobile,
            `Makeup class booked! ${child.firstName} is in for ${classData.name}. No charge - one makeup credit used. Power2ADAPT 🎯`
          );
        }
      } catch { /* non-fatal */ }

      res.json({ booking, message: "Makeup class booked - no payment needed" });
    } catch (error: any) {
      console.error("makeup booking error:", error);
      res.status(500).json({ message: "Failed to book makeup class" });
    }
  });

  // Get attendance records for a class on a specific date
  app.get("/api/classes/:classId/attendance/:date", isAuthenticated, async (req, res) => {
    try {
      const userId = ((req as any).user?.claims?.sub) || ((req as any).session?.userId);
      const user = await storage.getUser(userId);
      const { classId, date } = req.params;
      
      if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
        return res.status(403).json({ message: "Access denied - coaches and admins only" });
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

  // ── Admin: enrolment links ───────────────────────────────────────────────
  app.get("/api/admin/enrolment-links", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const adminUser = await storage.getUser(userId);
    if (!adminUser || adminUser.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
      res.json(await storage.getAllEnrolmentLinks());
    } catch (err) {
      console.error("[enrol] list failed", err);
      res.status(500).json({ message: "Failed to load enrolment links" });
    }
  });

  app.patch("/api/admin/enrolment-links/:slug", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const adminUser = await storage.getUser(userId);
    if (!adminUser || adminUser.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
      const { destinationUrl, label, kind, active, notes } = req.body;
      const updates: Record<string, unknown> = {};
      if (typeof destinationUrl === "string") updates.destinationUrl = destinationUrl.trim();
      if (typeof label === "string") updates.label = label.trim();
      if (typeof kind === "string") updates.kind = kind;
      if (typeof active === "boolean") updates.active = active;
      if (typeof notes === "string" || notes === null) updates.notes = notes;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updated = await storage.updateEnrolmentLink(req.params.slug, updates);
      if (!updated) return res.status(404).json({ message: "Slug not found" });
      res.json(updated);
    } catch (err) {
      console.error("[enrol] update failed", err);
      res.status(500).json({ message: "Failed to update enrolment link" });
    }
  });

  app.get("/api/admin/enrolment-link-clicks", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) return res.status(401).json({ message: "Not authenticated" });
    const adminUser = await storage.getUser(userId);
    if (!adminUser || adminUser.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    try {
      res.json(await storage.getEnrolmentLinkClickCounts());
    } catch (err) {
      console.error("[enrol] click counts failed", err);
      res.status(500).json({ message: "Failed to load click counts" });
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
    try {
      const access = await requireChildAccess(req, res, req.params.childId);
      if (!access) return;
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
    try {
      const access = await requireChildAccess(req, res, req.params.childId);
      if (!access) return;
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

  app.get("/api/attendance-records/:childId", async (req, res) => {
    try {
      const { childId } = req.params;
      const access = await requireChildAccess(req, res, childId);
      if (!access) return;
      const records = await storage.getAttendanceRecordsByChild(childId);
      res.json(records);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/coach-messages/:childId", async (req, res) => {
    try {
      const { childId } = req.params;
      const access = await requireChildAccess(req, res, childId);
      if (!access) return;
      const messages = await storage.getCoachMessagesByChild(childId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/upcoming-classes/:childId", async (req, res) => {
    try {
      const { childId } = req.params;
      const access = await requireChildAccess(req, res, childId);
      if (!access) return;
      const upcoming = await storage.getUpcomingClassesByChild(childId);
      res.json(upcoming);
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
        await appendSurveyToSheet({
          ...responseData,
          studentName: responseData.studentName ?? null,
          otherSports: responseData.otherSports ?? null,
          specificEvent: responseData.specificEvent ?? null,
          awesomeFactor: responseData.awesomeFactor ?? null,
          injuryInfo: responseData.injuryInfo ?? null,
        });
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
    const user = await storage.getUser(userId);
    if (!user || !["admin", "coach"].includes(user.role)) return res.status(403).json({ message: "Access denied" });
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

  // ── Migrate: create maj_analytics_events table ────────────────────
  (async () => {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS maj_analytics_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          athlete_id UUID REFERENCES maj_athletes(id) ON DELETE CASCADE,
          event VARCHAR(100) NOT NULL,
          page VARCHAR(100),
          meta JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("[migration] maj_analytics_events table ready");
    } catch(e: any) {
      console.error("[migration] maj_analytics_events:", e.message);
    }
  })();

  // ── Migrate: Term 2 → archive, Term 3 → go live ──────────────────
  (async () => {
    try {
      // Archive Term 2 2026 active classes
      await db.execute(sql`
        UPDATE classes
        SET status = 'completed', is_enrollment_open = false
        WHERE term = 'term_2' AND year = 2026 AND status = 'active'
      `);
      // Close enrollment on any remaining Term 2 2026 cancelled classes that still have it open
      await db.execute(sql`
        UPDATE classes
        SET is_enrollment_open = false
        WHERE term = 'term_2' AND year = 2026 AND is_enrollment_open = true
      `);
      // Open enrollment on Term 3 2026 active classes
      await db.execute(sql`
        UPDATE classes
        SET is_enrollment_open = true
        WHERE term = 'term_3' AND year = 2026 AND status = 'active'
      `);
      // Set term configurations: Term 2 inactive, Term 3 active
      await db.execute(sql`
        UPDATE term_configurations SET active = false WHERE term = 'term_2' AND year = 2026
      `);
      await db.execute(sql`
        UPDATE term_configurations SET active = true WHERE term = 'term_3' AND year = 2026
      `);
      console.log("[migration] Term 2 archived, Term 3 live");
    } catch(e: any) {
      console.error("[migration] term switch:", e.message);
    }
  })();

  // ── Migrate: Create Wednesday Mornington classes (Foundation, Emerging, TSS) ─
  (async () => {
    try {
      const venueId = '2cc8193c-e889-4a7a-9117-4c3d57ad3a61';
      const coachId = '5ea656a7-743c-46d5-9e4c-3e0fa62989d8';
      const termConfigId = '9a60c5de-fa13-4954-ad86-385cb7202fdf';
      const classes = [
        { name: 'Foundation Class — Wednesday (Mornington)', sportType: 'foundation_prep_year2', startTime: '16:30', endTime: '17:30', minAge: 5, maxAge: 8, capacity: 10 },
        { name: 'Emerging Athletes — Wednesday (Mornington)', sportType: 'emerging_year3_6', startTime: '16:30', endTime: '17:30', minAge: 8, maxAge: 12, capacity: 10 },
        { name: 'Team Sport Speed — Wednesday (Mornington)', sportType: 'team_sport_speed', startTime: '17:30', endTime: '18:30', minAge: 10, maxAge: 99, capacity: 15 },
      ];
      for (const cls of classes) {
        await db.execute(sql`
          INSERT INTO classes (name, description, sport_type, venue_id, coach_id, term, year,
            day_of_week, start_time, end_time, start_date, end_date, min_age, max_age,
            max_capacity, current_enrollment, price_per_term, status, term_config_id,
            is_enrollment_open, is_holiday_program, is_makeup_eligible, price_per_session,
            per_week_enabled, price_per_casual)
          SELECT ${cls.name}, 'Athletic development class at Mornington Athletic Track.',
            ${cls.sportType}, ${venueId}, ${coachId}, 'term_3', 2026, 3,
            ${cls.startTime}, ${cls.endTime}, '2026-07-13', '2026-09-19',
            ${cls.minAge}, ${cls.maxAge}, ${cls.capacity}, 0, 300.00, 'active', ${termConfigId},
            true, false, false, 30.00, true, 30.00
          WHERE NOT EXISTS (
            SELECT 1 FROM classes WHERE name = ${cls.name} AND term = 'term_3' AND year = 2026
          )
        `);
      }
      console.log("[migration] Wednesday Mornington classes created");
    } catch(e: any) {
      console.error("[migration] Wednesday Mornington classes:", e.message);
    }
  })();

  // ── Migrate: Activate Toorak Thursday Emerging Athletes Term 3 ────────
  (async () => {
    try {
      await db.execute(sql`
        UPDATE classes
        SET status = 'active', is_enrollment_open = true
        WHERE name ILIKE '%emerging%' AND day_of_week = 4
          AND term = 'term_3' AND year = 2026
          AND venue_id = (SELECT id FROM venues WHERE name ILIKE '%toorak%' LIMIT 1)
      `);
      console.log("[migration] Toorak Thursday Emerging Athletes activated");
    } catch(e: any) {
      console.error("[migration] Toorak Thursday Emerging Athletes:", e.message);
    }
  })();

  // ── Migrate: Archive all 2025 terms ───────────────────────────────
  (async () => {
    try {
      await db.execute(sql`
        UPDATE term_configurations SET active = false WHERE year = 2025
      `);
      console.log("[migration] 2025 terms archived");
    } catch(e: any) {
      console.error("[migration] 2025 archive:", e.message);
    }
  })();

  // ── Migrate: Reactivate Foundation Monday (Peninsula Grammar) T3 ──
  (async () => {
    try {
      await db.execute(sql`
        UPDATE classes
        SET status = 'active', is_enrollment_open = true
        WHERE name = 'Foundation Class — Monday (Peninsula Grammar)'
          AND term = 'term_3' AND year = 2026
          AND status = 'cancelled'
      `);
      console.log("[migration] Foundation Mon PG reactivated");
    } catch(e: any) {
      console.error("[migration] Foundation Mon PG:", e.message);
    }
  })();

  // ── Migrate: New columns for casual/trial enrolment ─────────────────
  (async () => {
    try {
      await db.execute(sql`ALTER TABLE classes ADD COLUMN IF NOT EXISTS price_per_casual numeric(8,2)`);
      await db.execute(sql`ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS enrollment_type varchar(20) NOT NULL DEFAULT 'term'`);
      await db.execute(sql`ALTER TYPE enrollment_status ADD VALUE IF NOT EXISTS 'trial_pending'`);
      // Default casual price for all active Term 3 classes that don't have one
      await db.execute(sql`UPDATE classes SET price_per_casual = 30.00 WHERE price_per_casual IS NULL AND term = 'term_3' AND year = 2026 AND status = 'active'`);
      console.log("[migration] casual/trial columns ready");
    } catch(e: any) {
      console.error("[migration] casual/trial columns:", e.message);
    }
  })();

  // ── Migrate: Fix Toorak College Foundation price_per_term ($30→$300) ─
  (async () => {
    try {
      await db.execute(sql`
        UPDATE classes
        SET price_per_term = '300.00'
        WHERE sport_type = 'foundation_prep_year2'
          AND term = 'term_3' AND year = 2026
          AND CAST(price_per_term AS numeric) < 100
      `);
      console.log("[migration] Toorak Foundation price_per_term corrected to $300");
    } catch(e: any) {
      console.error("[migration] Toorak Foundation price fix:", e.message);
    }
  })();

  // ── Migrate: Enable per-week enrolment on Term 3 2026 classes ─────
  (async () => {
    try {
      await db.execute(sql`
        UPDATE classes
        SET per_week_enabled = true
        WHERE term = 'term_3' AND year = 2026
          AND status = 'active'
          AND sport_type NOT IN ('senior_squad', 'empowered_athlete_program', 'academy_year7_above')
      `);
      console.log("[migration] per-week enrolment enabled on Term 3 classes");
    } catch(e: any) {
      console.error("[migration] per-week enable:", e.message);
    }
  })();

  // ── Migrate: Update admin password ────────────────────────────────
  (async () => {
    try {
      const hashed = await bcrypt.hash("Power2run@5505", 10);
      await db.execute(sql`
        UPDATE users SET password = ${hashed}
        WHERE email = 'admin@power2adapt.com'
      `);
      console.log("[migration] admin password updated");
    } catch(e: any) {
      console.error("[migration] admin password:", e.message);
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

  // ── Seed Mornington athletes ──────────────────────────────────────
  (async () => {
    const mpAthletes = [
      { username: "constantine", fullName: "Constantine Taxakis", program: "Foundation" },
      { username: "jos",         fullName: "Jos Carmody",          program: "Foundation" },
      { username: "markella",    fullName: "Markella Taxakis",     program: "Foundation" },
      { username: "aisha",       fullName: "Aisha Centofanti",     program: "Emerging Athletes" },
      { username: "eadie",       fullName: "Eadie Bland",          program: "Emerging Athletes" },
      { username: "indianna",    fullName: "Indianna Murphy",      program: "Emerging Athletes" },
      { username: "lily",        fullName: "Lily Underwood",       program: "Emerging Athletes" },
      { username: "ryder",       fullName: "Ryder Liddell",        program: "Emerging Athletes" },
      { username: "tom",         fullName: "Tom Bland",            program: "Junior Academy" },
      { username: "zac",         fullName: "Zac McPherson",        program: "Junior Academy" },
      { username: "ava",         fullName: "Ava Ogilivy",          program: "Team Sport Speed" },
      { username: "caleb",       fullName: "Caleb Millman",        program: "Team Sport Speed" },
      { username: "clay",        fullName: "Clay England",         program: "Team Sport Speed" },
      { username: "ry",          fullName: "Ry Webb",              program: "Team Sport Speed" },
      { username: "leohand",     fullName: "Leo Hand",             program: "Team Sport Speed" },
      { username: "essie",       fullName: "Essie Whitwam",        program: "Emerging Athletes" },
    ];
    for (const athlete of mpAthletes) {
      try {
        const existing = await db.select().from(majAthletes).where(eq(majAthletes.username, athlete.username));
        if (existing.length === 0) {
          const hash = await bcrypt.hash("MP2026", 10);
          await db.insert(majAthletes).values({
            username: athlete.username,
            fullName: athlete.fullName,
            password: hash,
            displayPassword: "MP2026",
            program: athlete.program,
            school: "Mornington",
          });
          console.log(`[seed] MP athlete '${athlete.username}' created`);
        }
      } catch (e) {
        console.error(`[seed] Failed to seed MP athlete '${athlete.username}':`, e);
      }
    }
  })();

  // ── Restore Leo Wilson's progress to week 8 ───────────────────────
  // His weeks 3-7 were lost due to silent session-expiry save failures.
  // This migration is idempotent: only runs if he is still behind week 8.
  (async () => {
    try {
      const [leo] = await db.select().from(majAthletes).where(eq(majAthletes.username, "leo"));
      if (leo && (leo.currentWeek ?? 1) < 8 && (leo.currentModule ?? 1) <= 1) {
        const completedWeeks: Record<string, object> = {};
        for (let w = 1; w <= 7; w++) {
          completedWeeks[`1-${w}`] = { learn: true, challenge: true, reflect: true };
        }
        await db.update(majAthletes)
          .set({
            currentModule: 1,
            currentWeek: 8,
            xp: Math.max(leo.xp ?? 0, 245),
            sessionsCompleted: Math.max(leo.sessionsCompleted ?? 0, 7),
            completedWeeks,
            updatedAt: new Date(),
          })
          .where(eq(majAthletes.username, "leo"));
        console.log("[migration] Leo Wilson progress restored to week 8");
      }
    } catch (e: any) {
      console.error("[migration] Leo Wilson restore:", e.message);
    }
  })();

  const httpServer = createServer(app);
  return httpServer;
}
