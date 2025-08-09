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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const sportTypeEnum = pgEnum("sport_type", [
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  children: many(children),
  enrollments: many(enrollments),
  notifications: many(notifications),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  parent: one(users, {
    fields: [children.parentId],
    references: [users.id],
  }),
  enrollments: many(enrollments),
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

export const classesRelations = relations(classes, ({ one, many }) => ({
  venue: one(venues, {
    fields: [classes.venueId],
    references: [venues.id],
  }),
  coach: one(coaches, {
    fields: [classes.coachId],
    references: [coaches.id],
  }),
  enrollments: many(enrollments),
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
