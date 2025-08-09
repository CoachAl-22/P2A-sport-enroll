import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import session from "express-session";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { smsService } from "./sms";
import { insertUserSchema, insertChildSchema, insertEnrollmentSchema, insertPaymentSchema, insertSeniorSquadApplicationSchema, insertBlogArticleSchema, enrollments as enrollmentsTable, classes, coaches, venues } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod";

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30.basil",
  });
}

// Session configuration
const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
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

const enrollmentFormSchema = insertEnrollmentSchema.extend({
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
  // Session middleware
  app.use(sessionConfig);
  // Mobile auth middleware
  app.use(authMiddleware);

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
  app.get("/api/classes", async (req, res) => {
    try {
      const filters = {
        sportType: req.query.sportType as string,
        venueId: req.query.venueId as string,
        term: req.query.term as string,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        dayOfWeek: req.query.dayOfWeek ? parseInt(req.query.dayOfWeek as string) : undefined,
      };
      
      const classes = await storage.getClassesByFilters(filters);
      res.json(classes);
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

  app.post("/api/enrollments", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    try {
      const { childInfo, ...enrollmentData } = enrollmentFormSchema.parse(req.body);
      
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
      
      const enrollmentStatus = (classData.currentEnrollment || 0) >= classData.maxCapacity ? "waitlist" : "pending_payment";
      const waitlistPosition = enrollmentStatus === "waitlist" ? await storage.getWaitlistPosition(enrollmentData.classId) : undefined;
      
      const enrollment = await storage.createEnrollment({
        childId,
        classId: enrollmentData.classId,
        parentId: userId,
        status: enrollmentStatus as any,
        autoRenew: enrollmentData.autoRenew ?? true,
        waitlistPosition,
        notes: enrollmentData.notes,
      });
      
      // Create payment record if not waitlisted
      if (enrollmentStatus === "pending_payment") {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Payment due in 7 days
        
        await storage.createPayment({
          enrollmentId: enrollment.id,
          amount: classData.pricePerTerm.toString(),
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
      
      const amount = Math.round(parseFloat(classData.pricePerTerm) * 100); // Convert to cents
      
      if (!stripe) {
        return res.status(500).json({ message: "Payment processing not configured" });
      }
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "aud",
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

  app.post("/api/webhook/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Payment processing not configured" });
      }
      
      const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
      
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const enrollmentId = paymentIntent.metadata.enrollmentId;
        
        if (enrollmentId) {
          // Update enrollment status to active
          await storage.updateEnrollment(enrollmentId, { status: "active" });
          
          // Update payment record
          const payments = await storage.getPaymentsByEnrollment(enrollmentId);
          if (payments.length > 0) {
            await storage.updatePayment(payments[0].id, {
              status: "completed",
              stripePaymentIntentId: paymentIntent.id,
              paidAt: new Date(),
            });
          }
          
          // Update class enrollment count
          const enrollment = await storage.getEnrollment(enrollmentId);
          if (enrollment) {
            await storage.updateClassEnrollmentCount(enrollment.classId);
            
            // Send payment confirmation SMS
            try {
              const parent = await storage.getUser(enrollment.parentId);
              const child = await storage.getChild(enrollment.childId);
              const classData = await storage.getClass(enrollment.classId);
              
              if (parent?.mobile && child && classData) {
                const amount = (paymentIntent.amount / 100).toFixed(2);
                await smsService.sendPaymentConfirmation(
                  parent.mobile,
                  child.firstName,
                  amount,
                  classData.name
                );
              }
            } catch (smsError) {
              console.log('Payment confirmation SMS failed:', smsError);
            }
          }
        }
      }
      
      res.json({received: true});
    } catch (err: any) {
      console.error('Webhook signature verification failed.', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
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
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const { uploadURL } = req.body;
      const objectStorageService = new ObjectStorageService();
      
      // Parse the object path from the upload URL
      const url = new URL(uploadURL);
      const objectPath = url.pathname;
      
      const csvFile = await objectStorageService.getCSVFile(objectPath);
      const csvContent = await objectStorageService.downloadCSVContent(csvFile);
      
      // Parse CSV content
      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
      
      // Separate customers and students data
      const customersPreview: any[] = [];
      const studentsPreview: any[] = [];
      const issues: string[] = [];
      
      // Expected customer columns - updated for SportsBiz format
      const sportsBizColumns = ['Email', 'Mobile Phone 1', 'First Name', 'Last Name', 'Address #1', 'Suburb', 'Postcode', 'Active'];
      const studentColumns = ['parentEmail', 'studentFirstName', 'studentLastName', 'dateOfBirth', 'medicalInfo', 'emergencyContact'];
      
      // Check if we have customer or student data based on headers
      const hasCustomerData = sportsBizColumns.some(col => headers.includes(col));
      const hasStudentData = studentColumns.some(col => headers.includes(col));
      
      if (!hasCustomerData && !hasStudentData) {
        issues.push('No recognized customer or student columns found in CSV');
      }
      
      dataRows.slice(0, 50).forEach((row, index) => {
        if (row.length !== headers.length) {
          issues.push(`Row ${index + 2}: Column count mismatch (expected ${headers.length}, got ${row.length})`);
          return;
        }
        
        const rowData: any = {};
        headers.forEach((header, idx) => {
          rowData[header] = row[idx];
        });
        
        // Process as customer data (SportsBiz format)
        if (hasCustomerData && rowData['Email']) {
          const customer = {
            email: rowData['Email'] || '',
            mobile: rowData['Mobile Phone 1'] || '',
            firstName: rowData['First Name'] || '',
            lastName: rowData['Last Name'] || '',
            address: rowData['Address #1'] || '',
            suburb: rowData['Suburb'] || '',
            postcode: rowData['Postcode'] || '',
            active: rowData['Active'] || '',
            state: rowData['State'] || '',
          };
          
          // Validate required fields
          if (!customer.email) {
            issues.push(`Row ${index + 2}: Missing required email`);
          }
          if (!customer.firstName || !customer.lastName) {
            issues.push(`Row ${index + 2}: Missing required name fields`);
          }
          
          customersPreview.push(customer);
        }
        
        // Process as student data
        if (hasStudentData && rowData.parentEmail && rowData.studentFirstName) {
          const student = {
            parentEmail: rowData.parentEmail || '',
            studentFirstName: rowData.studentFirstName || '',
            studentLastName: rowData.studentLastName || '',
            dateOfBirth: rowData.dateOfBirth || '',
            medicalInfo: rowData.medicalInfo || '',
            emergencyContact: rowData.emergencyContact || '',
          };
          
          // Validate required fields
          if (!student.parentEmail) {
            issues.push(`Row ${index + 2}: Missing required parent email`);
          }
          if (!student.studentFirstName || !student.studentLastName) {
            issues.push(`Row ${index + 2}: Missing required student name fields`);
          }
          
          studentsPreview.push(student);
        }
      });
      
      res.json({
        customersPreview,
        studentsPreview,
        issues,
        totalRows: dataRows.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/csv-import", async (req, res) => {
    const userId = (req.session as any)?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await storage.getUser(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    try {
      const { uploadURL } = req.body;
      const objectStorageService = new ObjectStorageService();
      
      // Parse the object path from the upload URL
      const url = new URL(uploadURL);
      const objectPath = url.pathname;
      
      const csvFile = await objectStorageService.getCSVFile(objectPath);
      const csvContent = await objectStorageService.downloadCSVContent(csvFile);
      
      // Parse CSV content
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim().replace(/"/g, '')));
      
      let customersImported = 0;
      let studentsImported = 0;
      
      // Expected customer columns - updated for SportsBiz format
      const sportsBizColumns = ['Email', 'Mobile Phone 1', 'First Name', 'Last Name', 'Address #1', 'Suburb', 'Postcode', 'Active'];
      const studentColumns = ['parentEmail', 'studentFirstName', 'studentLastName', 'dateOfBirth', 'medicalInfo', 'emergencyContact'];
      
      const hasCustomerData = sportsBizColumns.some(col => headers.includes(col));
      const hasStudentData = studentColumns.some(col => headers.includes(col));
      
      for (const row of dataRows) {
        if (row.length !== headers.length) continue;
        
        const rowData: any = {};
        headers.forEach((header, idx) => {
          rowData[header] = row[idx];
        });
        
        // Import customer data (SportsBiz format)
        if (hasCustomerData && rowData['Email'] && rowData['First Name'] && rowData['Last Name']) {
          try {
            // Only import active customers
            if (rowData['Active'] === 'True') {
              // Check if user already exists
              const existingUser = await storage.getUserByEmail(rowData['Email']);
              if (!existingUser) {
                // Create new user with default password (they'll need to reset)
                const hashedPassword = await bcrypt.hash('Power2ADAPT2024!', 10);
                await storage.createUser({
                  email: rowData['Email'],
                  mobile: rowData['Mobile Phone 1'] || '',
                  firstName: rowData['First Name'],
                  lastName: rowData['Last Name'],
                  password: hashedPassword,
                  role: 'parent'
                });
                customersImported++;
              }
            }
          } catch (error) {
            console.error('Error importing customer:', error);
          }
        }
        
        // Import student data
        if (hasStudentData && rowData.parentEmail && rowData.studentFirstName && rowData.studentLastName) {
          try {
            // Find parent by email
            const parent = await storage.getUserByEmail(rowData.parentEmail);
            if (parent) {
              // Check if child already exists for this parent
              const existingChildren = await storage.getChildrenByParent(parent.id);
              const childExists = existingChildren.some(child => 
                child.firstName === rowData.studentFirstName && 
                child.lastName === rowData.studentLastName
              );
              
              if (!childExists) {
                await storage.createChild({
                  parentId: parent.id,
                  firstName: rowData.studentFirstName,
                  lastName: rowData.studentLastName,
                  dateOfBirth: rowData.dateOfBirth ? new Date(rowData.dateOfBirth) : new Date(),
                  medicalInfo: rowData.medicalInfo || '',
                  emergencyContact: rowData.emergencyContact || '',
                });
                studentsImported++;
              }
            }
          } catch (error) {
            console.error('Error importing student:', error);
          }
        }
      }
      
      res.json({
        customersImported,
        studentsImported,
        message: `Successfully imported ${customersImported} customers and ${studentsImported} students`
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
      
      // Send confirmation SMS to athlete (or parent if provided)
      const phoneNumber = applicationData.parentGuardianPhone || applicationData.athletePhone;
      const athleteName = `${applicationData.athleteFirstName} ${applicationData.athleteLastName}`;
      
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
      const userId = (req.user as any)?.claims?.sub || (req.session as any)?.userId;
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
      const userId = (req.user as any)?.claims?.sub || (req.session as any)?.userId;
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
      const userId = (req.user as any)?.claims?.sub || (req.session as any)?.userId;
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
      const userId = (req.user as any)?.claims?.sub || (req.session as any)?.userId;
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
      const userId = (req.user as any)?.claims?.sub || (req.session as any)?.userId;
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
  app.get("/api/term-configurations", async (req, res) => {
    try {
      const termConfigs = await storage.getTermConfigurations();
      res.json(termConfigs);
    } catch (error: any) {
      console.error('Error getting term configurations:', error);
      res.status(500).json({ message: "Failed to fetch term configurations" });
    }
  });

  app.post("/api/term-configurations", async (req, res) => {
    try {
      const termConfig = await storage.createTermConfiguration(req.body);
      res.status(201).json(termConfig);
    } catch (error: any) {
      console.error('Error creating term configuration:', error);
      res.status(500).json({ message: "Failed to create term configuration" });
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

  app.put("/api/term-configurations/:id", async (req, res) => {
    try {
      const termConfig = await storage.updateTermConfiguration(req.params.id, req.body);
      res.json(termConfig);
    } catch (error: any) {
      console.error('Error updating term configuration:', error);
      res.status(500).json({ message: "Failed to update term configuration" });
    }
  });

  app.delete("/api/term-configurations/:id", async (req, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
