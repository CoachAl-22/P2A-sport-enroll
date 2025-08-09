import {
  users,
  children,
  venues,
  coaches,
  classes,
  enrollments,
  payments,
  notifications,
  seniorSquadApplications,
  blogArticles,
  attendanceRecords,
  termConfigurations,
  type User,
  type InsertUser,
  type Child,
  type InsertChild,
  type Venue,
  type InsertVenue,
  type Coach,
  type InsertCoach,
  type Class,
  type InsertClass,
  type Enrollment,
  type InsertEnrollment,
  type Payment,
  type InsertPayment,
  type Notification,
  type InsertNotification,
  type SeniorSquadApplication,
  type InsertSeniorSquadApplication,
  type BlogArticle,
  type InsertBlogArticle,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type TermConfiguration,
  type InsertTermConfiguration,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Child operations
  getChild(id: string): Promise<Child | undefined>;
  getChildrenByParent(parentId: string): Promise<Child[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: string, updates: Partial<Child>): Promise<Child>;

  // Venue operations
  getVenue(id: string): Promise<Venue | undefined>;
  getAllVenues(): Promise<Venue[]>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: string, updates: Partial<Venue>): Promise<Venue>;

  // Coach operations
  getCoach(id: string): Promise<Coach | undefined>;
  getAllCoaches(): Promise<Coach[]>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(id: string, updates: Partial<Coach>): Promise<Coach>;

  // Class operations
  getClass(id: string): Promise<Class | undefined>;
  getClassWithDetails(id: string): Promise<any>;
  getAllClasses(): Promise<Class[]>;
  getClassesByFilters(filters: {
    sportType?: string;
    venueId?: string;
    term?: string;
    year?: number;
    dayOfWeek?: number;
  }): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: string, updates: Partial<Class>): Promise<Class>;
  updateClassEnrollmentCount(classId: string): Promise<void>;

  // Enrollment operations
  getEnrollment(id: string): Promise<Enrollment | undefined>;
  getEnrollmentsByParent(parentId: string): Promise<any[]>;
  getEnrollmentsByClass(classId: string): Promise<any[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment>;
  getWaitlistPosition(classId: string): Promise<number>;

  // Payment operations
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByEnrollment(enrollmentId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<Payment>): Promise<Payment>;

  // Notification operations
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  updateNotification(id: string, updates: Partial<Notification>): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;

  // Analytics operations
  getEnrollmentStats(): Promise<{
    totalEnrolled: number;
    thisWeek: number;
    capacityPercentage: number;
  }>;
  getRevenueStats(): Promise<{
    thisTerm: number;
    outstanding: number;
    percentageChange: number;
  }>;

  // SMS notification operations
  getEnrollmentsByClassAndDate(classId: string | null, date: Date): Promise<any[]>;

  // Senior Squad Application operations
  createSeniorSquadApplication(application: InsertSeniorSquadApplication): Promise<SeniorSquadApplication>;
  getSeniorSquadApplication(id: string): Promise<SeniorSquadApplication | undefined>;
  getAllSeniorSquadApplications(): Promise<SeniorSquadApplication[]>;
  updateSeniorSquadApplication(id: string, updates: Partial<SeniorSquadApplication>): Promise<SeniorSquadApplication>;

  // Blog operations
  getBlogArticle(id: string): Promise<BlogArticle | undefined>;
  getBlogArticleBySlug(slug: string): Promise<BlogArticle | undefined>;
  getAllBlogArticles(published?: boolean): Promise<BlogArticle[]>;
  createBlogArticle(article: InsertBlogArticle): Promise<BlogArticle>;
  updateBlogArticle(id: string, updates: Partial<BlogArticle>): Promise<BlogArticle>;
  deleteBlogArticle(id: string): Promise<void>;
  
  // Attendance operations
  getTodaysClassesForCoach(coachUserId: string): Promise<any[]>;
  getStudentsForClass(classId: string): Promise<any[]>;
  markAttendance(attendanceData: any): Promise<any>;
  getAttendanceForClass(classId: string, date: string): Promise<any[]>;
  
  // Term Configuration operations
  createTermConfiguration(termConfig: any): Promise<any>;
  getTermConfigurations(): Promise<any[]>;
  getTermConfigurationById(id: string): Promise<any>;
  updateTermConfiguration(id: string, updates: any): Promise<any>;
  deleteTermConfiguration(id: string): Promise<void>;
  getActiveTermConfiguration(term: string, year: number): Promise<any>;
  calculateTermPrice(termConfigId: string, classesPerWeek: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByMobile(mobile: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.mobile, mobile));
    return user;
  }

  async getUserByUserId(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.userId, userId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  // Child operations
  async getChild(id: string): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async getChildrenByParent(parentId: string): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.parentId, parentId));
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [created] = await db.insert(children).values(child).returning();
    return created;
  }

  async updateChild(id: string, updates: Partial<Child>): Promise<Child> {
    const [updated] = await db
      .update(children)
      .set(updates)
      .where(eq(children.id, id))
      .returning();
    return updated;
  }

  // Venue operations
  async getVenue(id: string): Promise<Venue | undefined> {
    const [venue] = await db.select().from(venues).where(eq(venues.id, id));
    return venue;
  }

  async getAllVenues(): Promise<Venue[]> {
    return await db.select().from(venues).where(eq(venues.active, true));
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const [created] = await db.insert(venues).values(venue).returning();
    return created;
  }

  async updateVenue(id: string, updates: Partial<Venue>): Promise<Venue> {
    const [updated] = await db
      .update(venues)
      .set(updates)
      .where(eq(venues.id, id))
      .returning();
    return updated;
  }

  // Coach operations
  async getCoach(id: string): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.id, id));
    return coach;
  }

  async getAllCoaches(): Promise<Coach[]> {
    return await db.select().from(coaches).where(eq(coaches.active, true));
  }

  async createCoach(coach: InsertCoach): Promise<Coach> {
    const [created] = await db.insert(coaches).values(coach).returning();
    return created;
  }

  async updateCoach(id: string, updates: Partial<Coach>): Promise<Coach> {
    const [updated] = await db
      .update(coaches)
      .set(updates)
      .where(eq(coaches.id, id))
      .returning();
    return updated;
  }

  // Class operations
  async getClass(id: string): Promise<Class | undefined> {
    const [classData] = await db.select().from(classes).where(eq(classes.id, id));
    return classData;
  }

  async getClassWithDetails(id: string): Promise<any> {
    const [result] = await db
      .select({
        class: classes,
        venue: venues,
        coach: coaches,
      })
      .from(classes)
      .leftJoin(venues, eq(classes.venueId, venues.id))
      .leftJoin(coaches, eq(classes.coachId, coaches.id))
      .where(eq(classes.id, id));
    return result;
  }

  async getAllClasses(): Promise<Class[]> {
    return await db
      .select()
      .from(classes)
      .where(eq(classes.status, "active"))
      .orderBy(asc(classes.dayOfWeek), asc(classes.startTime));
  }

  async getClassesByFilters(filters: {
    sportType?: string;
    venueId?: string;
    term?: string;
    year?: number;
    dayOfWeek?: number;
  }): Promise<Class[]> {
    const conditions = [eq(classes.status, "active")];

    if (filters.sportType) {
      conditions.push(eq(classes.sportType, filters.sportType as any));
    }
    if (filters.venueId) {
      conditions.push(eq(classes.venueId, filters.venueId));
    }
    if (filters.term) {
      conditions.push(eq(classes.term, filters.term as any));
    }
    if (filters.year) {
      conditions.push(eq(classes.year, filters.year));
    }
    if (filters.dayOfWeek) {
      conditions.push(eq(classes.dayOfWeek, filters.dayOfWeek));
    }

    return await db
      .select()
      .from(classes)
      .where(and(...conditions))
      .orderBy(asc(classes.dayOfWeek), asc(classes.startTime));
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [created] = await db.insert(classes).values(classData).returning();
    return created;
  }

  async updateClass(id: string, updates: Partial<Class>): Promise<Class> {
    const [updated] = await db
      .update(classes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return updated;
  }

  async updateClassEnrollmentCount(classId: string): Promise<void> {
    const [result] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.status, "active")
        )
      );

    await db
      .update(classes)
      .set({ currentEnrollment: result.count })
      .where(eq(classes.id, classId));
  }

  // Enrollment operations
  async getEnrollment(id: string): Promise<Enrollment | undefined> {
    const [enrollment] = await db
      .select()
      .from(enrollments)
      .where(eq(enrollments.id, id));
    return enrollment;
  }

  async getEnrollmentsByParent(parentId: string): Promise<any[]> {
    return await db
      .select({
        enrollment: enrollments,
        child: children,
        class: classes,
        venue: venues,
        coach: coaches,
      })
      .from(enrollments)
      .leftJoin(children, eq(enrollments.childId, children.id))
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .leftJoin(venues, eq(classes.venueId, venues.id))
      .leftJoin(coaches, eq(classes.coachId, coaches.id))
      .where(eq(enrollments.parentId, parentId))
      .orderBy(desc(enrollments.createdAt));
  }

  async getEnrollmentsByClass(classId: string): Promise<any[]> {
    return await db
      .select({
        enrollment: enrollments,
        child: children,
        parent: users,
      })
      .from(enrollments)
      .leftJoin(children, eq(enrollments.childId, children.id))
      .leftJoin(users, eq(enrollments.parentId, users.id))
      .where(eq(enrollments.classId, classId))
      .orderBy(asc(enrollments.createdAt));
  }

  async createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment> {
    const [created] = await db.insert(enrollments).values(enrollment).returning();
    await this.updateClassEnrollmentCount(enrollment.classId);
    return created;
  }

  async updateEnrollment(id: string, updates: Partial<Enrollment>): Promise<Enrollment> {
    const [updated] = await db
      .update(enrollments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(enrollments.id, id))
      .returning();
    return updated;
  }

  async getWaitlistPosition(classId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.status, "waitlist")
        )
      );
    return result.count + 1;
  }

  // Payment operations
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByEnrollment(enrollmentId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.enrollmentId, enrollmentId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const [updated] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  // Notification operations
  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return notification;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(notification).returning();
    return created;
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification> {
    const [updated] = await db
      .update(notifications)
      .set(updates)
      .where(eq(notifications.id, id))
      .returning();
    return updated;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  // Analytics operations
  async getEnrollmentStats(): Promise<{
    totalEnrolled: number;
    thisWeek: number;
    capacityPercentage: number;
  }> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const [totalResult] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(eq(enrollments.status, "active"));

    const [weekResult] = await db
      .select({ count: count() })
      .from(enrollments)
      .where(
        and(
          eq(enrollments.status, "active"),
          gte(enrollments.createdAt, oneWeekAgo)
        )
      );

    const [capacityResult] = await db
      .select({
        totalCapacity: sql<number>`sum(${classes.maxCapacity})`,
        currentEnrollment: sql<number>`sum(${classes.currentEnrollment})`,
      })
      .from(classes)
      .where(eq(classes.status, "active"));

    const capacityPercentage = capacityResult.totalCapacity > 0
      ? Math.round((capacityResult.currentEnrollment / capacityResult.totalCapacity) * 100)
      : 0;

    return {
      totalEnrolled: totalResult.count,
      thisWeek: weekResult.count,
      capacityPercentage,
    };
  }

  async getRevenueStats(): Promise<{
    thisTerm: number;
    outstanding: number;
    percentageChange: number;
  }> {
    const currentYear = new Date().getFullYear();
    const currentTerm = "term_3"; // Current term based on date

    const [termResult] = await db
      .select({
        total: sql<number>`sum(${payments.amount})`,
      })
      .from(payments)
      .leftJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .where(
        and(
          eq(payments.status, "completed"),
          eq(classes.term, currentTerm),
          eq(classes.year, currentYear)
        )
      );

    const [outstandingResult] = await db
      .select({
        total: sql<number>`sum(${payments.amount})`,
      })
      .from(payments)
      .where(eq(payments.status, "pending"));

    return {
      thisTerm: termResult.total || 0,
      outstanding: outstandingResult.total || 0,
      percentageChange: 12, // Placeholder - would calculate from previous term
    };
  }

  // SMS notification operations
  async getEnrollmentsByClassAndDate(classId: string | null, date: Date): Promise<any[]> {
    const result = await db
      .select({
        id: enrollments.id,
        parentId: enrollments.parentId,
        childId: enrollments.childId,
        classId: enrollments.classId,
        status: enrollments.status,
      })
      .from(enrollments)
      .innerJoin(classes, eq(enrollments.classId, classes.id))
      .where(
        and(
          classId ? eq(enrollments.classId, classId) : sql`1=1`,
          eq(enrollments.status, "active"),
          sql`DATE(${classes.startDate}) = DATE(${date})`
        )
      );
    
    return result;
  }

  // Senior Squad Application operations
  async createSeniorSquadApplication(application: InsertSeniorSquadApplication): Promise<SeniorSquadApplication> {
    const [created] = await db.insert(seniorSquadApplications).values(application).returning();
    return created;
  }

  async getSeniorSquadApplication(id: string): Promise<SeniorSquadApplication | undefined> {
    const [application] = await db.select().from(seniorSquadApplications).where(eq(seniorSquadApplications.id, id));
    return application;
  }

  async getAllSeniorSquadApplications(): Promise<SeniorSquadApplication[]> {
    return await db.select().from(seniorSquadApplications).orderBy(desc(seniorSquadApplications.createdAt));
  }

  async updateSeniorSquadApplication(id: string, updates: Partial<SeniorSquadApplication>): Promise<SeniorSquadApplication> {
    const [updated] = await db
      .update(seniorSquadApplications)
      .set(updates)
      .where(eq(seniorSquadApplications.id, id))
      .returning();
    return updated;
  }

  // Blog operations
  async getBlogArticle(id: string): Promise<BlogArticle | undefined> {
    const [article] = await db.select().from(blogArticles).where(eq(blogArticles.id, id));
    return article;
  }

  async getBlogArticleBySlug(slug: string): Promise<BlogArticle | undefined> {
    const [article] = await db.select().from(blogArticles).where(eq(blogArticles.slug, slug));
    return article;
  }

  async getAllBlogArticles(published?: boolean): Promise<BlogArticle[]> {
    const query = db.select().from(blogArticles);
    
    if (published !== undefined) {
      return await query.where(eq(blogArticles.published, published)).orderBy(desc(blogArticles.publishedAt || blogArticles.createdAt));
    }
    
    return await query.orderBy(desc(blogArticles.createdAt));
  }

  async createBlogArticle(article: InsertBlogArticle): Promise<BlogArticle> {
    const [created] = await db.insert(blogArticles).values(article).returning();
    return created;
  }

  async updateBlogArticle(id: string, updates: Partial<BlogArticle>): Promise<BlogArticle> {
    const [updated] = await db
      .update(blogArticles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(blogArticles.id, id))
      .returning();
    return updated;
  }

  async deleteBlogArticle(id: string): Promise<void> {
    await db.delete(blogArticles).where(eq(blogArticles.id, id));
  }

  // Attendance operations
  async getTodaysClassesForCoach(coachUserId: string): Promise<any[]> {
    const today = new Date();
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // Convert Sunday from 0 to 7
    
    return await db
      .select({
        id: classes.id,
        name: classes.name,
        startTime: classes.startTime,
        endTime: classes.endTime,
        venue: venues.name,
        currentEnrollment: classes.currentEnrollment,
        maxCapacity: classes.maxCapacity,
      })
      .from(classes)
      .innerJoin(venues, eq(classes.venueId, venues.id))
      .innerJoin(coaches, eq(classes.coachId, coaches.id))
      .where(
        and(
          eq(coaches.userId, coachUserId),
          eq(classes.dayOfWeek, dayOfWeek),
          eq(classes.status, "active")
        )
      )
      .orderBy(classes.startTime);
  }

  async getStudentsForClass(classId: string): Promise<any[]> {
    return await db
      .select({
        childId: children.id,
        firstName: children.firstName,
        lastName: children.lastName,
        grade: children.grade,
        medicalInfo: children.medicalInfo,
        enrollmentId: enrollments.id,
        enrollmentStatus: enrollments.status,
      })
      .from(enrollments)
      .innerJoin(children, eq(enrollments.childId, children.id))
      .where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.status, "active")
        )
      )
      .orderBy(children.firstName, children.lastName);
  }

  async markAttendance(attendanceData: any): Promise<any> {
    try {
      // Use raw SQL to insert attendance record to avoid Drizzle timestamp issues
      const result = await db.execute(sql`
        INSERT INTO attendance_records (
          class_id, child_id, attendance_date, status, absence_reason, 
          credits_eligible, marked_by, notes
        ) VALUES (
          ${attendanceData.classId}, 
          ${attendanceData.childId}, 
          ${attendanceData.attendanceDate}::timestamp, 
          ${attendanceData.status}, 
          ${attendanceData.absenceReason}, 
          ${attendanceData.creditsEligible || false}, 
          ${attendanceData.markedBy}, 
          ${attendanceData.notes}
        ) RETURNING *
      `);
      
      return result.rows[0];
    } catch (error) {
      console.error('Error in markAttendance:', error);
      throw error;
    }
  }

  async getAttendanceForClass(classId: string, date: string): Promise<any[]> {
    try {
      const attendanceDate = new Date(date);
      
      // Use raw SQL to get enrolled students and their attendance records
      const result = await db.execute(sql`
        SELECT 
          c.id as "studentId",
          c.first_name as "firstName",
          c.last_name as "lastName",
          EXTRACT(YEAR FROM AGE(c.date_of_birth)) as "age",
          ar.id as "attendanceId",
          ar.status as "attendanceStatus",
          ar.notes as "attendanceNotes",
          ar.absence_reason as "absenceReason",
          ar.credits_eligible as "creditsEligible"
        FROM enrollments e
        INNER JOIN children c ON e.child_id = c.id
        LEFT JOIN attendance_records ar ON (
          ar.child_id = c.id 
          AND ar.class_id = e.class_id 
          AND ar.attendance_date = ${attendanceDate}
        )
        WHERE e.class_id = ${classId} 
          AND e.status = 'active'
        ORDER BY c.first_name, c.last_name
      `);

      // Transform the result to match the expected format
      return result.rows.map((row: any) => ({
        student: {
          id: row.studentId,
          firstName: row.firstName,
          lastName: row.lastName,
          age: parseInt(row.age) || 0,
        },
        attendance: row.attendanceId ? {
          id: row.attendanceId,
          status: row.attendanceStatus,
          notes: row.attendanceNotes,
          absenceReason: row.absenceReason,
          creditsEligible: row.creditsEligible,
        } : null,
      }));
      
    } catch (error) {
      console.error('Error in getAttendanceForClass:', error);
      return [];
    }
  }

  async getClassesByCoach(userId: string): Promise<any[]> {
    try {
      // Use raw SQL to avoid Drizzle ORM issues
      const result = await db.execute(sql`
        SELECT 
          c.id,
          c.name,
          c.day_of_week as "dayOfWeek",
          c.start_time as "startTime",
          c.end_time as "endTime",
          c.venue_id as "venueId",
          v.name as "venueName",
          c.current_enrollment as "currentEnrollments",
          c.max_capacity as "maxCapacity"
        FROM classes c
        LEFT JOIN venues v ON c.venue_id = v.id
        INNER JOIN coaches coach ON c.coach_id = coach.id
        WHERE coach.user_id = ${userId}
        ORDER BY c.day_of_week, c.start_time
      `);
      
      return result.rows;
      
    } catch (error) {
      console.error('Error in getClassesByCoach:', error);
      return [];
    }
  }

  // Term Configuration operations
  async createTermConfiguration(termConfig: any): Promise<any> {
    const [created] = await db
      .insert(termConfigurations)
      .values(termConfig)
      .returning();
    return created;
  }

  async getTermConfigurations(): Promise<any[]> {
    return await db
      .select()
      .from(termConfigurations)
      .orderBy(termConfigurations.year, termConfigurations.term);
  }

  async getTermConfigurationById(id: string): Promise<any> {
    const [termConfig] = await db
      .select()
      .from(termConfigurations)
      .where(eq(termConfigurations.id, id));
    return termConfig;
  }

  async updateTermConfiguration(id: string, updates: any): Promise<any> {
    const [updated] = await db
      .update(termConfigurations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(termConfigurations.id, id))
      .returning();
    return updated;
  }

  async deleteTermConfiguration(id: string): Promise<void> {
    await db.delete(termConfigurations).where(eq(termConfigurations.id, id));
  }

  async getActiveTermConfiguration(term: string, year: number): Promise<any> {
    const [termConfig] = await db
      .select()
      .from(termConfigurations)
      .where(
        and(
          eq(termConfigurations.term, term as any),
          eq(termConfigurations.year, year),
          eq(termConfigurations.active, true)
        )
      );
    return termConfig;
  }

  async calculateTermPrice(termConfigId: string, classesPerWeek: number = 1): Promise<any> {
    const [termConfig] = await db
      .select()
      .from(termConfigurations)
      .where(eq(termConfigurations.id, termConfigId));

    if (!termConfig) {
      throw new Error('Term configuration not found');
    }

    const basePrice = Number(termConfig.pricePerWeek) * termConfig.weeksCount * classesPerWeek;
    const gstAmount = basePrice * Number(termConfig.gstRate);
    const totalPrice = basePrice + gstAmount;

    return {
      basePrice: Number(basePrice.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      totalPrice: Number(totalPrice.toFixed(2)),
      weeksCount: termConfig.weeksCount,
      pricePerWeek: Number(termConfig.pricePerWeek),
      classesPerWeek
    };
  }
}

export const storage = new DatabaseStorage();
