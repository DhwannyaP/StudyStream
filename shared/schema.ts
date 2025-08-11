import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["teacher", "student", "admin"] }).notNull(),
  fullName: text("full_name").notNull(),
  department: text("department"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  content: jsonb("content"), // For text content
  fileUrl: text("file_url"), // For uploaded files
  fileType: text("file_type"), // pdf, ppt, docx, image, etc.
  fileName: text("file_name"),
  category: text("category").default("lecture"),
  isActive: boolean("is_active").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const studyGroups = pgTable("study_groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id").notNull().references(() => users.id),
  schedule: text("schedule"), // "Mon, Wed 7PM"
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studyGroupMembers = pgTable("study_group_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => studyGroups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").references(() => notes.id),
  groupId: varchar("group_id").references(() => studyGroups.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isModerated: boolean("is_moderated").default(false),
  moderationResult: jsonb("moderation_result"), // AI moderation response
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const annotations = pgTable("annotations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  noteId: varchar("note_id").notNull().references(() => notes.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type", { enum: ["highlight", "note"] }).notNull(),
  content: text("content"),
  position: jsonb("position").notNull(), // {start: number, end: number, page?: number}
  color: text("color").default("#FFEB3B"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  noteId: varchar("note_id").references(() => notes.id),
  isActive: boolean("is_active").default(true),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  cursorPosition: jsonb("cursor_position"), // {x: number, y: number, page?: number}
});

// Admin oversight tables
export const userApprovals = pgTable("user_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contentModerationLog = pgTable("content_moderation_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentType: text("content_type", { enum: ["note", "message", "user"] }).notNull(),
  contentId: varchar("content_id").notNull(),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: text("action", { enum: ["approved", "rejected", "flagged", "removed"] }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  viewCount: true,
});

export const insertStudyGroupSchema = createInsertSchema(studyGroups).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  isModerated: true,
  moderationResult: true,
});

export const insertAnnotationSchema = createInsertSchema(annotations).omit({
  id: true,
  createdAt: true,
});

export const insertUserApprovalSchema = createInsertSchema(userApprovals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContentModerationLogSchema = createInsertSchema(contentModerationLog).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type StudyGroup = typeof studyGroups.$inferSelect;
export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Annotation = typeof annotations.$inferSelect;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;
export type Session = typeof sessions.$inferSelect;
export type UserApproval = typeof userApprovals.$inferSelect;
export type InsertUserApproval = z.infer<typeof insertUserApprovalSchema>;
export type ContentModerationLog = typeof contentModerationLog.$inferSelect;
export type InsertContentModerationLog = z.infer<typeof insertContentModerationLogSchema>;
