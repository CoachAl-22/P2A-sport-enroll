import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  date,
  integer,
  decimal,
  boolean,
  uuid,
  pgEnum,
  unique,
  jsonb,
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
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  weeksCount: integer("weeks_count").notNull(),
  enrollmentOpenDate: date("enrollment_open_date", { mode: "string" }),
  enrollmentCloseDate: date("enrollment_close_date", { mode: "string" }),
  pricePerWeek: decimal("price_per_week", { precision: 8, scale: 2 }).notNull(),
  gstRate: decimal("gst_rate", { precision: 3, scale: 2 }).default("0.10"), // 10% GST
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Holiday type values (DB column is varchar — no pg enum needed)
export const HOLIDAY_TYPES = ["public_holiday", "student_free_day", "curriculum_day", "staff_planning_day", "term_break"] as const;
export type HolidayType = typeof HOLIDAY_TYPES[number];

// Term Holidays (excluded dates)
export const termHolidays = pgTable("term_holidays", {
  id: uuid("id").primaryKey().defaultRandom(),
  termConfigurationId: uuid("term_configuration_id").references(() => termConfigurations.id, { onDelete: "cascade" }).notNull(),
  holidayDate: date("holiday_date", { mode: "string" }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: text("type").notNull().default("public_holiday"),
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
  active: boolean("active").default(true).notNull(),
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
  active: boolean("active").default(true).notNull(),
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
  pricePerSession: decimal("price_per_session", { precision: 8, scale: 2 }),
  pricePerTerm: decimal("price_per_term", { precision: 8, scale: 2 }).notNull(),
  status: classStatusEnum("status").default("active"),
  imageUrl: varchar("image_url", { length: 500 }),
  isEnrollmentOpen: boolean("is_enrollment_open").default(false).notNull(),
  isHolidayProgram: boolean("is_holiday_program").default(false).notNull(),
  isMakeupEligible: boolean("is_makeup_eligible").default(false).notNull(),
  perWeekEnabled: boolean("per_week_enabled").default(false).notNull(),
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
  waitlistHolidayReservation: boolean("waitlist_holiday_reservation").default(false).notNull(),
  priorityReenrolmentExpiry: timestamp("priority_reenrolment_expiry"),
  makeupCredits: integer("makeup_credits").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Per-week enrolment: one row per term week of an enrolment
export const enrollmentWeekStatusEnum = pgEnum("enrollment_week_status", [
  "selected", // attending and paid
  "skipped", // unticked at enrolment, not paid
  "holiday", // no class this week (term holiday)
  "credited", // dropped after payment, makeup credit issued
  "makeup", // attending using a makeup credit
]);

export const enrollmentWeeks = pgTable("enrollment_weeks", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id, { onDelete: "cascade" }).notNull(),
  weekNumber: integer("week_number").notNull(), // 1..termConfig.weeksCount
  sessionDate: date("session_date", { mode: "string" }).notNull(),
  status: enrollmentWeekStatusEnum("status").default("selected").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueEnrollmentWeek: unique().on(table.enrollmentId, table.weekNumber),
}));

