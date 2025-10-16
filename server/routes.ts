import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { moderateMessage, answerQuestionWithPdf } from "./services/openai";
import {
  insertUserSchema,
  insertNoteSchema,
  insertStudyGroupSchema,
  insertMessageSchema,
  insertAnnotationSchema,
  insertUserApprovalSchema,
  insertContentModerationLogSchema,
  insertNotificationSchema,
} from "@shared/schema";
import multer from "multer";
import path from "path";
import { z } from "zod";
import { sessionManager } from "./sessionManager";
import "./types"; // Import type extensions
// MongoDB imports removed - using storage layer instead

// Configure multer for file uploads (preserve extension for correct MIME serving)
const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, "uploads/"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9-_]+/gi, "_");
    const name = `${base}-${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedTypes = [
      ".pdf",
      ".ppt",
      ".pptx",
      ".doc",
      ".docx",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowedTypes.includes(ext));
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check: database connectivity
  app.get("/api/health/db", async (_req, res) => {
    try {
      // Test MongoDB connection by getting a user count
      const userCount = await storage.getAllUsers();
      res.json({ ok: true, userCount: userCount.length });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || String(err) });
    }
  });
  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    const user = sessionManager.getSession(sessionId || "");

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  };

  const requireRole =
    (role: string) => (req: Request, res: Response, next: NextFunction) => {
      if (req.user?.role !== role) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    };

  const requireAdmin = requireRole("admin");

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);

      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const sessionId = sessionManager.createSession(user);

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

      const sessionId = sessionManager.createSession(user);

      res.json({ user: { ...user, password: undefined }, sessionId });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", requireAuth, (req: any, res) => {
    const sessionId = req.headers.authorization?.replace("Bearer ", "");
    sessionManager.deleteSession(sessionId || "");
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    res.json({ ...req.user, password: undefined });
  });

  // User routes
  app.get("/api/users/teachers", requireAuth, async (req, res) => {
    try {
      const allUsers = await storage.getAllNotes(); // Get all notes first
      const teacherIds = [...new Set(allUsers.map((note) => note.teacherId))];
      const teachers = await Promise.all(
        teacherIds.map((id) => storage.getUser(id))
      );

      res.json(
        teachers.filter(Boolean).map((teacher) => ({
          ...teacher,
          password: undefined,
        }))
      );
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
            teacher: teacher ? { ...teacher, password: undefined } : null,
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
        teacher: teacher ? { ...teacher, password: undefined } : null,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const noteId = req.params.id;
      const note = await storage.getNote(noteId);
      if (!note) {
        return res.status(404).json({ message: "Note not found" });
      }

      // Check if user has permission to edit (teacher who created it or admin)
      if (note.teacherId !== req.user.id && req.user.role !== "admin") {
        return res
          .status(403)
          .json({ message: "Forbidden: not authorized to edit this note" });
      }

      const updates = req.body;
      // Convert content string to proper format if needed
      if (updates.content && typeof updates.content === "string") {
        updates.content = { html: updates.content };
      }
      const updatedNote = await storage.updateNote(noteId, updates);

      if (!updatedNote) {
        return res.status(404).json({ message: "Note not found" });
      }

      res.json(updatedNote);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post(
    "/api/notes",
    requireAuth,
    requireRole("teacher"),
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        const normalizedPath = req.file?.path
          ? String(req.file.path).replace(/\\/g, "/")
          : undefined;
        const noteData = insertNoteSchema.parse({
          ...req.body,
          teacherId: req.user.id,
          fileUrl: normalizedPath,
          fileName: req.file?.originalname,
          fileType: req.file?.mimetype || "application/octet-stream",
        });

        const note = await storage.createNote(noteData);
        res.json(note);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.put(
    "/api/notes/:id",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        const note = await storage.getNote(req.params.id);
        if (!note || note.teacherId !== req.user.id) {
          return res.status(404).json({ message: "Note not found" });
        }

        const updatedNote = await storage.updateNote(req.params.id, req.body);
        res.json(updatedNote);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  app.delete(
    "/api/notes/:id",
    requireAuth,
    requireRole("teacher"),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        const note = await storage.getNote(req.params.id);
        if (!note || note.teacherId !== req.user.id) {
          return res.status(404).json({ message: "Note not found" });
        }

        await storage.deleteNote(req.params.id);
        res.json({ message: "Note deleted successfully" });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

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
            onlineNow: Math.floor(Math.random() * members.length), // Mock online count
          };
        })
      );

      res.json(groupsWithMembers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Group notes
  app.get("/api/groups/:groupId/notes", requireAuth, async (req, res) => {
    try {
      const { groupId } = req.params;

      // Enforce membership: only members of the group can see group notes
      const members = await storage.getGroupMembers(groupId);
      if (!members.includes(req.user!.id)) {
        return res
          .status(403)
          .json({ message: "Forbidden: not a group member" });
      }

      const all = await storage.getAllNotes();
      const groupNotes = all.filter((n: any) => n.groupId === groupId);
      res.json(groupNotes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post(
    "/api/groups/:groupId/notes",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "User not authenticated" });
        }
        const { groupId } = req.params;

        // Enforce membership: only members can upload into a group
        const members = await storage.getGroupMembers(groupId);
        if (!members.includes(req.user.id)) {
          return res
            .status(403)
            .json({ message: "Forbidden: not a group member" });
        }

        const filePath = req.file?.path
          ? String(req.file.path).replace(/\\/g, "/")
          : undefined;
        const noteData = insertNoteSchema.parse({
          title: req.body.title || (req.file?.originalname ?? "Untitled"),
          description: req.body.description,
          teacherId: req.user.id, // uploader id; not strictly teacher in group context
          fileUrl: filePath,
          fileName: req.file?.originalname,
          fileType: req.file?.mimetype || "application/octet-stream",
          groupId,
        } as any);

        const note = await storage.createNote(noteData as any);
        res.json(note);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  // Collaborative documents
  app.post("/api/groups/:groupId/documents", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const { groupId } = req.params;
      const { content } = req.body;

      // Enforce membership: only members can save collaborative documents
      const members = await storage.getGroupMembers(groupId);
      if (!members.includes(req.user.id)) {
        return res
          .status(403)
          .json({ message: "Forbidden: not a group member" });
      }

      // Create or update collaborative document
      const noteData = insertNoteSchema.parse({
        title: "Collaborative Document",
        description: "Real-time collaborative document",
        teacherId: req.user.id,
        content: content,
        fileType: "text/html",
        groupId,
      } as any);

      // Check if collaborative document already exists for this group
      const existingNotes = await storage.getAllNotes();
      const existingDoc = existingNotes.find(
        (n: any) =>
          n.groupId === groupId && n.title === "Collaborative Document"
      );

      let note;
      if (existingDoc) {
        // Update existing document
        note = await storage.updateNote(existingDoc.id, { content } as any);
      } else {
        // Create new document
        note = await storage.createNote(noteData as any);
      }

      res.json(note);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/study-groups", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const groupData = insertStudyGroupSchema.parse({
        ...req.body,
        creatorId: req.user.id,
      });

      const group = await storage.createStudyGroup(groupData);
      res.json(group);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Current user's joined study groups
  app.get("/api/my/study-groups", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const groups = await storage.getUserGroups(req.user.id);
      res.json(groups);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/study-groups/:id/join", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const success = await storage.joinStudyGroup(req.params.id, req.user.id);
      res.json({ success });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Messages routes
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      const { noteId, groupId } = req.query as {
        noteId?: string;
        groupId?: string;
      };

      // If requesting group messages, enforce membership
      if (groupId) {
        const members = await storage.getGroupMembers(groupId);
        if (!members.includes(req.user!.id)) {
          return res
            .status(403)
            .json({ message: "Forbidden: not a group member" });
        }
      }

      const messages = await storage.getMessages(noteId, groupId);

      // Add sender info
      const messagesWithSender = await Promise.all(
        messages.map(async (message) => {
          const sender = await storage.getUser(message.senderId);
          return {
            ...message,
            sender: sender ? { ...sender, password: undefined } : null,
          };
        })
      );

      res.json(messagesWithSender);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post(
    "/api/messages",
    requireAuth,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: "User not authenticated" });
        }

        // If posting to a group, enforce membership
        if (
          req.body?.groupId &&
          req.body.groupId !== "undefined" &&
          req.body.groupId !== "null"
        ) {
          const members = await storage.getGroupMembers(
            String(req.body.groupId)
          );
          if (!members.includes(req.user.id)) {
            return res
              .status(403)
              .json({ message: "Forbidden: not a group member" });
          }
        }

        // Ensure content exists even for file-only messages
        const rawBody: any = { ...req.body };
        const file = (req as any).file as Express.Multer.File | undefined;
        const contentField =
          rawBody.content ?? rawBody.message ?? rawBody.text ?? undefined;
        if (
          contentField === undefined ||
          contentField === null ||
          contentField === "undefined" ||
          contentField === "null" ||
          String(contentField).trim() === ""
        ) {
          rawBody.content = file?.originalname || "Attachment";
        } else {
          rawBody.content = String(contentField);
        }

        // Normalize optional ids coming from multipart forms
        if (rawBody.groupId === "undefined" || rawBody.groupId === "null") {
          delete rawBody.groupId;
        }
        if (rawBody.noteId === "undefined" || rawBody.noteId === "null") {
          delete rawBody.noteId;
        }

        let messageData;
        try {
          messageData = insertMessageSchema.parse({
            ...rawBody,
            senderId: req.user.id,
          });
        } catch (e: any) {
          // Fallback: if validation failed because content was missing, coerce it again
          if (!rawBody.content) {
            rawBody.content = file?.originalname || "Attachment";
          }
          messageData = insertMessageSchema.parse({
            ...rawBody,
            senderId: req.user.id,
          });
        }

        // If file is uploaded, augment payload
        // file defined above
        const augmented = {
          ...messageData,
          fileUrl: file?.path
            ? String(file.path).replace(/\\/g, "/")
            : undefined,
          fileName: file?.originalname,
          fileType: file?.mimetype,
        } as any;

        const message = await storage.createMessage(augmented);

        // Moderate the message
        const moderationResult = await moderateMessage(message.content);
        await storage.updateMessageModeration(message.id, moderationResult);

        const sender = await storage.getUser(message.senderId);
        const responseMessage = {
          ...message,
          moderationResult,
          sender: sender ? { ...sender, password: undefined } : null,
        };

        res.json(responseMessage);
      } catch (error: any) {
        res.status(400).json({ message: error.message });
      }
    }
  );

  // AI chat with PDF context for a note
  app.post("/api/ai/answer", requireAuth, async (req, res) => {
    try {
      const { noteId, question } = req.body || {};
      if (!question || !noteId) {
        return res
          .status(400)
          .json({ message: "noteId and question are required" });
      }

      const note = await storage.getNote(String(noteId));
      if (!note) return res.status(404).json({ message: "Note not found" });

      const answer = await answerQuestionWithPdf(
        String(question),
        (note as any).fileUrl
      );
      res.json({ answer });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
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
            user: user ? { ...user, password: undefined } : null,
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
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const annotationData = insertAnnotationSchema.parse({
        ...req.body,
        userId: req.user.id,
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
            user: user ? { ...user, password: undefined } : null,
          };
        })
      );

      res.json(sessionsWithUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get(
    "/api/admin/users/:role",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const { role } = req.params;
        const users = await storage.getUsersByRole(role);
        res.json(users);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post(
    "/api/admin/users/:id/approve",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { reason } = req.body;

        // Log the approval action
        await storage.createModerationLog({
          contentType: "user",
          contentId: id,
          adminId: req.user!.id,
          action: "approved",
          reason: reason || "User approved by administrator",
        });

        res.json({ message: "User approved successfully" });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post(
    "/api/admin/users/:id/reject",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { reason } = req.body;

        // Log the rejection action
        await storage.createModerationLog({
          contentType: "user",
          contentId: id,
          adminId: req.user!.id,
          action: "rejected",
          reason: reason || "User rejected by administrator",
        });

        res.json({ message: "User rejected successfully" });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get(
    "/api/admin/user-approvals",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const { status } = req.query;
        const approvals = await storage.getUserApprovals(status as string);
        res.json(approvals);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get(
    "/api/admin/moderation-logs",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const logs = await storage.getModerationLogs(req.user!.id);
        res.json(logs);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post(
    "/api/admin/content/flag",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      try {
        const { contentType, contentId, reason } = req.body;

        const log = await storage.createModerationLog({
          contentType,
          contentId,
          adminId: req.user!.id,
          action: "flagged",
          reason,
        });

        res.json(log);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const notifications = await storage.getUserNotifications(req.user.id);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const count = await storage.getUnreadNotificationCount(req.user.id);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteNotification(req.params.id);
      if (deleted) {
        res.json({ message: "Notification deleted" });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  // Track simple connection context for room scoping
  const wsContext = new Map<
    WebSocket,
    { userId?: string; noteId?: string; groupId?: string }
  >();

  wss.on("connection", (ws: WebSocket, req) => {
    console.log("WebSocket connected");
    wsContext.set(ws, {});

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Handle different message types
        switch (message.type) {
          case "join_room":
            // Join a note room for real-time collaboration
            wsContext.set(ws, {
              ...(wsContext.get(ws) || {}),
              noteId: message.noteId,
              userId: message.userId,
            });
            ws.send(
              JSON.stringify({
                type: "room_joined",
                room: message.noteId,
              })
            );
            break;

          case "join_group":
            // Acknowledge joining a group chat context (broadcast filtering happens client-side)
            wsContext.set(ws, {
              ...(wsContext.get(ws) || {}),
              groupId: message.groupId,
              userId: message.userId,
            });
            ws.send(
              JSON.stringify({
                type: "group_joined",
                groupId: message.groupId,
              })
            );
            break;

          case "cursor_move":
            // Broadcast cursor position to other users in the same note
            Array.from(wss.clients).forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                const ctx = wsContext.get(client);
                if (ctx?.noteId === message.noteId) {
                  client.send(
                    JSON.stringify({
                      type: "cursor_update",
                      userId: message.userId,
                      position: message.position,
                      noteId: message.noteId,
                    })
                  );
                }
              }
            });
            break;

          case "highlight_create":
            // Broadcast new highlight to other users
            Array.from(wss.clients).forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                const ctx = wsContext.get(client);
                if (ctx?.noteId === message.noteId) {
                  client.send(
                    JSON.stringify({
                      type: "highlight_added",
                      annotation: message.annotation,
                      noteId: message.noteId,
                    })
                  );
                }
              }
            });
            break;

          case "chat_message":
            // Broadcast chat message after moderation
            const moderationResult = await moderateMessage(message.content);

            if (moderationResult.isAppropriate) {
              Array.from(wss.clients).forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  const ctx = wsContext.get(client);
                  if (ctx?.noteId === message.noteId) {
                    client.send(
                      JSON.stringify({
                        type: "chat_message",
                        message: {
                          id: Math.random().toString(36),
                          content: message.content,
                          senderId: message.userId,
                          noteId: message.noteId,
                          timestamp: new Date().toISOString(),
                        },
                      })
                    );
                  }
                }
              });
            }
            break;

          case "group_chat_message":
            // Broadcast group chat message after moderation
            const groupModeration = await moderateMessage(message.content);

            if (groupModeration.isAppropriate) {
              Array.from(wss.clients).forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  const ctx = wsContext.get(client);
                  if (ctx?.groupId === message.groupId) {
                    client.send(
                      JSON.stringify({
                        type: "group_chat_message",
                        message: {
                          id: Math.random().toString(36),
                          content: message.content,
                          senderId: message.userId,
                          groupId: message.groupId,
                          fileUrl: message.fileUrl,
                          fileName: message.fileName,
                          fileType: message.fileType,
                          timestamp: new Date().toISOString(),
                        },
                      })
                    );
                  }
                }
              });
            }
            break;

          // Basic WebRTC signaling relay
          case "webrtc_offer":
          case "webrtc_answer":
          case "webrtc_ice": {
            const { targetUserId } = message;
            Array.from(wss.clients).forEach((client) => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                const ctx = wsContext.get(client);
                // If a target is specified, route to that user only, else route to same note/group
                const sameScope =
                  (!!message.noteId && ctx?.noteId === message.noteId) ||
                  (!!message.groupId && ctx?.groupId === message.groupId);
                if (
                  (targetUserId && ctx?.userId === targetUserId) ||
                  (!targetUserId && sameScope)
                ) {
                  client.send(JSON.stringify(message));
                }
              }
            });
            break;
          }
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket disconnected");
      wsContext.delete(ws);
    });
  });

  return httpServer;
}
