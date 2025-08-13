import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  decimal,
  boolean,
  uuid,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const sportTypeEnum = pgEnum("sport_type", [
  "foundation_prep_year2",
  "emerging_year3_6", 
  "junior_development",
  "team_sport_athletes",
  "team_sport_speed",
  "senior_squad",
  "competition_ready",
  "empowered_athlete_program",
  "basketball",
  "soccer",
  "tennis",
  "swimming",
  "athletics",
  "netball",
  "cricket",
  "volleyball",
  "multi_sport",
]);

export const termEnum = pgEnum("term", ["term_1", "term_2", "term_3", "term_4"]);

// Term Configuration table for managing school terms
export const termConfigurations = pgTable("term_configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  term: termEnum("term").notNull(),
  year: integer("year").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // "Term 4 2025"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  weeksCount: integer("weeks_count").notNull(),
  enrollmentOpenDate: timestamp("enrollment_open_date"),
  enrollmentCloseDate: timestamp("enrollment_close_date"),
  pricePerWeek: decimal("price_per_week", { precision: 8, scale: 2 }).notNull(),
  gstRate: decimal("gst_rate", { precision: 3, scale: 2 }).default("0.10"), // 10% GST
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Holiday Types Enum
export const holidayTypeEnum = pgEnum("holiday_type", ["public_holiday", "student_free_day", "curriculum_day", "staff_planning_day"]);

// Term Holidays (excluded dates)
export const termHolidays = pgTable("term_holidays", {
  id: uuid("id").primaryKey().defaultRandom(),
  termConfigurationId: uuid("term_configuration_id").references(() => termConfigurations.id, { onDelete: "cascade" }).notNull(),
  holidayDate: timestamp("holiday_date").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: holidayTypeEnum("type").notNull().default("public_holiday"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueTermDate: unique().on(table.termConfigurationId, table.holidayDate),
}));

// Waitlist table
export const waitlistStatusEnum = pgEnum("waitlist_status", ["active", "notified", "enrolled", "cancelled", "expired"]);

export const waitlists = pgTable("waitlists", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }).notNull(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  parentId: uuid("parent_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  position: integer("position").notNull(),
  status: waitlistStatusEnum("status").default("active").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  notifiedAt: timestamp("notified_at"),
  expiresAt: timestamp("expires_at"), // When notification expires
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueClassChild: unique().on(table.classId, table.childId),
}));

export const classStatusEnum = pgEnum("class_status", ["active", "full", "cancelled", "completed"]);