// Payments table
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  paymentType: varchar("payment_type", { length: 20 }).default("term").notNull(), // "term" | "monthly"
  amount: decimal("amount", { precision: 8, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("AUD"),
  status: paymentStatusEnum("status").default("pending"),
  paidAt: timestamp("paid_at"),
  dueDate: timestamp("due_date").notNull(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).unique(),
  invoiceGenerated: boolean("invoice_generated").default(false),
  invoicePdfPath: varchar("invoice_pdf_path", { length: 500 }),
  notes: text("notes"),
  siblingDiscountApplied: boolean("sibling_discount_applied").default(false).notNull(),
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

// Contact Enquiries
export const enquiryStatusEnum = pgEnum("enquiry_status", ["new", "in_progress", "contacted", "resolved", "closed"]);
export const contactMethodEnum = pgEnum("contact_method", ["phone", "email", "video"]);

export const contactEnquiries = pgTable("contact_enquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  contactMethod: contactMethodEnum("contact_method").notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  performanceTestType: varchar("performance_test_type", { length: 100 }),
  assessmentType: varchar("assessment_type", { length: 100 }),
  message: text("message").notNull(),
  status: enquiryStatusEnum("status").default("new").notNull(),
  adminNotes: text("admin_notes"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
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
  coachId: uuid("coach_id").references(() => coaches.id),
  
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

// Performance Records - track athlete personal bests and performance metrics
export const performanceRecords = pgTable("performance_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  recordType: varchar("record_type", { length: 50 }).notNull(), // "100m_sprint", "long_jump", "strength_test", etc.
  value: decimal("value", { precision: 10, scale: 3 }).notNull(), // Time in seconds, distance in meters, etc.
  unit: varchar("unit", { length: 20 }).notNull(), // "seconds", "meters", "kg", etc.
  recordDate: timestamp("record_date").notNull(),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
  coachId: uuid("coach_id").references(() => coaches.id),
  notes: text("notes"),
  isPersonalBest: boolean("is_personal_best").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Training Goals - individual goals set for athletes
export const trainingGoals = pgTable("training_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  coachId: uuid("coach_id").references(() => coaches.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  targetValue: decimal("target_value", { precision: 10, scale: 3 }),
  targetUnit: varchar("target_unit", { length: 20 }),
  targetDate: timestamp("target_date"),
  currentValue: decimal("current_value", { precision: 10, scale: 3 }),
  status: varchar("status", { length: 20 }).default("active"), // "active", "achieved", "paused", "cancelled"
  priority: varchar("priority", { length: 10 }).default("medium"), // "low", "medium", "high"
  category: varchar("category", { length: 50 }), // "speed", "strength", "technique", "endurance"
  achievedAt: timestamp("achieved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Attendance Records - track individual session attendance
export const attendanceRecords = pgTable("attendance_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }).notNull(),
  sessionDate: timestamp("session_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("present"), // "present", "absent", "late", "partial"
  arrivalTime: timestamp("arrival_time"),
  departureTime: timestamp("departure_time"),
  coachNotes: text("coach_notes"),
  skillsFocused: text("skills_focused").array(), // Array of skills worked on
  performanceRating: integer("performance_rating"), // 1-10 scale
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueChildSession: unique().on(table.childId, table.classId, table.sessionDate),
}));

// Coach Messages - communication between coaches and athletes/parents
export const coachMessages = pgTable("coach_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  fromCoachId: uuid("from_coach_id").references(() => coaches.id, { onDelete: "cascade" }).notNull(),
  toUserId: uuid("to_user_id").references(() => users.id, { onDelete: "cascade" }),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 30 }).default("general"), // "general", "performance", "goal_update", "technique_tip"
  priority: varchar("priority", { length: 10 }).default("normal"), // "low", "normal", "high", "urgent"
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  parentReply: text("parent_reply"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  performanceRecords: many(performanceRecords),
  trainingGoals: many(trainingGoals),
  attendanceRecords: many(attendanceRecords),
  performanceVideos: many(performanceVideoHighlights),
  coachMessages: many(coachMessages),
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
  weeks: many(enrollmentWeeks),
}));

export const enrollmentWeeksRelations = relations(enrollmentWeeks, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [enrollmentWeeks.enrollmentId],
    references: [enrollments.id],
  }),
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

export const performanceRecordsRelations = relations(performanceRecords, ({ one }) => ({
  child: one(children, {
    fields: [performanceRecords.childId],
    references: [children.id],
  }),
  class: one(classes, {
    fields: [performanceRecords.classId],
    references: [classes.id],
  }),
  coach: one(coaches, {
    fields: [performanceRecords.coachId],
    references: [coaches.id],
  }),
}));

export const trainingGoalsRelations = relations(trainingGoals, ({ one }) => ({
  child: one(children, {
    fields: [trainingGoals.childId],
    references: [children.id],
  }),
  coach: one(coaches, {
    fields: [trainingGoals.coachId],
    references: [coaches.id],
  }),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  child: one(children, {
    fields: [attendanceRecords.childId],
    references: [children.id],
  }),
  class: one(classes, {
    fields: [attendanceRecords.classId],
    references: [classes.id],
  }),
}));

export const coachMessagesRelations = relations(coachMessages, ({ one }) => ({
  fromCoach: one(coaches, {
    fields: [coachMessages.fromCoachId],
    references: [coaches.id],
  }),
  toUser: one(users, {
    fields: [coachMessages.toUserId],
    references: [users.id],
  }),
  child: one(children, {
    fields: [coachMessages.childId],
    references: [children.id],
  }),
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

export const insertEnrollmentWeekSchema = createInsertSchema(enrollmentWeeks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type EnrollmentWeek = typeof enrollmentWeeks.$inferSelect;
export type InsertEnrollmentWeek = z.infer<typeof insertEnrollmentWeekSchema>;

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

export const insertContactEnquirySchema = createInsertSchema(contactEnquiries).omit({
  id: true,
  createdAt: true,
  status: true,
  adminNotes: true,
  reviewedBy: true,
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

export const surveyResponses = pgTable("survey_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentName: varchar("student_name", { length: 100 }),
  studentClass: varchar("student_class", { length: 50 }).notNull(),
  athleteLevel: varchar("athlete_level", { length: 50 }).notNull(),
  outsideSports: text("outside_sports").array().notNull(),
  otherSports: text("other_sports"),
  daysActive: varchar("days_active", { length: 20 }).notNull(),
  runningEnjoyed: text("running_enjoyed").array().notNull(),
  runningEnjoymentScale: integer("running_enjoyment_scale").notNull(),
  fieldEventsInterested: text("field_events_interested").array().notNull(),
  hardestPart: varchar("hardest_part", { length: 50 }).notNull(),
  funFactors: text("fun_factors").array().notNull(),
  competingFeel: varchar("competing_feel", { length: 50 }).notNull(),
  engagementScale: integer("engagement_scale").notNull(),
  goals: text("goals").array().notNull(),
  specificEvent: text("specific_event"),
  awesomeFactor: text("awesome_factor"),
  injuryInfo: text("injury_info"),
  excitementLevel: integer("excitement_level").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
  id: true,
  createdAt: true,
});

// Types
export type PerformanceVideoHighlight = typeof performanceVideoHighlights.$inferSelect;
export type InsertPerformanceVideoHighlight = z.infer<typeof insertPerformanceVideoHighlightSchema>;
export type VideoShare = typeof videoShares.$inferSelect;
export type InsertVideoShare = z.infer<typeof insertVideoShareSchema>;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;





export const insertPerformanceRecordSchema = createInsertSchema(performanceRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrainingGoalSchema = createInsertSchema(trainingGoals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  achievedAt: true,
});

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

// ── Junior Academy Applications ──────────────────────────────────────────
export const juniorAcademyApplications = pgTable("junior_academy_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentName: varchar("parent_name", { length: 100 }).notNull(),
  parentEmail: varchar("parent_email", { length: 255 }).notNull(),
  parentPhone: varchar("parent_phone", { length: 30 }).notNull(),
  athleteName: varchar("athlete_name", { length: 100 }).notNull(),
  athleteDob: varchar("athlete_dob", { length: 20 }),
  sports: text("sports"),
  activityDays: text("activity_days"),
  medical: text("medical"),
  injuries: text("injuries"),
  availDays: text("avail_days"),
  commitments: text("commitments"),
  facilities: text("facilities"),
  parentGoals: text("parent_goals"),
  athleteGoal: text("athlete_goal"),
  favSport: text("fav_sport"),
  nervous: text("nervous"),
  contactPref: varchar("contact_pref", { length: 50 }),
  feedbackPref: varchar("feedback_pref", { length: 50 }),
  coachNotes: text("coach_notes"),
  programme: varchar("programme", { length: 100 }),
  photoConsent: varchar("photo_consent", { length: 100 }),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertJuniorAcademyApplicationSchema = createInsertSchema(juniorAcademyApplications).omit({
  id: true,
  createdAt: true,
});
export type JuniorAcademyApplication = typeof juniorAcademyApplications.$inferSelect;
export type InsertJuniorAcademyApplication = z.infer<typeof insertJuniorAcademyApplicationSchema>;
export type ContactEnquiry = typeof contactEnquiries.$inferSelect;
export type InsertContactEnquiry = z.infer<typeof insertContactEnquirySchema>;
export type Waitlist = typeof waitlists.$inferSelect;
export type InsertWaitlist = z.infer<typeof insertWaitlistSchema>;
export type BlogArticle = typeof blogArticles.$inferSelect;
export type InsertBlogArticle = z.infer<typeof insertBlogArticleSchema>;
export type PerformanceRecord = typeof performanceRecords.$inferSelect;
export type InsertPerformanceRecord = z.infer<typeof insertPerformanceRecordSchema>;
export type TrainingGoal = typeof trainingGoals.$inferSelect;
export type InsertTrainingGoal = z.infer<typeof insertTrainingGoalSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type TermConfiguration = typeof termConfigurations.$inferSelect;
export type InsertTermConfiguration = z.infer<typeof insertTermConfigurationSchema>;

export type TermHoliday = typeof termHolidays.$inferSelect;
export type InsertTermHoliday = z.infer<typeof insertTermHolidaySchema>;

// ── Athlete Assessments ──────────────────────────────────────────
export const athleteAssessments = pgTable("athlete_assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  childId: uuid("child_id").references(() => children.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  type: varchar("type", { length: 50 }).notNull().default("note"),
  content: text("content"),
  fileUrl: text("file_url"),
  fileName: varchar("file_name", { length: 255 }),
  fileType: varchar("file_type", { length: 50 }),
  fileSize: integer("file_size"),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAthleteAssessmentSchema = createInsertSchema(athleteAssessments).omit({
  id: true,
  createdAt: true,
});

export type AthleteAssessment = typeof athleteAssessments.$inferSelect;
export type InsertAthleteAssessment = z.infer<typeof insertAthleteAssessmentSchema>;

// ── My Athletic Journey (MAJ) Tables ─────────────────────────────

export const majAthletes = pgTable("maj_athletes", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  grade: varchar("grade", { length: 50 }),
  program: varchar("program", { length: 100 }),
  coach: varchar("coach", { length: 100 }),
  school: varchar("school", { length: 150 }),
  avatar: varchar("avatar", { length: 16 }),
  currentModule: integer("current_module").notNull().default(1),
  currentWeek: integer("current_week").notNull().default(1),
  xp: integer("xp").notNull().default(0),
  streak: integer("streak").notNull().default(0),
  streakFreezes: integer("streak_freezes").notNull().default(1),
  lastWeekCompletedAt: timestamp("last_week_completed_at"),
  sessionsCompleted: integer("sessions_completed").notNull().default(0),
  reflectionsSubmitted: integer("reflections_submitted").notNull().default(0),
  earnedBadgeKeys: text("earned_badge_keys").array().notNull().default(sql`'{}'::text[]`),
  completedWeeks: jsonb("completed_weeks").notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const majReflections = pgTable("maj_reflections", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id").references(() => majAthletes.id, { onDelete: "cascade" }).notNull(),
  moduleNum: integer("module_num").notNull(),
  weekNum: integer("week_num").notNull(),
  prompt: text("prompt").notNull(),
  response: text("response").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
  coachNote: text("coach_note"),
});

export const majBadges = pgTable("maj_badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id").references(() => majAthletes.id, { onDelete: "cascade" }).notNull(),
  badgeKey: varchar("badge_key", { length: 100 }).notNull(),
  badgeName: varchar("badge_name", { length: 200 }).notNull(),
  badgeIcon: varchar("badge_icon", { length: 20 }).notNull(),
  xpAwarded: integer("xp_awarded").notNull().default(0),
  awardedAt: timestamp("awarded_at").defaultNow(),
  awardedBy: varchar("awarded_by", { length: 100 }),
});

export const majCoaches = pgTable("maj_coaches", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: text("password").notNull(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Coach kudos — one-tap encouragement sent by a coach to an athlete
export const majKudos = pgTable("maj_kudos", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id").references(() => majAthletes.id, { onDelete: "cascade" }).notNull(),
  coachName: varchar("coach_name", { length: 100 }),
  emoji: varchar("emoji", { length: 16 }).notNull(),
  message: varchar("message", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Web Push subscriptions — one row per device an athlete enabled reminders on
export const majPushSubscriptions = pgTable("maj_push_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteId: uuid("athlete_id").references(() => majAthletes.id, { onDelete: "cascade" }).notNull(),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertMajAthleteSchema = createInsertSchema(majAthletes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMajReflectionSchema = createInsertSchema(majReflections).omit({ id: true, submittedAt: true });
export const insertMajBadgeSchema = createInsertSchema(majBadges).omit({ id: true, awardedAt: true });
export const insertMajCoachSchema = createInsertSchema(majCoaches).omit({ id: true, createdAt: true });

export type MajAthlete = typeof majAthletes.$inferSelect;
export type InsertMajAthlete = z.infer<typeof insertMajAthleteSchema>;
export type MajReflection = typeof majReflections.$inferSelect;
export type InsertMajReflection = z.infer<typeof insertMajReflectionSchema>;
export type MajBadge = typeof majBadges.$inferSelect;
export type InsertMajBadge = z.infer<typeof insertMajBadgeSchema>;
export type MajCoach = typeof majCoaches.$inferSelect;
export type InsertMajCoach = z.infer<typeof insertMajCoachSchema>;
export type MajPushSubscription = typeof majPushSubscriptions.$inferSelect;
export type MajKudosEntry = typeof majKudos.$inferSelect;
