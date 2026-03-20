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
  highPerformanceSquadApplications,
  juniorAcademyApplications,
  contactEnquiries,
  waitlists,
  blogArticles,
  attendanceRecords,
  termConfigurations,
  termHolidays,
  performanceRecords,
  trainingGoals,
  performanceVideoHighlights,
  videoShares,
  surveyResponses,
  majAthletes,
  majReflections,
  majBadges,
  majCoaches,
  type MajAthlete,
  type MajReflection,
  type MajBadge,
  type MajCoach,
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
  type HighPerformanceSquadApplication,
  type InsertHighPerformanceSquadApplication,
  type JuniorAcademyApplication,
  type InsertJuniorAcademyApplication,
  type ContactEnquiry,
  type InsertContactEnquiry,
  type Waitlist,
  type InsertWaitlist,
  type BlogArticle,
  type InsertBlogArticle,
  type AttendanceRecord,
  type InsertAttendanceRecord,
  type TermConfiguration,
  type InsertTermConfiguration,
  type TermHoliday,
  type InsertTermHoliday,
  type PerformanceVideoHighlight,
  type InsertPerformanceVideoHighlight,
  type VideoShare,
  type InsertVideoShare,
  type PerformanceRecord,
  type InsertPerformanceRecord,
  type TrainingGoal,
  type InsertTrainingGoal,
  type SurveyResponse,
  type InsertSurveyResponse,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, count, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByMobile(mobile: string): Promise<User | undefined>;
  getUserByUserId(userId: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deleteUser(id: string): Promise<void>;

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
  getCoachByUserId(userId: string): Promise<Coach | undefined>;
  createCoach(coach: InsertCoach): Promise<Coach>;
  updateCoach(id: string, updates: Partial<Coach>): Promise<Coach>;
  deleteCoach(id: string): Promise<void>;

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
  deleteClass(id: string): Promise<void>;
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

  // High Performance Squad Application operations
  createHighPerformanceSquadApplication(application: InsertHighPerformanceSquadApplication): Promise<HighPerformanceSquadApplication>;
  getHighPerformanceSquadApplication(id: string): Promise<HighPerformanceSquadApplication | undefined>;
  getAllHighPerformanceSquadApplications(): Promise<HighPerformanceSquadApplication[]>;
  updateHighPerformanceSquadApplication(id: string, updates: Partial<HighPerformanceSquadApplication>): Promise<HighPerformanceSquadApplication>;

  // Junior Academy Application operations
  createJuniorAcademyApplication(application: InsertJuniorAcademyApplication): Promise<JuniorAcademyApplication>;
  getJuniorAcademyApplication(id: string): Promise<JuniorAcademyApplication | undefined>;
  getAllJuniorAcademyApplications(): Promise<JuniorAcademyApplication[]>;
  updateJuniorAcademyApplication(id: string, updates: Partial<JuniorAcademyApplication>): Promise<JuniorAcademyApplication>;

  // Contact Enquiry operations
  createContactEnquiry(enquiry: InsertContactEnquiry): Promise<ContactEnquiry>;
  getContactEnquiry(id: string): Promise<ContactEnquiry | undefined>;
  getAllContactEnquiries(): Promise<ContactEnquiry[]>;
  updateContactEnquiry(id: string, updates: Partial<ContactEnquiry>): Promise<ContactEnquiry>;

  // Waitlist operations
  addToWaitlist(waitlistData: InsertWaitlist): Promise<Waitlist>;
  getWaitlistByClass(classId: string): Promise<Waitlist[]>;
  getWaitlistByParent(parentId: string): Promise<Waitlist[]>;
  getWaitlistPosition(classId: string, childId: string): Promise<number | null>;
  getWaitlistPositionByChild(classId: string, childId: string): Promise<number | null>;
  updateWaitlistStatus(id: string, status: string, notificationExpiry?: Date): Promise<Waitlist>;
  removeFromWaitlist(id: string): Promise<void>;
  moveUpWaitlist(classId: string): Promise<void>;
  getNextWaitlistEntry(classId: string): Promise<Waitlist | undefined>;

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

  // Performance Video Highlights operations
  createPerformanceVideoHighlight(videoData: InsertPerformanceVideoHighlight): Promise<PerformanceVideoHighlight>;
  getPerformanceVideoHighlight(id: string): Promise<PerformanceVideoHighlight | undefined>;
  getAllPerformanceVideoHighlights(): Promise<PerformanceVideoHighlight[]>;
  getPerformanceVideoHighlightsByChild(childId: string): Promise<PerformanceVideoHighlight[]>;
  getPerformanceVideoHighlightsByCoach(coachId: string): Promise<PerformanceVideoHighlight[]>;
  getPerformanceVideoHighlightsByClass(classId: string): Promise<PerformanceVideoHighlight[]>;
  updatePerformanceVideoHighlight(id: string, updates: Partial<PerformanceVideoHighlight>): Promise<PerformanceVideoHighlight>;
  deletePerformanceVideoHighlight(id: string): Promise<void>;
  
  // Video Share operations
  createVideoShare(shareData: InsertVideoShare): Promise<VideoShare>;
  getVideoSharesByVideo(videoId: string): Promise<VideoShare[]>;
  getVideoSharesByParent(parentId: string): Promise<VideoShare[]>;
  updateVideoShare(id: string, updates: Partial<VideoShare>): Promise<VideoShare>;
  deleteVideoShare(id: string): Promise<void>;

  // Performance Record operations
  getPerformanceRecordsByChild(childId: string): Promise<PerformanceRecord[]>;
  createPerformanceRecord(record: InsertPerformanceRecord): Promise<PerformanceRecord>;
  updatePerformanceRecord(id: string, updates: Partial<PerformanceRecord>): Promise<PerformanceRecord>;
  deletePerformanceRecord(id: string): Promise<void>;

  // Training Goal operations
  getTrainingGoalsByChild(childId: string): Promise<TrainingGoal[]>;
  createTrainingGoal(goal: InsertTrainingGoal): Promise<TrainingGoal>;
  updateTrainingGoal(id: string, updates: Partial<TrainingGoal>): Promise<TrainingGoal>;
  deleteTrainingGoal(id: string): Promise<void>;

  // All children (for admin)
  getAllChildren(): Promise<Child[]>;

  // Survey operations
  createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getAllSurveyResponses(): Promise<SurveyResponse[]>;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.firstName), asc(users.lastName));
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

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Child operations
  async getChild(id: string): Promise<Child | undefined> {
    const [child] = await db.select().from(children).where(eq(children.id, id));
    return child;
  }

  async getChildrenByParent(parentId: string): Promise<Child[]> {
    return await db.select().from(children).where(eq(children.parentId, parentId));
  }

  async getAllChildren(): Promise<Child[]> {
    return await db.select().from(children).orderBy(asc(children.firstName), asc(children.lastName));
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

  async getCoachByUserId(userId: string): Promise<Coach | undefined> {
    const [coach] = await db.select().from(coaches).where(eq(coaches.userId, userId));
    return coach;
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

  async deleteCoach(id: string): Promise<void> {
    await db.delete(coaches).where(eq(coaches.id, id));
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

  async deleteClass(id: string): Promise<void> {
    await db.delete(classes).where(eq(classes.id, id));
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

  async getAllEnrollmentsWithDetails(): Promise<any[]> {
    return await db
      .select({
        enrollment: enrollments,
        child: children,
        parent: users,
        class: classes,
        venue: venues,
        coach: coaches,
      })
      .from(enrollments)
      .leftJoin(children, eq(enrollments.childId, children.id))
      .leftJoin(users, eq(enrollments.parentId, users.id))
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .leftJoin(venues, eq(classes.venueId, venues.id))
      .leftJoin(coaches, eq(classes.coachId, coaches.id))
      .orderBy(desc(enrollments.createdAt));
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

  async updatePaymentInvoice(paymentId: string, invoiceNumber: string, invoicePdfPath?: string) {
    return await db
      .update(payments)
      .set({
        invoiceNumber,
        invoiceGenerated: true,
        invoicePdfPath,
      })
      .where(eq(payments.id, paymentId))
      .returning();
  }

  async getPaymentWithDetails(paymentId: string) {
    const result = await db
      .select({
        payment: payments,
        enrollment: enrollments,
        child: children,
        parent: users,
        class: classes,
        venue: venues,
        termConfig: termConfigurations,
      })
      .from(payments)
      .leftJoin(enrollments, eq(payments.enrollmentId, enrollments.id))
      .leftJoin(children, eq(enrollments.childId, children.id))
      .leftJoin(users, eq(enrollments.parentId, users.id))
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .leftJoin(venues, eq(classes.venueId, venues.id))
      .leftJoin(termConfigurations, eq(classes.termConfigId, termConfigurations.id))
      .where(eq(payments.id, paymentId));

    return result[0] || null;
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

  // High Performance Squad Application operations
  async createHighPerformanceSquadApplication(application: InsertHighPerformanceSquadApplication): Promise<HighPerformanceSquadApplication> {
    const [created] = await db.insert(highPerformanceSquadApplications).values(application).returning();
    return created;
  }

  async getHighPerformanceSquadApplication(id: string): Promise<HighPerformanceSquadApplication | undefined> {
    const [application] = await db.select().from(highPerformanceSquadApplications).where(eq(highPerformanceSquadApplications.id, id));
    return application;
  }

  async getAllHighPerformanceSquadApplications(): Promise<HighPerformanceSquadApplication[]> {
    return await db.select().from(highPerformanceSquadApplications).orderBy(desc(highPerformanceSquadApplications.createdAt));
  }

  async updateHighPerformanceSquadApplication(id: string, updates: Partial<HighPerformanceSquadApplication>): Promise<HighPerformanceSquadApplication> {
    const [updated] = await db
      .update(highPerformanceSquadApplications)
      .set(updates)
      .where(eq(highPerformanceSquadApplications.id, id))
      .returning();
    return updated;
  }

  // Junior Academy Application operations
  async createJuniorAcademyApplication(application: InsertJuniorAcademyApplication): Promise<JuniorAcademyApplication> {
    const [created] = await db.insert(juniorAcademyApplications).values(application).returning();
    return created;
  }

  async getJuniorAcademyApplication(id: string): Promise<JuniorAcademyApplication | undefined> {
    const [application] = await db.select().from(juniorAcademyApplications).where(eq(juniorAcademyApplications.id, id));
    return application;
  }

  async getAllJuniorAcademyApplications(): Promise<JuniorAcademyApplication[]> {
    return await db.select().from(juniorAcademyApplications).orderBy(desc(juniorAcademyApplications.createdAt));
  }

  async updateJuniorAcademyApplication(id: string, updates: Partial<JuniorAcademyApplication>): Promise<JuniorAcademyApplication> {
    const [updated] = await db
      .update(juniorAcademyApplications)
      .set(updates)
      .where(eq(juniorAcademyApplications.id, id))
      .returning();
    return updated;
  }

  // Contact Enquiry operations
  async createContactEnquiry(enquiry: InsertContactEnquiry): Promise<ContactEnquiry> {
    const [created] = await db.insert(contactEnquiries).values(enquiry).returning();
    return created;
  }

  async getContactEnquiry(id: string): Promise<ContactEnquiry | undefined> {
    const [enquiry] = await db.select().from(contactEnquiries).where(eq(contactEnquiries.id, id));
    return enquiry;
  }

  async getAllContactEnquiries(): Promise<ContactEnquiry[]> {
    return db.select().from(contactEnquiries).orderBy(desc(contactEnquiries.createdAt));
  }

  async updateContactEnquiry(id: string, updates: Partial<ContactEnquiry>): Promise<ContactEnquiry> {
    const [updated] = await db
      .update(contactEnquiries)
      .set(updates)
      .where(eq(contactEnquiries.id, id))
      .returning();
    return updated;
  }

  // Waitlist operations
  async addToWaitlist(waitlistData: InsertWaitlist): Promise<Waitlist> {
    // Get the next position in the waitlist for this class
    const [lastPosition] = await db
      .select({ position: sql<number>`COALESCE(MAX(${waitlists.position}), 0)` })
      .from(waitlists)
      .where(eq(waitlists.classId, waitlistData.classId));

    const nextPosition = (lastPosition?.position || 0) + 1;

    const [created] = await db.insert(waitlists).values({
      ...waitlistData,
      position: nextPosition,
    }).returning();
    return created;
  }

  async getWaitlistByClass(classId: string): Promise<Waitlist[]> {
    return await db
      .select({
        id: waitlists.id,
        classId: waitlists.classId,
        childId: waitlists.childId,
        parentId: waitlists.parentId,
        position: waitlists.position,
        status: waitlists.status,
        joinedAt: waitlists.joinedAt,
        notifiedAt: waitlists.notifiedAt,
        expiresAt: waitlists.expiresAt,
        notes: waitlists.notes,
        createdAt: waitlists.createdAt,
        childName: sql<string>`${children.firstName} || ' ' || ${children.lastName}`,
        parentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        parentEmail: users.email,
        parentMobile: users.mobile,
      })
      .from(waitlists)
      .innerJoin(children, eq(waitlists.childId, children.id))
      .innerJoin(users, eq(waitlists.parentId, users.id))
      .where(eq(waitlists.classId, classId))
      .orderBy(asc(waitlists.position));
  }

  async getWaitlistByParent(parentId: string): Promise<Waitlist[]> {
    return await db
      .select({
        id: waitlists.id,
        classId: waitlists.classId,
        childId: waitlists.childId,
        parentId: waitlists.parentId,
        position: waitlists.position,
        status: waitlists.status,
        joinedAt: waitlists.joinedAt,
        notifiedAt: waitlists.notifiedAt,
        expiresAt: waitlists.expiresAt,
        notes: waitlists.notes,
        createdAt: waitlists.createdAt,
        childName: sql<string>`${children.firstName} || ' ' || ${children.lastName}`,
        className: classes.name,
        classDay: classes.dayOfWeek,
        classTime: classes.startTime,
      })
      .from(waitlists)
      .innerJoin(children, eq(waitlists.childId, children.id))
      .innerJoin(classes, eq(waitlists.classId, classes.id))
      .where(eq(waitlists.parentId, parentId))
      .orderBy(desc(waitlists.joinedAt));
  }

  async getWaitlistPositionByChild(classId: string, childId: string): Promise<number | null> {
    const [result] = await db
      .select({ position: waitlists.position })
      .from(waitlists)
      .where(and(eq(waitlists.classId, classId), eq(waitlists.childId, childId), eq(waitlists.status, 'active')));
    
    return result?.position || null;
  }

  async updateWaitlistStatus(id: string, status: string, notificationExpiry?: Date): Promise<Waitlist> {
    const updateData: any = { 
      status,
      notifiedAt: status === 'notified' ? new Date() : undefined,
      expiresAt: notificationExpiry,
    };

    const [updated] = await db
      .update(waitlists)
      .set(updateData)
      .where(eq(waitlists.id, id))
      .returning();
    return updated;
  }

  async removeFromWaitlist(id: string): Promise<void> {
    const [waitlistEntry] = await db.select().from(waitlists).where(eq(waitlists.id, id));
    if (!waitlistEntry) return;

    // Remove the entry
    await db.delete(waitlists).where(eq(waitlists.id, id));

    // Update positions for remaining entries in the same class
    await db
      .update(waitlists)
      .set({ position: sql`${waitlists.position} - 1` })
      .where(and(
        eq(waitlists.classId, waitlistEntry.classId),
        sql`${waitlists.position} > ${waitlistEntry.position}`
      ));
  }

  async moveUpWaitlist(classId: string): Promise<void> {
    // Move everyone up one position
    await db
      .update(waitlists)
      .set({ position: sql`${waitlists.position} - 1` })
      .where(and(
        eq(waitlists.classId, classId),
        eq(waitlists.status, 'active'),
        sql`${waitlists.position} > 1`
      ));
  }

  async getNextWaitlistEntry(classId: string): Promise<Waitlist | undefined> {
    const [entry] = await db
      .select()
      .from(waitlists)
      .where(and(eq(waitlists.classId, classId), eq(waitlists.status, 'active')))
      .orderBy(asc(waitlists.position))
      .limit(1);
    
    return entry;
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

  // Term Holiday operations
  async getTermHolidays(termConfigId: string): Promise<any[]> {
    return await db
      .select()
      .from(termHolidays)
      .where(eq(termHolidays.termConfigurationId, termConfigId))
      .orderBy(termHolidays.holidayDate);
  }

  async createTermHoliday(holidayData: any): Promise<any> {
    const [created] = await db
      .insert(termHolidays)
      .values(holidayData)
      .returning();
    return created;
  }

  async deleteTermHoliday(id: string): Promise<void> {
    await db.delete(termHolidays).where(eq(termHolidays.id, id));
  }

  async getTermConfigurationWithHolidays(id: string): Promise<any> {
    const termConfig = await this.getTermConfigurationById(id);
    if (!termConfig) return null;

    const holidays = await this.getTermHolidays(id);
    return {
      ...termConfig,
      holidays
    };
  }

  async calculateTermPrice(termConfigId: string, classesPerWeek: number = 1): Promise<any> {
    const [termConfig] = await db
      .select()
      .from(termConfigurations)
      .where(eq(termConfigurations.id, termConfigId));

    if (!termConfig) {
      throw new Error('Term configuration not found');
    }

    // Get holidays for this term to calculate effective weeks
    const holidays = await this.getTermHolidays(termConfigId);
    const holidaysCount = holidays.length;
    const effectiveWeeks = Math.max(1, termConfig.weeksCount - holidaysCount); // Ensure at least 1 week

    const basePrice = Number(termConfig.pricePerWeek) * effectiveWeeks * classesPerWeek;
    const gstAmount = basePrice * Number(termConfig.gstRate);
    const totalPrice = basePrice + gstAmount;

    return {
      basePrice: Number(basePrice.toFixed(2)),
      gstAmount: Number(gstAmount.toFixed(2)),
      totalPrice: Number(totalPrice.toFixed(2)),
      weeksCount: termConfig.weeksCount,
      holidaysCount,
      effectiveWeeks,
      pricePerWeek: Number(termConfig.pricePerWeek),
      classesPerWeek
    };
  }

  // Performance Video Highlights operations
  async createPerformanceVideoHighlight(videoData: InsertPerformanceVideoHighlight): Promise<PerformanceVideoHighlight> {
    const [created] = await db.insert(performanceVideoHighlights).values({
      ...videoData,
      shareableLink: `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }).returning();
    return created;
  }

  async getPerformanceVideoHighlight(id: string): Promise<PerformanceVideoHighlight | undefined> {
    const [video] = await db.select().from(performanceVideoHighlights).where(eq(performanceVideoHighlights.id, id));
    return video;
  }

  async getAllPerformanceVideoHighlights(): Promise<PerformanceVideoHighlight[]> {
    return await db
      .select({
        id: performanceVideoHighlights.id,
        title: performanceVideoHighlights.title,
        description: performanceVideoHighlights.description,
        type: performanceVideoHighlights.type,
        status: performanceVideoHighlights.status,
        videoUrl: performanceVideoHighlights.videoUrl,
        thumbnailUrl: performanceVideoHighlights.thumbnailUrl,
        duration: performanceVideoHighlights.duration,
        fileSize: performanceVideoHighlights.fileSize,
        childId: performanceVideoHighlights.childId,
        classId: performanceVideoHighlights.classId,
        coachId: performanceVideoHighlights.coachId,
        skillsHighlighted: performanceVideoHighlights.skillsHighlighted,
        performanceNotes: performanceVideoHighlights.performanceNotes,
        coachComments: performanceVideoHighlights.coachComments,
        isPublic: performanceVideoHighlights.isPublic,
        shareableLink: performanceVideoHighlights.shareableLink,
        viewCount: performanceVideoHighlights.viewCount,
        tags: performanceVideoHighlights.tags,
        createdAt: performanceVideoHighlights.createdAt,
        updatedAt: performanceVideoHighlights.updatedAt,
        childName: children.firstName ? sql<string>`${children.firstName} || ' ' || ${children.lastName}` : null,
        coachName: sql<string>`${coaches.firstName} || ' ' || ${coaches.lastName}`,
        className: classes.name,
      })
      .from(performanceVideoHighlights)
      .leftJoin(children, eq(performanceVideoHighlights.childId, children.id))
      .leftJoin(coaches, eq(performanceVideoHighlights.coachId, coaches.id))
      .leftJoin(classes, eq(performanceVideoHighlights.classId, classes.id))
      .orderBy(desc(performanceVideoHighlights.createdAt));
  }

  async getPerformanceVideoHighlightsByChild(childId: string): Promise<PerformanceVideoHighlight[]> {
    return await db
      .select()
      .from(performanceVideoHighlights)
      .where(eq(performanceVideoHighlights.childId, childId))
      .orderBy(desc(performanceVideoHighlights.createdAt));
  }

  async getPerformanceVideoHighlightsByCoach(coachId: string): Promise<PerformanceVideoHighlight[]> {
    return await db
      .select()
      .from(performanceVideoHighlights)
      .where(eq(performanceVideoHighlights.coachId, coachId))
      .orderBy(desc(performanceVideoHighlights.createdAt));
  }

  async getPerformanceVideoHighlightsByClass(classId: string): Promise<PerformanceVideoHighlight[]> {
    return await db
      .select()
      .from(performanceVideoHighlights)
      .where(eq(performanceVideoHighlights.classId, classId))
      .orderBy(desc(performanceVideoHighlights.createdAt));
  }

  async updatePerformanceVideoHighlight(id: string, updates: Partial<PerformanceVideoHighlight>): Promise<PerformanceVideoHighlight> {
    const [updated] = await db
      .update(performanceVideoHighlights)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(performanceVideoHighlights.id, id))
      .returning();
    return updated;
  }

  async deletePerformanceVideoHighlight(id: string): Promise<void> {
    await db.delete(performanceVideoHighlights).where(eq(performanceVideoHighlights.id, id));
  }

  // Video Share operations
  async createVideoShare(shareData: InsertVideoShare): Promise<VideoShare> {
    const [created] = await db.insert(videoShares).values(shareData).returning();
    return created;
  }

  async getVideoSharesByVideo(videoId: string): Promise<VideoShare[]> {
    return await db
      .select({
        id: videoShares.id,
        videoId: videoShares.videoId,
        parentId: videoShares.parentId,
        email: videoShares.email,
        sharedAt: videoShares.sharedAt,
        viewedAt: videoShares.viewedAt,
        message: videoShares.message,
        parentName: users.firstName ? sql<string>`${users.firstName} || ' ' || ${users.lastName}` : null,
        parentEmail: users.email,
      })
      .from(videoShares)
      .leftJoin(users, eq(videoShares.parentId, users.id))
      .where(eq(videoShares.videoId, videoId))
      .orderBy(desc(videoShares.sharedAt));
  }

  async getVideoSharesByParent(parentId: string): Promise<VideoShare[]> {
    return await db
      .select()
      .from(videoShares)
      .where(eq(videoShares.parentId, parentId))
      .orderBy(desc(videoShares.sharedAt));
  }

  async updateVideoShare(id: string, updates: Partial<VideoShare>): Promise<VideoShare> {
    const [updated] = await db
      .update(videoShares)
      .set(updates)
      .where(eq(videoShares.id, id))
      .returning();
    return updated;
  }

  async deleteVideoShare(id: string): Promise<void> {
    await db.delete(videoShares).where(eq(videoShares.id, id));
  }

  // Performance Record operations
  async getPerformanceRecordsByChild(childId: string): Promise<PerformanceRecord[]> {
    return await db.select().from(performanceRecords).where(eq(performanceRecords.childId, childId)).orderBy(desc(performanceRecords.recordDate));
  }

  async createPerformanceRecord(record: InsertPerformanceRecord): Promise<PerformanceRecord> {
    const [created] = await db.insert(performanceRecords).values(record).returning();
    return created;
  }

  async updatePerformanceRecord(id: string, updates: Partial<PerformanceRecord>): Promise<PerformanceRecord> {
    const [updated] = await db.update(performanceRecords).set({ ...updates, updatedAt: new Date() }).where(eq(performanceRecords.id, id)).returning();
    return updated;
  }

  async deletePerformanceRecord(id: string): Promise<void> {
    await db.delete(performanceRecords).where(eq(performanceRecords.id, id));
  }

  // Training Goal operations
  async getTrainingGoalsByChild(childId: string): Promise<TrainingGoal[]> {
    return await db.select().from(trainingGoals).where(eq(trainingGoals.childId, childId)).orderBy(desc(trainingGoals.createdAt));
  }

  async createTrainingGoal(goal: InsertTrainingGoal): Promise<TrainingGoal> {
    const [created] = await db.insert(trainingGoals).values(goal).returning();
    return created;
  }

  async updateTrainingGoal(id: string, updates: Partial<TrainingGoal>): Promise<TrainingGoal> {
    const [updated] = await db.update(trainingGoals).set({ ...updates, updatedAt: new Date() }).where(eq(trainingGoals.id, id)).returning();
    return updated;
  }

  async deleteTrainingGoal(id: string): Promise<void> {
    await db.delete(trainingGoals).where(eq(trainingGoals.id, id));
  }

  // Athlete Assessment operations
  async getAthleteAssessments(childId: string): Promise<any[]> {
    const result = await db.execute(
      sql`SELECT aa.*, u.first_name as creator_first_name, u.last_name as creator_last_name
          FROM athlete_assessments aa
          LEFT JOIN users u ON aa.created_by_id = u.id
          WHERE aa.child_id = ${childId}
          ORDER BY aa.created_at DESC`
    );
    return result.rows as any[];
  }

  async createAthleteAssessment(data: any): Promise<any> {
    const result = await db.execute(
      sql`INSERT INTO athlete_assessments (child_id, title, type, content, file_url, file_name, file_type, file_size, created_by_id)
          VALUES (${data.childId}, ${data.title}, ${data.type}, ${data.content ?? null}, ${data.fileUrl ?? null}, ${data.fileName ?? null}, ${data.fileType ?? null}, ${data.fileSize ?? null}, ${data.createdById ?? null})
          RETURNING *`
    );
    return result.rows[0];
  }

  async deleteAthleteAssessment(id: string): Promise<void> {
    await db.execute(sql`DELETE FROM athlete_assessments WHERE id = ${id}`);
  }

  // Survey operations
  async createSurveyResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [created] = await db.insert(surveyResponses).values(response).returning();
    return created;
  }

  async getAllSurveyResponses(): Promise<SurveyResponse[]> {
    return await db.select().from(surveyResponses).orderBy(desc(surveyResponses.createdAt));
  }

  // ── MAJ (My Athletic Journey) ────────────────────────────────────

  async getMajAthleteByUsername(username: string): Promise<MajAthlete | undefined> {
    const [athlete] = await db.select().from(majAthletes).where(eq(majAthletes.username, username));
    return athlete;
  }

  async getMajAthleteById(id: string): Promise<MajAthlete | undefined> {
    const [athlete] = await db.select().from(majAthletes).where(eq(majAthletes.id, id));
    return athlete;
  }

  async getAllMajAthletes(): Promise<MajAthlete[]> {
    return await db.select().from(majAthletes).orderBy(majAthletes.fullName);
  }

  async updateMajAthleteProgress(id: string, data: {
    xp?: number;
    currentModule?: number;
    currentWeek?: number;
    streak?: number;
    sessionsCompleted?: number;
    reflectionsSubmitted?: number;
    earnedBadgeKeys?: string[];
    completedWeeks?: any[];
  }): Promise<MajAthlete> {
    const [updated] = await db.update(majAthletes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(majAthletes.id, id))
      .returning();
    return updated;
  }

  async createMajAthlete(data: {
    username: string;
    password: string;
    fullName: string;
    grade?: string;
    program?: string;
    coach?: string;
  }): Promise<MajAthlete> {
    const [athlete] = await db.insert(majAthletes).values(data).returning();
    return athlete;
  }

  async createMajReflection(data: {
    athleteId: string;
    moduleNum: number;
    weekNum: number;
    prompt: string;
    response: string;
  }): Promise<MajReflection> {
    const [reflection] = await db.insert(majReflections).values(data).returning();
    return reflection;
  }

  async getMajReflectionsForAthlete(athleteId: string): Promise<MajReflection[]> {
    return await db.select().from(majReflections)
      .where(eq(majReflections.athleteId, athleteId))
      .orderBy(desc(majReflections.submittedAt));
  }

  async updateMajReflectionCoachNote(id: string, coachNote: string): Promise<MajReflection> {
    const [updated] = await db.update(majReflections)
      .set({ coachNote })
      .where(eq(majReflections.id, id))
      .returning();
    return updated;
  }

  async awardMajBadge(data: {
    athleteId: string;
    badgeKey: string;
    badgeName: string;
    badgeIcon: string;
    xpAwarded: number;
    awardedBy?: string;
  }): Promise<MajBadge> {
    const [badge] = await db.insert(majBadges).values(data).returning();
    // Also add badge key to athlete's earned_badge_keys array
    await db.execute(
      sql`UPDATE maj_athletes SET earned_badge_keys = array_append(earned_badge_keys, ${data.badgeKey}), updated_at = NOW() WHERE id = ${data.athleteId} AND NOT (${data.badgeKey} = ANY(earned_badge_keys))`
    );
    return badge;
  }

  async getMajCoachByUsername(username: string): Promise<MajCoach | undefined> {
    const [coach] = await db.select().from(majCoaches).where(eq(majCoaches.username, username));
    return coach;
  }

  async createRunAssessment(data: Record<string, any>): Promise<any> {
    const [row] = await db.execute(
      sql`INSERT INTO maj_run_assessments (
        athlete_id, coach_name, assessment_date,
        a1_c1, a1_c2, a1_c3, a1_c4, a1_c5, a1_c6,
        a2_c1, a2_c2, a2_c3, a2_c4, a2_c5, a2_c6,
        a3_c1, a3_c2, a3_c3, a3_c4, a3_c5, a3_c6,
        notes_focus, notes_arm, notes_knee, notes_foot, notes_heel, notes_trunk,
        reassessment_required
      ) VALUES (
        ${data.athleteId}, ${data.coachName}, ${data.assessmentDate || new Date().toISOString().slice(0,10)},
        ${data.a1c1||null}, ${data.a1c2||null}, ${data.a1c3||null}, ${data.a1c4||null}, ${data.a1c5||null}, ${data.a1c6||null},
        ${data.a2c1||null}, ${data.a2c2||null}, ${data.a2c3||null}, ${data.a2c4||null}, ${data.a2c5||null}, ${data.a2c6||null},
        ${data.a3c1||null}, ${data.a3c2||null}, ${data.a3c3||null}, ${data.a3c4||null}, ${data.a3c5||null}, ${data.a3c6||null},
        ${data.notesFocus||''}, ${data.notesArm||''}, ${data.notesKnee||''}, ${data.notesFoot||''}, ${data.notesHeel||''}, ${data.notesTrunk||''},
        ${data.reassessmentRequired||false}
      ) RETURNING *`
    ) as any;
    return row;
  }

  async getRunAssessmentsForAthlete(athleteId: string): Promise<any[]> {
    const rows = await db.execute(
      sql`SELECT * FROM maj_run_assessments WHERE athlete_id = ${athleteId} ORDER BY created_at DESC`
    ) as any;
    return Array.isArray(rows) ? rows : [];
  }

  async createSkillAssessment(data: Record<string, any>): Promise<any> {
    const [row] = await db.execute(
      sql`INSERT INTO maj_skill_assessments
        (athlete_id, coach_name, assessment_type, assessment_date, criteria_results,
         strengths, areas_for_improvement, next_steps, overall_rating, reassessment_required)
        VALUES (
          ${data.athleteId}, ${data.coachName}, ${data.assessmentType},
          ${data.assessmentDate || new Date().toISOString().slice(0,10)},
          ${JSON.stringify(data.criteriaResults || {})}::jsonb,
          ${data.strengths||''}, ${data.areasForImprovement||''},
          ${data.nextSteps||''}, ${data.overallRating||null},
          ${data.reassessmentRequired||false}
        ) RETURNING *`
    ) as any;
    return row;
  }

  async getSkillAssessmentsForAthlete(athleteId: string): Promise<any[]> {
    const rows = await db.execute(
      sql`SELECT * FROM maj_skill_assessments WHERE athlete_id = ${athleteId} ORDER BY created_at DESC`
    ) as any;
    return Array.isArray(rows) ? rows : [];
  }
}

export const storage = new DatabaseStorage();
