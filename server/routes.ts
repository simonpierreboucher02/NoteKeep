import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import crypto from "crypto";
import session from "express-session";
import { 
  insertUserSchema, 
  loginSchema, 
  recoverySchema,
  insertFolderSchema,
  insertNoteSchema,
  updateNoteSchema
} from "@shared/schema";

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    next();
  };

  // Auth routes
  app.post("/api/register", async (req, res) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      // Generate recovery key and encryption key
      const recoveryKey = crypto.randomBytes(32).toString('hex');
      const encryptionKey = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        username,
        password: hashedPassword,
        recoveryKey,
        encryptionKey
      });

      req.session.userId = user.id;
      
      // Explicitly save session and wait for completion
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      res.json({ 
        user: { id: user.id, username: user.username },
        recoveryKey,
        encryptionKey
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      
      // Explicitly save session and wait for completion
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      res.json({ 
        user: { id: user.id, username: user.username },
        encryptionKey: user.encryptionKey
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid login data" });
    }
  });

  app.post("/api/recover", async (req, res) => {
    try {
      const { username, recoveryKey, newPassword } = recoverySchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.recoveryKey !== recoveryKey) {
        return res.status(401).json({ error: "Invalid recovery credentials" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(user.id, hashedPassword);

      req.session.userId = user.id;

      res.json({ 
        user: { id: user.id, username: user.username },
        encryptionKey: user.encryptionKey
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid recovery data" });
    }
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ 
      user: { id: user.id, username: user.username },
      encryptionKey: user.encryptionKey
    });
  });

  // Folder routes
  app.get("/api/folders", requireAuth, async (req, res) => {
    const folders = await storage.getFoldersByUserId(req.session.userId!);
    res.json(folders);
  });

  app.post("/api/folders", requireAuth, async (req, res) => {
    try {
      const folderData = insertFolderSchema.parse(req.body);
      const folder = await storage.createFolder({
        ...folderData,
        userId: req.session.userId!
      });
      res.json(folder);
    } catch (error) {
      res.status(400).json({ error: "Invalid folder data" });
    }
  });

  app.put("/api/folders/:id", requireAuth, async (req, res) => {
    try {
      const folderData = insertFolderSchema.partial().parse(req.body);
      const folder = await storage.updateFolder(req.params.id, folderData);
      if (!folder) {
        return res.status(404).json({ error: "Folder not found" });
      }
      res.json(folder);
    } catch (error) {
      res.status(400).json({ error: "Invalid folder data" });
    }
  });

  app.delete("/api/folders/:id", requireAuth, async (req, res) => {
    await storage.deleteFolder(req.params.id);
    res.json({ success: true });
  });

  // Note routes
  app.get("/api/notes", requireAuth, async (req, res) => {
    const { folderId, search, pinned } = req.query;
    
    let notes;
    if (search) {
      notes = await storage.searchNotes(req.session.userId!, search as string);
    } else if (pinned === 'true') {
      notes = await storage.getPinnedNotes(req.session.userId!);
    } else if (folderId) {
      notes = await storage.getNotesByFolderId(folderId as string);
    } else {
      notes = await storage.getNotesByUserId(req.session.userId!);
    }
    
    res.json(notes);
  });

  app.get("/api/notes/:id", requireAuth, async (req, res) => {
    const note = await storage.getNote(req.params.id);
    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }
    res.json(note);
  });

  app.post("/api/notes", requireAuth, async (req, res) => {
    try {
      const noteData = insertNoteSchema.parse(req.body);
      // Convert "none" folder selection back to null for database
      if (noteData.folderId === "none") {
        noteData.folderId = undefined;
      }
      const note = await storage.createNote({
        ...noteData,
        userId: req.session.userId!
      });
      res.json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  app.put("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      // Convert "none" folder selection back to null for database
      if (body.folderId === "none") {
        body.folderId = undefined;
      }
      const noteData = updateNoteSchema.parse({ ...body, id: req.params.id });
      const note = await storage.updateNote(req.params.id, noteData);
      if (!note) {
        return res.status(404).json({ error: "Note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid note data" });
    }
  });

  app.delete("/api/notes/:id", requireAuth, async (req, res) => {
    await storage.deleteNote(req.params.id);
    res.json({ success: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