export const enrollmentStatusEnum = pgEnum("enrollment_status", [
  "active",
  "pending_payment",
  "cancelled",
  "completed",
  "waitlist",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const userRoleEnum = pgEnum("user_role", ["parent", "admin", "coach"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique(),
  mobile: varchar("mobile", { length: 20 }).unique(),
  userId: varchar("user_id", { length: 50 }).unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: userRoleEnum("role").default("parent").notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  autoReenrollment: boolean("auto_reenrollment").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Children table (for parents to manage multiple children)
export const children = pgTable("children", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").references(() => users.id).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  grade: varchar("grade", { length: 20 }),
  medicalInfo: text("medical_info"),
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Venues table
export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  address: text("address").notNull(),
  suburb: varchar("suburb", { length: 100 }).notNull(),
  postcode: varchar("postcode", { length: 10 }).notNull(),
  facilities: text("facilities").array(),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coaches table
export const coaches = pgTable("coaches", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  specializations: sportTypeEnum("specializations").array(),
  qualifications: text("qualifications").array(),
  experience: text("experience"),
  bio: text("bio"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Classes table
export const classes = pgTable("classes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  sportType: sportTypeEnum("sport_type").notNull(),
  venueId: uuid("venue_id").references(() => venues.id).notNull(),
  coachId: uuid("coach_id").references(() => coaches.id).notNull(),
  termConfigId: uuid("term_config_id").references(() => termConfigurations.id),
  term: termEnum("term").notNull(),
  year: integer("year").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 1-7 (Monday-Sunday)
  startTime: varchar("start_time", { length: 10 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 10 }).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  minAge: integer("min_age").notNull(),
  maxAge: integer("max_age").notNull(),
  maxCapacity: integer("max_capacity").notNull(),
  currentEnrollment: integer("current_enrollment").default(0),
  pricePerTerm: decimal("price_per_term", { precision: 8, scale: 2 }).notNull(),
  status: classStatusEnum("status").default("active"),
  imageUrl: varchar("image_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enrollments table
export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").references(() => children.id).notNull(),
  classId: uuid("class_id").references(() => classes.id).notNull(),
  parentId: uuid("parent_id").references(() => users.id).notNull(),
  status: enrollmentStatusEnum("status").default("pending_payment"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  autoRenew: boolean("auto_renew").default(true),
  waitlistPosition: integer("waitlist_position"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("AUD"),
  status: paymentStatusEnum("status").default("pending"),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date").notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).unique(),
  invoiceGenerated: boolean("invoice_generated").default(false),
  invoicePdfPath: varchar("invoice_pdf_path", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'enrollment_reminder', 'payment_due', 'class_update'
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  read: boolean("read").default(false),
  sentAt: timestamp("sent_at"),
  scheduledFor: timestamp("scheduled_for"),
  emailSent: boolean("email_sent").default(false),
  smsSent: boolean("sms_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const seniorSquadApplications = pgTable("senior_squad_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Athlete Information
  athleteFirstName: varchar("athlete_first_name", { length: 100 }).notNull(),
  athleteLastName: varchar("athlete_last_name", { length: 100 }).notNull(),
  athleteEmail: varchar("athlete_email", { length: 255 }).notNull(),
  athletePhone: varchar("athlete_phone", { length: 20 }).notNull(),
  dateOfBirth: varchar("date_of_birth", { length: 10 }).notNull(),
  schoolYear: varchar("school_year", { length: 50 }).notNull(),
  
  // Contact Information
  parentGuardianName: varchar("parent_guardian_name", { length: 100 }),
  parentGuardianEmail: varchar("parent_guardian_email", { length: 255 }),
  parentGuardianPhone: varchar("parent_guardian_phone", { length: 20 }),
  
  // Athletic Background
  currentSports: text("current_sports").notNull(),
  athleticExperience: text("athletic_experience").notNull(),
  previousClubs: text("previous_clubs"),
  personalBests: text("personal_bests"),
  
  // Goals and Commitment
  athleticGoals: text("athletic_goals").notNull(),
  trainingCommitment: text("training_commitment").notNull(),
  reasonForJoining: text("reason_for_joining").notNull(),
  
  // Availability
  availableDays: text("available_days").notNull(),
  additionalNotes: text("additional_notes"),
  
  // Application Status
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const highPerformanceSquadApplications = pgTable("high_performance_squad_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Athlete Information
  athleteFirstName: varchar("athlete_first_name", { length: 100 }).notNull(),
  athleteLastName: varchar("athlete_last_name", { length: 100 }).notNull(),
  athleteEmail: varchar("athlete_email", { length: 255 }).notNull(),
  athletePhone: varchar("athlete_phone", { length: 20 }).notNull(),
  dateOfBirth: varchar("date_of_birth", { length: 10 }).notNull(),
  schoolYear: varchar("school_year", { length: 50 }).notNull(),
  
  // Contact Information
  parentGuardianName: varchar("parent_guardian_name", { length: 100 }),
  parentGuardianEmail: varchar("parent_guardian_email", { length: 255 }),
  parentGuardianPhone: varchar("parent_guardian_phone", { length: 20 }),
  
  // Athletic Background & Performance Level
  currentSports: text("current_sports").notNull(),
  competitionLevel: text("competition_level").notNull(),
  athleticExperience: text("athletic_experience").notNull(),
  previousClubs: text("previous_clubs"),
  personalBests: text("personal_bests").notNull(),
  coachingHistory: text("coaching_history"),
  
  // High Performance Goals
  athleticGoals: text("athletic_goals").notNull(),
  targetCompetitions: text("target_competitions").notNull(),
  performanceAmbitions: text("performance_ambitions").notNull(),
  
  // Training & Commitment
  currentTrainingLoad: text("current_training_load").notNull(),
  trainingCommitment: text("training_commitment").notNull(),
  timeAvailability: text("time_availability").notNull(),
  
  // Specific Coaching Needs
  coachingType: text("coaching_type").notNull(),
  specificNeeds: text("specific_needs").notNull(),
  reasonForHighPerformance: text("reason_for_high_performance").notNull(),
  
  // Additional Information
  injuries: text("injuries"),
  additionalNotes: text("additional_notes"),
  
  // Application Status
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Blog Articles
export const blogArticles = pgTable("blog_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: varchar("featured_image"),
  authorId: uuid("author_id").references(() => users.id),
  published: boolean("published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Performance Video Highlights
export const videoHighlightTypeEnum = pgEnum("video_highlight_type", [
  "individual_performance",
  "class_highlights", 
  "skill_demonstration",
  "progress_comparison",
  "team_performance"
]);

export const videoStatusEnum = pgEnum("video_status", [
  "processing",
  "ready", 
  "failed",
  "archived"
]);

export const performanceVideoHighlights = pgTable("performance_video_highlights", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: videoHighlightTypeEnum("type").notNull(),
  status: videoStatusEnum("status").default("processing"),
  
  // Video metadata
  videoUrl: varchar("video_url"), // Cloud storage URL
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  
  // Associated data
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
  coachId: uuid("coach_id").references(() => coaches.id).notNull(),
  
  // Performance metrics (optional)
  skillsHighlighted: text("skills_highlighted").array(), // Array of skills demonstrated
  performanceNotes: text("performance_notes"),
  coachComments: text("coach_comments"),
  
  // Sharing and privacy
  isPublic: boolean("is_public").default(false),
  shareableLink: varchar("shareable_link").unique(),
  viewCount: integer("view_count").default(0),
  
  // Tags for organization
  tags: text("tags").array(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Video Shares - track who videos are shared with
export const videoShares = pgTable("video_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  videoId: uuid("video_id").references(() => performanceVideoHighlights.id, { onDelete: "cascade" }).notNull(),
  parentId: uuid("parent_id").references(() => users.id, { onDelete: "cascade" }),
  email: varchar("email"), // For sharing with non-users
  sharedAt: timestamp("shared_at").defaultNow(),
  viewedAt: timestamp("viewed_at"),
  message: text("message"), // Optional message from coach
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
  enrollments: many(enrollments),
  notifications: many(notifications),
  waitlists: many(waitlists),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(users, {
    fields: [children.parentId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
  waitlists: many(waitlists),
}));

export const venuesRelations = relations(venues, ({ many }) => ({
  classes: many(classes),
}));

export const coachesRelations = relations(coaches, ({ one, many }) => ({
  user: one(users, {
    fields: [coaches.userId],
    references: [users.id],
  }),
  classes: many(classes),
}));

export const termConfigurationsRelations = relations(termConfigurations, ({ many }) => ({
  holidays: many(termHolidays),
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  venue: one(venues, {
    fields: [classes.venueId],
    references: [venues.id],
  }),
  coach: one(coaches, {
    fields: [classes.coachId],
    references: [coaches.id],
  }),
  termConfiguration: one(termConfigurations, {
    fields: [classes.termConfigId],
    references: [termConfigurations.id],
  }),
  enrollments: many(enrollments),
  waitlists: many(waitlists),
}));

export const enrollmentsRelations = relations(enrollments, ({ one, many }) => ({
  child: one(children, {
    fields: [enrollments.childId],
    references: [children.id],
  }),
  class: one(classes, {
    fields: [enrollments.classId],
    references: [classes.id],
  }),
  parent: one(users, {
    fields: [enrollments.parentId],
    references: [users.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [payments.enrollmentId],
    references: [enrollments.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const blogArticlesRelations = relations(blogArticles, ({ one }) => ({
  author: one(users, {
    fields: [blogArticles.authorId],
    references: [users.id],
  }),
}));

export const waitlistsRelations = relations(waitlists, ({ one }) => ({
  class: one(classes, {
    fields: [waitlists.classId],
    references: [classes.id],
  }),
  child: one(children, {
    fields: [waitlists.childId],
    references: [children.id],
  }),
  parent: one(users, {
    fields: [waitlists.parentId],
    references: [users.id],
  }),
}));

export const performanceVideoHighlightsRelations = relations(performanceVideoHighlights, ({ one, many }) => ({
  child: one(children, {
    fields: [performanceVideoHighlights.childId],
    references: [children.id],
  }),
  class: one(classes, {
    fields: [performanceVideoHighlights.classId],
    references: [classes.id],
  }),
  coach: one(coaches, {
    fields: [performanceVideoHighlights.coachId],
    references: [coaches.id],
  }),
  shares: many(videoShares),
}));

export const videoSharesRelations = relations(videoShares, ({ one }) => ({
  video: one(performanceVideoHighlights, {
    fields: [videoShares.videoId],
    references: [performanceVideoHighlights.id],
  }),
  parent: one(users, {
    fields: [videoShares.parentId],
    references: [users.id],
  }),
}));



// Predefined venues 
export const venueOptions = [
  'Toorak College',
  'Peninsula Grammar', 
  'Ballam Park Athletic Track',
  'Mornington Athletic Track'
] as const;

// Class program options
export const classProgramOptions = [
  'Foundation - Prep - Year 2',
  'Emerging - Year 3 - 6', 
  'Academy - Year 7 & Above',
  'Team Sport Speed',
  'Senior Squad',
  'The Empowered Athlete Program'
] as const;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
  createdAt: true,
});

export const insertCoachSchema = createInsertSchema(coaches).omit({
  id: true,
  createdAt: true,
});

export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentEnrollment: true,
});

export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  enrolledAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertSeniorSquadApplicationSchema = createInsertSchema(seniorSquadApplications).omit({
  id: true,
  createdAt: true,
  status: true,
  reviewedBy: true,
  reviewNotes: true,
  reviewedAt: true,
});

export const insertHighPerformanceSquadApplicationSchema = createInsertSchema(highPerformanceSquadApplications).omit({
  id: true,
  createdAt: true,
  status: true,
  reviewedBy: true,
  reviewNotes: true,
  reviewedAt: true,
});

export const insertWaitlistSchema = createInsertSchema(waitlists).omit({
  id: true,
  position: true,
  joinedAt: true,
  createdAt: true,
});

export const insertBlogArticleSchema = createInsertSchema(blogArticles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const insertPerformanceVideoHighlightSchema = createInsertSchema(performanceVideoHighlights).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  shareableLink: true,
  viewCount: true,
});

export const insertVideoShareSchema = createInsertSchema(videoShares).omit({
  id: true,
  sharedAt: true,
  viewedAt: true,
});

// Types
export type PerformanceVideoHighlight = typeof performanceVideoHighlights.$inferSelect;
export type InsertPerformanceVideoHighlight = z.infer<typeof insertPerformanceVideoHighlightSchema>;
export type VideoShare = typeof videoShares.$inferSelect;
export type InsertVideoShare = z.infer<typeof insertVideoShareSchema>;



// Absence reasons enum for type safety
export const absenceReasonEnum = pgEnum("absence_reason", [
  "illness",
  "injured", 
  "prior_notice",
  "travel",
  "exception",
  "cancelled",
  "no_show",
  "late_notice"
]);

// Attendance tracking table
export const attendanceRecords = pgTable("attendance_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  classId: uuid("class_id").references(() => classes.id).notNull(),
  childId: uuid("child_id").references(() => children.id).notNull(),
  attendanceDate: timestamp("attendance_date").notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'present', 'absent'
  absenceReason: absenceReasonEnum("absence_reason"), // null for present, reason for absent
  creditsEligible: boolean("credits_eligible").default(false), // true if absence qualifies for credit
  markedBy: uuid("marked_by").references(() => users.id).notNull(), // coach who marked attendance
  markedAt: timestamp("marked_at").defaultNow(),
  notes: text("notes"), // optional notes from coach
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  class: one(classes, {
    fields: [attendanceRecords.classId],
    references: [classes.id],
  }),
  child: one(children, {
    fields: [attendanceRecords.childId],
    references: [children.id],
  }),
  markedByUser: one(users, {
    fields: [attendanceRecords.markedBy],
    references: [users.id],
  }),
}));

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  markedAt: true,
});

export const insertTermConfigurationSchema = createInsertSchema(termConfigurations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTermHolidaySchema = createInsertSchema(termHolidays).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Child = typeof children.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Coach = typeof coaches.$inferSelect;
export type InsertCoach = z.infer<typeof insertCoachSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type SeniorSquadApplication = typeof seniorSquadApplications.$inferSelect;
export type InsertSeniorSquadApplication = z.infer<typeof insertSeniorSquadApplicationSchema>;
export type HighPerformanceSquadApplication = typeof highPerformanceSquadApplications.$inferSelect;
export type InsertHighPerformanceSquadApplication = z.infer<typeof insertHighPerformanceSquadApplicationSchema>;
export type Waitlist = typeof waitlists.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type BlogArticle = typeof blogArticles.$inferSelect;
export type InsertBlogArticle = z.infer<typeof insertBlogArticleSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type TermConfiguration = typeof termConfigurations.$inferSelect;
export type InsertTermConfiguration = z.infer<typeof insertTermConfigurationSchema>;

export type TermHoliday = typeof termHolidays.$inferSelect;
export type InsertTermHoliday = z.infer<typeof insertTermHolidaySchema>;
