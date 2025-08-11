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
  type Session
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
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
  endSession(sessionId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private notes: Map<string, Note> = new Map();
  private studyGroups: Map<string, StudyGroup> = new Map();
  private groupMembers: Map<string, string[]> = new Map(); // groupId -> userIds
  private messages: Map<string, Message> = new Map();
  private annotations: Map<string, Annotation> = new Map();
  private sessions: Map<string, Session> = new Map();

  constructor() {
    // Create default teacher
    const defaultTeacher: User = {
      id: "teacher1",
      username: "sarah.johnson",
      email: "sarah.johnson@university.edu",
      password: "hashedpassword",
      role: "teacher",
      fullName: "Dr. Sarah Johnson",
      department: "Computer Science Department",
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face",
      createdAt: new Date(),
    };
    this.users.set(defaultTeacher.id, defaultTeacher);

    // Create default student
    const defaultStudent: User = {
      id: "student1",
      username: "emily.chen",
      email: "emily.chen@student.university.edu",
      password: "hashedpassword",
      role: "student",
      fullName: "Emily Chen",
      department: null,
      profileImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=64&h=64&fit=crop&crop=face",
      createdAt: new Date(),
    };
    this.users.set(defaultStudent.id, defaultStudent);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      department: insertUser.department ?? null,
      profileImage: insertUser.profileImage ?? null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Notes
  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async getNotesByTeacher(teacherId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.teacherId === teacherId);
  }

  async getAllNotes(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = randomUUID();
    const note: Note = {
      ...insertNote,
      id,
      content: insertNote.content ?? null,
      description: insertNote.description ?? null,
      fileUrl: insertNote.fileUrl ?? null,
      fileType: insertNote.fileType ?? null,
      fileName: insertNote.fileName ?? null,
      category: insertNote.category ?? null,
      isActive: insertNote.isActive ?? null,
      viewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote = { ...note, ...updates, updatedAt: new Date() };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: string): Promise<boolean> {
    return this.notes.delete(id);
  }

  async incrementViewCount(noteId: string): Promise<void> {
    const note = this.notes.get(noteId);
    if (note) {
      note.viewCount = (note.viewCount || 0) + 1;
      this.notes.set(noteId, note);
    }
  }

  // Study Groups
  async getStudyGroup(id: string): Promise<StudyGroup | undefined> {
    return this.studyGroups.get(id);
  }

  async getAllStudyGroups(): Promise<StudyGroup[]> {
    return Array.from(this.studyGroups.values());
  }

  async createStudyGroup(insertGroup: InsertStudyGroup): Promise<StudyGroup> {
    const id = randomUUID();
    const group: StudyGroup = {
      ...insertGroup,
      id,
      description: insertGroup.description ?? null,
      isActive: insertGroup.isActive ?? null,
      schedule: insertGroup.schedule ?? null,
      createdAt: new Date(),
    };
    this.studyGroups.set(id, group);
    this.groupMembers.set(id, [insertGroup.creatorId]);
    return group;
  }

  async joinStudyGroup(groupId: string, userId: string): Promise<boolean> {
    const members = this.groupMembers.get(groupId) || [];
    if (!members.includes(userId)) {
      members.push(userId);
      this.groupMembers.set(groupId, members);
    }
    return true;
  }

  async leaveStudyGroup(groupId: string, userId: string): Promise<boolean> {
    const members = this.groupMembers.get(groupId) || [];
    const newMembers = members.filter(id => id !== userId);
    this.groupMembers.set(groupId, newMembers);
    return true;
  }

  async getGroupMembers(groupId: string): Promise<string[]> {
    return this.groupMembers.get(groupId) || [];
  }

  async getUserGroups(userId: string): Promise<StudyGroup[]> {
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
    return Array.from(this.messages.values()).filter(msg => 
      (noteId ? msg.noteId === noteId : true) &&
      (groupId ? msg.groupId === groupId : true)
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      noteId: insertMessage.noteId ?? null,
      groupId: insertMessage.groupId ?? null,
      isModerated: false,
      moderationResult: null,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async updateMessageModeration(messageId: string, result: any): Promise<void> {
    const message = this.messages.get(messageId);
    if (message) {
      message.isModerated = true;
      message.moderationResult = result;
      this.messages.set(messageId, message);
    }
  }

  // Annotations
  async getAnnotations(noteId: string): Promise<Annotation[]> {
    return Array.from(this.annotations.values()).filter(ann => ann.noteId === noteId);
  }

  async createAnnotation(insertAnnotation: InsertAnnotation): Promise<Annotation> {
    const id = randomUUID();
    const annotation: Annotation = {
      ...insertAnnotation,
      id,
      content: insertAnnotation.content ?? null,
      color: insertAnnotation.color ?? null,
      createdAt: new Date(),
    };
    this.annotations.set(id, annotation);
    return annotation;
  }

  async deleteAnnotation(id: string): Promise<boolean> {
    return this.annotations.delete(id);
  }

  // Sessions
  async getActiveSessions(noteId?: string): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(session => 
      session.isActive && 
      (noteId ? session.noteId === noteId : true)
    );
  }

  async createSession(userId: string, noteId?: string): Promise<Session> {
    const id = randomUUID();
    const session: Session = {
      id,
      userId,
      noteId: noteId || null,
      isActive: true,
      lastSeen: new Date(),
      cursorPosition: null,
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastSeen = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
    }
  }
}

export const storage = new MemStorage();
