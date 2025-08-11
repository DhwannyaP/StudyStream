import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { moderateMessage } from "./services/openai";
import { insertUserSchema, insertNoteSchema, insertStudyGroupSchema, insertMessageSchema, insertAnnotationSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import { z } from "zod";
import "./types"; // Import type extensions

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  }
});

// Simple session storage
const sessions = new Map<string, any>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication middleware
  const requireAuth = (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    const session = sessions.get(sessionId || '');
    
    if (!session) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    req.user = session.user;
    next();
  };

  const requireRole = (role: string) => (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const sessionId = Math.random().toString(36);
      sessions.set(sessionId, { user });
      
      res.json({ user: { ...user, password: undefined }, sessionId });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const sessionId = Math.random().toString(36);
      sessions.set(sessionId, { user });
      
      res.json({ user: { ...user, password: undefined }, sessionId });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", requireAuth, (req: any, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    sessions.delete(sessionId || '');
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    res.json({ ...req.user, password: undefined });
  });

  // User routes
  app.get("/api/users/teachers", requireAuth, async (req, res) => {
    try {
      const allUsers = await storage.getAllNotes(); // Get all notes first
      const teacherIds = [...new Set(allUsers.map(note => note.teacherId))];
      const teachers = await Promise.all(
        teacherIds.map(id => storage.getUser(id))
      );
      
      res.json(teachers.filter(Boolean).map(teacher => ({
        ...teacher,
        password: undefined
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notes routes
  app.get("/api/notes", requireAuth, async (req, res) => {
    try {
      const { teacherId } = req.query;
      
      let notes;
      if (teacherId) {
        notes = await storage.getNotesByTeacher(teacherId as string);
      } else {
        notes = await storage.getAllNotes();
      }
      
      // Add teacher info to notes
      const notesWithTeacher = await Promise.all(
        notes.map(async (note) => {
          const teacher = await storage.getUser(note.teacherId);
          return {
            ...note,
            teacher: teacher ? { ...teacher, password: undefined } : null
          };
        })
      );
      
      res.json(notesWithTeacher);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      // Increment view count
      await storage.incrementViewCount(note.id);
      
      const teacher = await storage.getUser(note.teacherId);
      res.json({
        ...note,
        teacher: teacher ? { ...teacher, password: undefined } : null
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notes", requireAuth, requireRole("teacher"), upload.single("file"), async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse({
        ...req.body,
        teacherId: req.user.id,
        fileUrl: req.file?.path,
        fileName: req.file?.originalname,
        fileType: req.file?.mimetype?.split("/")[0] || "text"
      });
      
      const note = await storage.createNote(noteData);
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/notes/:id", requireAuth, requireRole("teacher"), async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note || note.teacherId !== req.user.id) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      const updatedNote = await storage.updateNote(req.params.id, req.body);
      res.json(updatedNote);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/notes/:id", requireAuth, requireRole("teacher"), async (req, res) => {
    try {
      const note = await storage.getNote(req.params.id);
      if (!note || note.teacherId !== req.user.id) {
        return res.status(404).json({ message: "Note not found" });
      }
      
      await storage.deleteNote(req.params.id);
      res.json({ message: "Note deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Study Groups routes
  app.get("/api/study-groups", requireAuth, async (req, res) => {
    try {
      const groups = await storage.getAllStudyGroups();
      
      // Add member count to each group
      const groupsWithMembers = await Promise.all(
        groups.map(async (group) => {
          const members = await storage.getGroupMembers(group.id);
          return {
            ...group,
            memberCount: members.length,
            onlineNow: Math.floor(Math.random() * members.length) // Mock online count
          };
        })
      );
      
      res.json(groupsWithMembers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/study-groups", requireAuth, async (req, res) => {
    try {
      const groupData = insertStudyGroupSchema.parse({
        ...req.body,
        creatorId: req.user.id
      });
      
      const group = await storage.createStudyGroup(groupData);
      res.json(group);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/study-groups/:id/join", requireAuth, async (req, res) => {
    try {
      const success = await storage.joinStudyGroup(req.params.id, req.user.id);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Messages routes
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const { noteId, groupId } = req.query;
      const messages = await storage.getMessages(
        noteId as string, 
        groupId as string
      );
      
      // Add sender info
      const messagesWithSender = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            sender: sender ? { ...sender, password: undefined } : null
          };
        })
      );
      
      res.json(messagesWithSender);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      const message = await storage.createMessage(messageData);
      
      // Moderate the message
      const moderationResult = await moderateMessage(message.content);
      await storage.updateMessageModeration(message.id, moderationResult);
      
      const sender = await storage.getUser(message.senderId);
      const responseMessage = {
        ...message,
        moderationResult,
        sender: sender ? { ...sender, password: undefined } : null
      };
      
      res.json(responseMessage);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Annotations routes
  app.get("/api/annotations/:noteId", requireAuth, async (req, res) => {
    try {
      const annotations = await storage.getAnnotations(req.params.noteId);
      
      // Add user info
      const annotationsWithUser = await Promise.all(
        annotations.map(async (annotation) => {
          const user = await storage.getUser(annotation.userId);
          return {
            ...annotation,
            user: user ? { ...user, password: undefined } : null
          };
        })
      );
      
      res.json(annotationsWithUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/annotations", requireAuth, async (req, res) => {
    try {
      const annotationData = insertAnnotationSchema.parse({
        ...req.body,
        userId: req.user.id
      });
      
      const annotation = await storage.createAnnotation(annotationData);
      res.json(annotation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Sessions routes
  app.get("/api/sessions", requireAuth, async (req, res) => {
    try {
      const { noteId } = req.query;
      const sessions = await storage.getActiveSessions(noteId as string);
      
      // Add user info
      const sessionsWithUser = await Promise.all(
        sessions.map(async (session) => {
          const user = await storage.getUser(session.userId);
          return {
            ...session,
            user: user ? { ...user, password: undefined } : null
          };
        })
      );
      
      res.json(sessionsWithUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket, req) => {
    console.log('WebSocket connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        // Handle different message types
        switch (message.type) {
          case 'join_room':
            // Join a note room for real-time collaboration
            ws.send(JSON.stringify({
              type: 'room_joined',
              room: message.noteId
            }));
            break;
            
          case 'cursor_move':
            // Broadcast cursor position to other users in the same note
            Array.from(wss.clients).forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'cursor_update',
                  userId: message.userId,
                  position: message.position,
                  noteId: message.noteId
                }));
              }
            });
            break;
            
          case 'highlight_create':
            // Broadcast new highlight to other users
            Array.from(wss.clients).forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'highlight_added',
                  annotation: message.annotation,
                  noteId: message.noteId
                }));
              }
            });
            break;
            
          case 'chat_message':
            // Broadcast chat message after moderation
            const moderationResult = await moderateMessage(message.content);
            
            if (moderationResult.isAppropriate) {
              Array.from(wss.clients).forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'chat_message',
                    message: {
                      id: Math.random().toString(36),
                      content: message.content,
                      senderId: message.userId,
                      noteId: message.noteId,
                      timestamp: new Date().toISOString()
                    }
                  }));
                }
              });
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket disconnected');
    });
  });

  return httpServer;
}
