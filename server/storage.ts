import {
  type User,
  type InsertUser,
  type Note,
  type InsertNote,
  type StudyGroup,
  type InsertStudyGroup,
  type Message,
  type InsertMessage,
  type Annotation,
  type InsertAnnotation,
  type Session,
  type UserApproval,
  type InsertUserApproval,
  type ContentModerationLog,
  type InsertContentModerationLog,
  type Notification,
  type InsertNotification,
  User as UserModel,
  Note as NoteModel,
  StudyGroup as StudyGroupModel,
  StudyGroupMember as StudyGroupMemberModel,
  Message as MessageModel,
  Annotation as AnnotationModel,
  Session as SessionModel,
  UserApproval as UserApprovalModel,
  ContentModerationLog as ContentModerationLogModel,
  Notification as NotificationModel,
} from "@shared/schema";
import { connectDB } from "./db";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Admin - User Approvals
  createUserApproval(approval: InsertUserApproval): Promise<UserApproval>;
  getUserApprovals(status?: string): Promise<UserApproval[]>;
  updateUserApproval(
    id: string,
    status: string,
    reason?: string
  ): Promise<UserApproval | undefined>;

  // Admin - Content Moderation
  createModerationLog(
    log: InsertContentModerationLog
  ): Promise<ContentModerationLog>;
  getModerationLogs(adminId?: string): Promise<ContentModerationLog[]>;

  // Notes
  getNote(id: string): Promise<Note | undefined>;
  getNotesByTeacher(teacherId: string): Promise<Note[]>;
  getAllNotes(): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<boolean>;
  incrementViewCount(noteId: string): Promise<void>;

  // Study Groups
  getStudyGroup(id: string): Promise<StudyGroup | undefined>;
  getAllStudyGroups(): Promise<StudyGroup[]>;
  createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup>;
  joinStudyGroup(groupId: string, userId: string): Promise<boolean>;
  leaveStudyGroup(groupId: string, userId: string): Promise<boolean>;
  getGroupMembers(groupId: string): Promise<string[]>;
  getUserGroups(userId: string): Promise<StudyGroup[]>;

  // Messages
  getMessages(noteId?: string, groupId?: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessageModeration(messageId: string, result: any): Promise<void>;

  // Annotations
  getAnnotations(noteId: string): Promise<Annotation[]>;
  createAnnotation(annotation: InsertAnnotation): Promise<Annotation>;
  deleteAnnotation(id: string): Promise<boolean>;

  // Sessions
  getActiveSessions(noteId?: string): Promise<Session[]>;
  createSession(userId: string, noteId?: string): Promise<Session>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<void>;

  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(notificationId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<boolean>;
  getUnreadNotificationCount(userId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private notes: Map<string, Note> = new Map();
  private studyGroups: Map<string, StudyGroup> = new Map();
  private groupMembers: Map<string, string[]> = new Map(); // groupId -> userIds
  private messages: Map<string, Message> = new Map();
  private annotations: Map<string, Annotation> = new Map();
  private sessions: Map<string, Session> = new Map();
  private userApprovals: Map<string, UserApproval> = new Map();
  private moderationLogs: Map<string, ContentModerationLog> = new Map();
  private notifications: Map<string, Notification> = new Map();

  constructor() {
    // Create default admin
    const defaultAdmin: User = {
      _id: "admin1",
      username: "admin",
      email: "admin@university.edu",
      password: "admin123",
      role: "admin",
      fullName: "System Administrator",
      department: "IT Administration",
      profileImage:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face",
      createdAt: new Date(),
    };
    this.users.set(defaultAdmin._id, defaultAdmin);

    // Create default teacher
    const defaultTeacher: User = {
      _id: "teacher1",
      username: "sarah.johnson",
      email: "sarah.johnson@university.edu",
      password: "hashedpassword",
      role: "teacher",
      fullName: "Dr. Sarah Johnson",
      department: "Computer Science Department",
      profileImage:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
      createdAt: new Date(),
    };
    this.users.set(defaultTeacher._id, defaultTeacher);

    // Create default student
    const defaultStudent: User = {
      _id: "student1",
      username: "emily.chen",
      email: "emily.chen@student.university.edu",
      password: "hashedpassword",
      role: "student",
      fullName: "Emily Chen",
      department: undefined,
      profileImage:
        "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
      createdAt: new Date(),
    };
    this.users.set(defaultStudent._id, defaultStudent);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    if (process.env.MONGODB_URI) {
      const user = await UserModel.findById(id).lean();
      return user as User | undefined;
    }
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    if (process.env.MONGODB_URI) {
      const user = await UserModel.findOne({ email }).lean();
      return user as User | undefined;
    }
    return Array.from(this.users.values()).find((user) => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    if (process.env.MONGODB_URI) {
      const user = await UserModel.findOne({ username }).lean();
      return user as User | undefined;
    }
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    if (process.env.MONGODB_URI) {
      const user = new UserModel(insertUser);
      await user.save();
      
      // Create welcome notification
      await this.createNotification({
        userId: user._id.toString(),
        title: "Welcome to EduCollab!",
        message: `Welcome ${user.fullName}! Your account has been created successfully.`,
        type: "success",
      });

      return user.toObject() as User;
    }
    
    const id = randomUUID();
    const user: User = {
      _id: id,
      ...insertUser,
      createdAt: new Date(),
    } as User;
    this.users.set(id, user);

    // Create welcome notification
    await this.createNotification({
      userId: id,
      title: "Welcome to EduCollab!",
      message: `Welcome ${user.fullName}! Your account has been created successfully.`,
      type: "success",
    });

    return user;
  }

  async getAllUsers(): Promise<User[]> {
    if (process.env.MONGODB_URI) {
      const users = await UserModel.find().lean();
      return users as User[];
    }
    return Array.from(this.users.values());
  }

  async getUsersByRole(role: string): Promise<User[]> {
    if (process.env.MONGODB_URI) {
      const users = await UserModel.find({ role }).lean();
      return users as User[];
    }
    return Array.from(this.users.values()).filter((user) => user.role === role);
  }

  async updateUser(
    id: string,
    updates: Partial<User>
  ): Promise<User | undefined> {
    if (process.env.MONGODB_URI) {
      const user = await UserModel.findByIdAndUpdate(id, updates, { new: true }).lean();
      return user as User | undefined;
    }
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Admin - User Approvals
  async createUserApproval(
    insertApproval: InsertUserApproval
  ): Promise<UserApproval> {
    if (process.env.MONGODB_URI) {
      const approval = new UserApprovalModel(insertApproval);
      await approval.save();
      return approval.toObject() as UserApproval;
    }
    
    const id = randomUUID();
    const approval: UserApproval = {
      _id: id,
      ...insertApproval,
      status: insertApproval.status ?? "pending",
      reason: insertApproval.reason ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.userApprovals.set(id, approval);
    return approval;
  }

  async getUserApprovals(status?: string): Promise<UserApproval[]> {
    if (process.env.MONGODB_URI) {
      const query = status ? { status } : {};
      const approvals = await UserApprovalModel.find(query).lean();
      return approvals as UserApproval[];
    }
    
    const approvals = Array.from(this.userApprovals.values());
    return status ? approvals.filter((a) => a.status === status) : approvals;
  }

  async updateUserApproval(
    id: string,
    status: string,
    reason?: string
  ): Promise<UserApproval | undefined> {
    if (process.env.MONGODB_URI) {
      const approval = await UserApprovalModel.findByIdAndUpdate(
        id,
        { status, reason, updatedAt: new Date() },
        { new: true }
      ).lean();
      
      if (approval) {
        // Notify the user about the approval status
        if (status === "approved") {
          await this.createNotification({
            userId: approval.userId,
            title: "Account Approved",
            message: "Your account has been approved! You can now access the platform.",
            type: "success",
          });
        } else if (status === "rejected") {
          await this.createNotification({
            userId: approval.userId,
            title: "Account Rejected",
            message: `Your account request has been rejected. Reason: ${
              reason || "No reason provided"
            }`,
            type: "error",
          });
        }
      }
      
      return approval as UserApproval | undefined;
    }
    
    const approval = this.userApprovals.get(id);
    if (!approval) return undefined;

    const updated: UserApproval = {
      ...approval,
      status: status as any,
      reason: reason ?? approval.reason,
      updatedAt: new Date(),
    };
    this.userApprovals.set(id, updated);

    // Notify the user about the approval status
    if (status === "approved") {
      await this.createNotification({
        userId: approval.userId,
        title: "Account Approved",
        message: "Your account has been approved! You can now access the platform.",
        type: "success",
      });
    } else if (status === "rejected") {
      await this.createNotification({
        userId: approval.userId,
        title: "Account Rejected",
        message: `Your account request has been rejected. Reason: ${
          reason || "No reason provided"
        }`,
        type: "error",
      });
    }

    return updated;
  }

  // Admin - Content Moderation
  async createModerationLog(
    insertLog: InsertContentModerationLog
  ): Promise<ContentModerationLog> {
    if (process.env.MONGODB_URI) {
      const log = new ContentModerationLogModel(insertLog);
      await log.save();
      return log.toObject() as ContentModerationLog;
    }
    
    const id = randomUUID();
    const log: ContentModerationLog = {
      _id: id,
      ...insertLog,
      reason: insertLog.reason ?? undefined,
      createdAt: new Date(),
    };
    this.moderationLogs.set(id, log);
    return log;
  }

  async getModerationLogs(adminId?: string): Promise<ContentModerationLog[]> {
    if (process.env.MONGODB_URI) {
      const query = adminId ? { adminId } : {};
      const logs = await ContentModerationLogModel.find(query).lean();
      return logs as ContentModerationLog[];
    }
    
    const logs = Array.from(this.moderationLogs.values());
    return adminId ? logs.filter((l) => l.adminId === adminId) : logs;
  }

  // Notes
  async getNote(id: string): Promise<Note | undefined> {
    if (process.env.MONGODB_URI) {
      const note = await NoteModel.findById(id).lean();
      return note as Note | undefined;
    }
    return this.notes.get(id);
  }

  async getNotesByTeacher(teacherId: string): Promise<Note[]> {
    if (process.env.MONGODB_URI) {
      const notes = await NoteModel.find({ teacherId }).lean();
      return notes as Note[];
    }
    return Array.from(this.notes.values()).filter(
      (note) => note.teacherId === teacherId
    );
  }

  async getAllNotes(): Promise<Note[]> {
    if (process.env.MONGODB_URI) {
      const notes = await NoteModel.find().lean();
      return notes as Note[];
    }
    return Array.from(this.notes.values());
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    if (process.env.MONGODB_URI) {
      const note = new NoteModel({
        ...insertNote,
        viewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await note.save();

      // Notify the teacher who uploaded the note
      await this.createNotification({
        userId: insertNote.teacherId,
        title: "Note Uploaded",
        message: `Your note "${insertNote.title}" has been uploaded successfully!`,
        type: "success",
        relatedId: note._id.toString(),
        relatedType: "note",
      });

      return note.toObject() as Note;
    }
    
    const id = randomUUID();
    const note: Note = {
      _id: id,
      ...insertNote,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.set(id, note);

    // Notify the teacher who uploaded the note
    await this.createNotification({
      userId: insertNote.teacherId,
      title: "Note Uploaded",
      message: `Your note "${insertNote.title}" has been uploaded successfully!`,
      type: "success",
      relatedId: id,
      relatedType: "note",
    });

    return note;
  }

  async updateNote(
    id: string,
    updates: Partial<Note>
  ): Promise<Note | undefined> {
    if (process.env.MONGODB_URI) {
      const note = await NoteModel.findByIdAndUpdate(
        id,
        { ...updates, updatedAt: new Date() },
        { new: true }
      ).lean();
      return note as Note | undefined;
    }
    
    const note = this.notes.get(id);
    if (!note) return undefined;
    const updatedNote = { ...note, ...updates, updatedAt: new Date() };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    if (process.env.MONGODB_URI) {
      const result = await NoteModel.findByIdAndDelete(id);
      return !!result;
    }
    return this.notes.delete(id);
  }

  async incrementViewCount(noteId: string): Promise<void> {
    if (process.env.MONGODB_URI) {
      await NoteModel.findByIdAndUpdate(noteId, {
        $inc: { viewCount: 1 },
        updatedAt: new Date(),
      });
      return;
    }
    
    const note = this.notes.get(noteId);
    if (note) {
      note.viewCount = (note.viewCount || 0) + 1;
      this.notes.set(noteId, note);
    }
  }

  // Study Groups
  async getStudyGroup(id: string): Promise<StudyGroup | undefined> {
    if (process.env.MONGODB_URI) {
      const group = await StudyGroupModel.findById(id).lean();
      return group as StudyGroup | undefined;
    }
    return this.studyGroups.get(id);
  }

  async getAllStudyGroups(): Promise<StudyGroup[]> {
    if (process.env.MONGODB_URI) {
      const groups = await StudyGroupModel.find().lean();
      return groups as StudyGroup[];
    }
    return Array.from(this.studyGroups.values());
  }

  async createStudyGroup(insertGroup: InsertStudyGroup): Promise<StudyGroup> {
    if (process.env.MONGODB_URI) {
      const group = new StudyGroupModel(insertGroup);
      await group.save();
      
      // Add creator as member
      await StudyGroupMemberModel.create({
        groupId: group._id.toString(),
        userId: insertGroup.creatorId,
        joinedAt: new Date(),
      });

      // Notify the creator
      await this.createNotification({
        userId: insertGroup.creatorId,
        title: "Study Group Created",
        message: `Your study group "${insertGroup.name}" has been created successfully!`,
        type: "success",
        relatedId: group._id.toString(),
        relatedType: "study_group",
      });
      
      return group.toObject() as StudyGroup;
    }
    
    const id = randomUUID();
    const group: StudyGroup = {
      _id: id,
      ...insertGroup,
      createdAt: new Date(),
    };
    this.studyGroups.set(id, group);
    this.groupMembers.set(id, [insertGroup.creatorId]);

    // Notify the creator
    await this.createNotification({
      userId: insertGroup.creatorId,
      title: "Study Group Created",
      message: `Your study group "${insertGroup.name}" has been created successfully!`,
      type: "success",
      relatedId: id,
      relatedType: "study_group",
    });

    return group;
  }

  async joinStudyGroup(groupId: string, userId: string): Promise<boolean> {
    if (process.env.MONGODB_URI) {
      const existing = await StudyGroupMemberModel.findOne({ groupId, userId });
      if (!existing) {
        await StudyGroupMemberModel.create({
          groupId,
          userId,
          joinedAt: new Date(),
        });

        const group = await this.getStudyGroup(groupId);
        if (group) {
          await this.createNotification({
            userId: userId,
            title: "Joined Study Group",
            message: `You have successfully joined "${group.name}"!`,
            type: "success",
            relatedId: groupId,
            relatedType: "study_group",
          });
          if (group.creatorId !== userId) {
            const joiner = await this.getUser(userId);
            if (joiner) {
              await this.createNotification({
                userId: group.creatorId,
                title: "New Member Joined",
                message: `${joiner.fullName} has joined your study group "${group.name}"!`,
                type: "info",
                relatedId: groupId,
                relatedType: "study_group",
              });
            }
          }
        }
      }
      return true;
    }
    
    const members = this.groupMembers.get(groupId) || [];
    if (!members.includes(userId)) {
      members.push(userId);
      this.groupMembers.set(groupId, members);
      const group = this.studyGroups.get(groupId);
      if (group) {
        await this.createNotification({
          userId: userId,
          title: "Joined Study Group",
          message: `You have successfully joined "${group.name}"!`,
          type: "success",
          relatedId: groupId,
          relatedType: "study_group",
        });
        if (group.creatorId !== userId) {
          const joiner = this.users.get(userId);
          if (joiner) {
            await this.createNotification({
              userId: group.creatorId,
              title: "New Member Joined",
              message: `${joiner.fullName} has joined your study group "${group.name}"!`,
              type: "info",
              relatedId: groupId,
              relatedType: "study_group",
            });
          }
        }
      }
    }
    return true;
  }

  async leaveStudyGroup(groupId: string, userId: string): Promise<boolean> {
    if (process.env.MONGODB_URI) {
      await StudyGroupMemberModel.deleteOne({ groupId, userId });
      return true;
    }
    
    const members = this.groupMembers.get(groupId) || [];
    const newMembers = members.filter((id) => id !== userId);
    this.groupMembers.set(groupId, newMembers);
    return true;
  }

  async getGroupMembers(groupId: string): Promise<string[]> {
    if (process.env.MONGODB_URI) {
      const members = await StudyGroupMemberModel.find({ groupId }).select('userId').lean();
      return members.map(m => m.userId);
    }
    return this.groupMembers.get(groupId) || [];
  }

  async getUserGroups(userId: string): Promise<StudyGroup[]> {
    if (process.env.MONGODB_URI) {
      const memberRecords = await StudyGroupMemberModel.find({ userId }).select('groupId').lean();
      const groupIds = memberRecords.map(m => m.groupId);
      if (groupIds.length === 0) return [];
      
      const groups = await StudyGroupModel.find({ _id: { $in: groupIds } }).lean();
      return groups as StudyGroup[];
    }
    
    const userGroups: StudyGroup[] = [];
    for (const [groupId, members] of this.groupMembers.entries()) {
      if (members.includes(userId)) {
        const group = this.studyGroups.get(groupId);
        if (group) userGroups.push(group);
      }
    }
    return userGroups;
  }

  // Messages
  async getMessages(noteId?: string, groupId?: string): Promise<Message[]> {
    if (process.env.MONGODB_URI) {
      const query: any = {};
      if (noteId) query.noteId = noteId;
      if (groupId) query.groupId = groupId;
      
      const messages = await MessageModel.find(query).lean();
      return messages as Message[];
    }
    
    return Array.from(this.messages.values()).filter(
      (msg) =>
        (noteId ? msg.noteId === noteId : true) &&
        (groupId ? msg.groupId === groupId : true)
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    if (process.env.MONGODB_URI) {
      const message = new MessageModel(insertMessage);
      await message.save();
      return message.toObject() as Message;
    }
    
    const id = randomUUID();
    const message: Message = {
      _id: id,
      ...insertMessage,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessageModeration(messageId: string, result: any): Promise<void> {
    if (process.env.MONGODB_URI) {
      await MessageModel.findByIdAndUpdate(messageId, {
        isModerated: true,
        moderationResult: result,
      });
      return;
    }
    
    const message = this.messages.get(messageId);
    if (message) {
      message.isModerated = true;
      message.moderationResult = result;
      this.messages.set(messageId, message);
    }
  }

  // Annotations
  async getAnnotations(noteId: string): Promise<Annotation[]> {
    if (process.env.MONGODB_URI) {
      const annotations = await AnnotationModel.find({ noteId }).lean();
      return annotations as Annotation[];
    }
    
    return Array.from(this.annotations.values()).filter(
      (ann) => ann.noteId === noteId
    );
  }

  async createAnnotation(
    insertAnnotation: InsertAnnotation
  ): Promise<Annotation> {
    if (process.env.MONGODB_URI) {
      const annotation = new AnnotationModel(insertAnnotation);
      await annotation.save();
      return annotation.toObject() as Annotation;
    }
    
    const id = randomUUID();
    const annotation: Annotation = {
      _id: id,
      ...insertAnnotation,
      createdAt: new Date(),
    };
    this.annotations.set(id, annotation);
    return annotation;
  }

  async deleteAnnotation(id: string): Promise<boolean> {
    if (process.env.MONGODB_URI) {
      const result = await AnnotationModel.findByIdAndDelete(id);
      return !!result;
    }
    return this.annotations.delete(id);
  }

  // Sessions
  async getActiveSessions(noteId?: string): Promise<Session[]> {
    if (process.env.MONGODB_URI) {
      const query: any = { isActive: true };
      if (noteId) query.noteId = noteId;
      
      const sessions = await SessionModel.find(query).lean();
      return sessions as Session[];
    }
    
    return Array.from(this.sessions.values()).filter(
      (session) =>
        session.isActive && (noteId ? session.noteId === noteId : true)
    );
  }

  async createSession(userId: string, noteId?: string): Promise<Session> {
    if (process.env.MONGODB_URI) {
      const session = new SessionModel({
        userId,
        noteId,
        isActive: true,
        lastSeen: new Date(),
      });
      await session.save();
      return session.toObject() as Session;
    }
    
    const id = randomUUID();
    const session: Session = {
      _id: id,
      userId,
      noteId: noteId || undefined,
      isActive: true,
      lastSeen: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(
    sessionId: string,
    updates: Partial<Session>
  ): Promise<void> {
    if (process.env.MONGODB_URI) {
      await SessionModel.findByIdAndUpdate(sessionId, {
        ...updates,
        lastSeen: new Date(),
      });
      return;
    }
    
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastSeen = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    if (process.env.MONGODB_URI) {
      await SessionModel.findByIdAndUpdate(sessionId, { isActive: false });
      return;
    }
    
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
    }
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    if (process.env.MONGODB_URI) {
      const notifications = await NotificationModel.find({ userId }).lean();
      return notifications as Notification[];
    }
    
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.userId === userId
    );
  }

  async createNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    if (process.env.MONGODB_URI) {
      const notification = new NotificationModel(insertNotification);
      await notification.save();
      return notification.toObject() as Notification;
    }
    
    const id = randomUUID();
    const notification: Notification = {
      _id: id,
      ...insertNotification,
      isRead: false,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (process.env.MONGODB_URI) {
      await NotificationModel.findByIdAndUpdate(notificationId, { isRead: true });
      return;
    }
    
    const notification = this.notifications.get(notificationId);
    if (notification) {
      notification.isRead = true;
      this.notifications.set(notificationId, notification);
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    if (process.env.MONGODB_URI) {
      await NotificationModel.updateMany({ userId }, { isRead: true });
      return;
    }
    
    Array.from(this.notifications.values()).forEach((notification) => {
      if (notification.userId === userId) {
        notification.isRead = true;
        this.notifications.set(notification._id, notification);
      }
    });
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    if (process.env.MONGODB_URI) {
      const result = await NotificationModel.findByIdAndDelete(notificationId);
      return !!result;
    }
    return this.notifications.delete(notificationId);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    if (process.env.MONGODB_URI) {
      const count = await NotificationModel.countDocuments({ userId, isRead: false });
      return count;
    }
    
    return Array.from(this.notifications.values()).filter(
      (notification) => notification.userId === userId && !notification.isRead
    ).length;
  }
}

export const storage = new MemStorage();