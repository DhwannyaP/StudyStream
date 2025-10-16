import { Schema, model, Document } from 'mongoose';
import { z } from 'zod';

// User Schema
export interface IUser extends Document {
  _id: string;
  username: string;
  email: string;
  password: string;
  role: 'teacher' | 'student' | 'admin';
  fullName: string;
  department?: string;
  profileImage?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['teacher', 'student', 'admin'], required: true },
  fullName: { type: String, required: true },
  department: { type: String },
  profileImage: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Note Schema
export interface INote extends Document {
  _id: string;
  teacherId: string;
  groupId?: string;
  title: string;
  description?: string;
  content?: any; // JSON content
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  category?: string;
  isActive?: boolean;
  viewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>({
  teacherId: { type: String, required: true, ref: 'User' },
  groupId: { type: String, ref: 'StudyGroup' },
  title: { type: String, required: true },
  description: { type: String },
  content: { type: Schema.Types.Mixed },
  fileUrl: { type: String },
  fileType: { type: String },
  fileName: { type: String },
  category: { type: String, default: 'lecture' },
  isActive: { type: Boolean, default: true },
  viewCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Study Group Schema
export interface IStudyGroup extends Document {
  _id: string;
  name: string;
  description?: string;
  creatorId: string;
  schedule?: string;
  isActive?: boolean;
  createdAt: Date;
}

const studyGroupSchema = new Schema<IStudyGroup>({
  name: { type: String, required: true },
  description: { type: String },
  creatorId: { type: String, required: true, ref: 'User' },
  schedule: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Study Group Member Schema
export interface IStudyGroupMember extends Document {
  _id: string;
  groupId: string;
  userId: string;
  joinedAt: Date;
}

const studyGroupMemberSchema = new Schema<IStudyGroupMember>({
  groupId: { type: String, required: true, ref: 'StudyGroup' },
  userId: { type: String, required: true, ref: 'User' },
  joinedAt: { type: Date, default: Date.now }
});

// Message Schema
export interface IMessage extends Document {
  _id: string;
  noteId?: string;
  groupId?: string;
  senderId: string;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isModerated?: boolean;
  moderationResult?: any;
  createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
  noteId: { type: String, ref: 'Note' },
  groupId: { type: String, ref: 'StudyGroup' },
  senderId: { type: String, required: true, ref: 'User' },
  content: { type: String, required: true },
  fileUrl: { type: String },
  fileName: { type: String },
  fileType: { type: String },
  isModerated: { type: Boolean, default: false },
  moderationResult: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

// Annotation Schema
export interface IAnnotation extends Document {
  _id: string;
  noteId: string;
  userId: string;
  type: 'highlight' | 'note';
  content?: string;
  position: any; // {start: number, end: number, page?: number}
  color?: string;
  createdAt: Date;
}

const annotationSchema = new Schema<IAnnotation>({
  noteId: { type: String, required: true, ref: 'Note' },
  userId: { type: String, required: true, ref: 'User' },
  type: { type: String, enum: ['highlight', 'note'], required: true },
  content: { type: String },
  position: { type: Schema.Types.Mixed, required: true },
  color: { type: String, default: '#FFEB3B' },
  createdAt: { type: Date, default: Date.now }
});

// Session Schema
export interface ISession extends Document {
  _id: string;
  userId: string;
  noteId?: string;
  isActive?: boolean;
  lastSeen: Date;
  cursorPosition?: any; // {x: number, y: number, page?: number}
}

const sessionSchema = new Schema<ISession>({
  userId: { type: String, required: true, ref: 'User' },
  noteId: { type: String, ref: 'Note' },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date, default: Date.now },
  cursorPosition: { type: Schema.Types.Mixed }
});

// User Approval Schema
export interface IUserApproval extends Document {
  _id: string;
  userId: string;
  adminId: string;
  status?: 'pending' | 'approved' | 'rejected';
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userApprovalSchema = new Schema<IUserApproval>({
  userId: { type: String, required: true, ref: 'User' },
  adminId: { type: String, required: true, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Content Moderation Log Schema
export interface IContentModerationLog extends Document {
  _id: string;
  adminId: string;
  contentId: string;
  contentType: string;
  action: string;
  reason?: string;
  createdAt: Date;
}

const contentModerationLogSchema = new Schema<IContentModerationLog>({
  adminId: { type: String, required: true, ref: 'User' },
  contentId: { type: String, required: true },
  contentType: { type: String, required: true },
  action: { type: String, required: true },
  reason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Notification Schema
export interface INotification extends Document {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  isRead?: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>({
  userId: { type: String, required: true, ref: 'User' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  isRead: { type: Boolean, default: false },
  relatedId: { type: String },
  relatedType: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Create models
export const User = model<IUser>('User', userSchema);
export const Note = model<INote>('Note', noteSchema);
export const StudyGroup = model<IStudyGroup>('StudyGroup', studyGroupSchema);
export const StudyGroupMember = model<IStudyGroupMember>('StudyGroupMember', studyGroupMemberSchema);
export const Message = model<IMessage>('Message', messageSchema);
export const Annotation = model<IAnnotation>('Annotation', annotationSchema);
export const Session = model<ISession>('Session', sessionSchema);
export const UserApproval = model<IUserApproval>('UserApproval', userApprovalSchema);
export const ContentModerationLog = model<IContentModerationLog>('ContentModerationLog', contentModerationLogSchema);
export const Notification = model<INotification>('Notification', notificationSchema);

// Zod schemas for validation
export const insertUserSchema = z.object({
  username: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(['teacher', 'student', 'admin']),
  fullName: z.string().min(1),
  department: z.string().optional(),
  profileImage: z.string().optional(),
});

export const insertNoteSchema = z.object({
  teacherId: z.string().min(1),
  groupId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.any().optional(),
  fileUrl: z.string().optional(),
  fileType: z.string().optional(),
  fileName: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertStudyGroupSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  creatorId: z.string().min(1),
  schedule: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const insertMessageSchema = z.object({
  noteId: z.string().optional(),
  groupId: z.string().optional(),
  senderId: z.string().min(1),
  content: z.string().min(1),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
});

export const insertAnnotationSchema = z.object({
  noteId: z.string().min(1),
  userId: z.string().min(1),
  type: z.enum(['highlight', 'note']),
  content: z.string().optional(),
  position: z.any(),
  color: z.string().optional(),
});

export const insertUserApprovalSchema = z.object({
  userId: z.string().min(1),
  adminId: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  reason: z.string().optional(),
});

export const insertContentModerationLogSchema = z.object({
  adminId: z.string().min(1),
  contentId: z.string().min(1),
  contentType: z.string().min(1),
  action: z.string().min(1),
  reason: z.string().optional(),
});

export const insertNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.string().optional(),
  relatedId: z.string().optional(),
  relatedType: z.string().optional(),
});

// Type exports for compatibility
export type User = IUser;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Note = INote;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type StudyGroup = IStudyGroup;
export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type Message = IMessage;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Annotation = IAnnotation;
export type InsertAnnotation = z.infer<typeof insertAnnotationSchema>;
export type Session = ISession;
export type UserApproval = IUserApproval;
export type InsertUserApproval = z.infer<typeof insertUserApprovalSchema>;
export type ContentModerationLog = IContentModerationLog;
export type InsertContentModerationLog = z.infer<typeof insertContentModerationLogSchema>;
export type Notification = INotification;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;