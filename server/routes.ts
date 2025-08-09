import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import bcrypt from "bcrypt";
import session from "express-session";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { insertUserSchema, insertChildSchema, insertEnrollmentSchema, insertPaymentSchema } from "@shared/schema";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(sessionConfig);

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
          }
        }
      }
      
      res.json({received: true});
    } catch (err: any) {
      console.error('Webhook signature verification failed.', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
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
      
      // Expected customer columns
      const customerColumns = ['email', 'mobile', 'firstName', 'lastName', 'address', 'suburb', 'postcode', 'emergencyContact'];
      const studentColumns = ['parentEmail', 'studentFirstName', 'studentLastName', 'dateOfBirth', 'medicalInfo', 'emergencyContact'];
      
      // Check if we have customer or student data based on headers
      const hasCustomerData = customerColumns.some(col => headers.includes(col));
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
        
        // Process as customer data
        if (hasCustomerData && rowData.email) {
          const customer = {
            email: rowData.email || '',
            mobile: rowData.mobile || '',
            firstName: rowData.firstName || '',
            lastName: rowData.lastName || '',
            address: rowData.address || '',
            suburb: rowData.suburb || '',
            postcode: rowData.postcode || '',
            emergencyContact: rowData.emergencyContact || '',
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
      
      // Expected customer columns
      const customerColumns = ['email', 'mobile', 'firstName', 'lastName', 'address', 'suburb', 'postcode', 'emergencyContact'];
      const studentColumns = ['parentEmail', 'studentFirstName', 'studentLastName', 'dateOfBirth', 'medicalInfo', 'emergencyContact'];
      
      const hasCustomerData = customerColumns.some(col => headers.includes(col));
      const hasStudentData = studentColumns.some(col => headers.includes(col));
      
      for (const row of dataRows) {
        if (row.length !== headers.length) continue;
        
        const rowData: any = {};
        headers.forEach((header, idx) => {
          rowData[header] = row[idx];
        });
        
        // Import customer data
        if (hasCustomerData && rowData.email && rowData.firstName && rowData.lastName) {
          try {
            // Check if user already exists
            const existingUser = await storage.getUserByEmail(rowData.email);
            if (!existingUser) {
              // Create new user with default password (they'll need to reset)
              const hashedPassword = await bcrypt.hash('ChangeMe123!', 10);
              await storage.createUser({
                email: rowData.email,
                mobile: rowData.mobile || '',
                firstName: rowData.firstName,
                lastName: rowData.lastName,
                password: hashedPassword,
                role: 'parent',
                address: rowData.address || '',
                suburb: rowData.suburb || '',
                postcode: rowData.postcode || '',
                emergencyContact: rowData.emergencyContact || '',
              });
              customersImported++;
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

  const httpServer = createServer(app);
  return httpServer;
}
