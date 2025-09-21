import { type User, type InsertUser, type Folder, type InsertFolder, type Note, type InsertNote, type UpdateNote } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { recoveryKey: string; encryptionKey: string }): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<void>;

  // Folder operations
  getFoldersByUserId(userId: string): Promise<Folder[]>;
  getFolder(id: string): Promise<Folder | undefined>;
  createFolder(folder: InsertFolder & { userId: string }): Promise<Folder>;
  updateFolder(id: string, folder: Partial<InsertFolder>): Promise<Folder | undefined>;
  deleteFolder(id: string): Promise<void>;

  // Note operations
  getNotesByUserId(userId: string): Promise<Note[]>;
  getNotesByFolderId(folderId: string): Promise<Note[]>;
  getPinnedNotes(userId: string): Promise<Note[]>;
  searchNotes(userId: string, query: string): Promise<Note[]>;
  getNote(id: string): Promise<Note | undefined>;
  createNote(note: InsertNote & { userId: string }): Promise<Note>;
  updateNote(id: string, note: Partial<UpdateNote>): Promise<Note | undefined>;
  deleteNote(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private folders: Map<string, Folder>;
  private notes: Map<string, Note>;

  constructor() {
    this.users = new Map();
    this.folders = new Map();
    this.notes = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser & { recoveryKey: string; encryptionKey: string }): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPassword(id: string, password: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, password });
    }
  }

  // Folder operations
  async getFoldersByUserId(userId: string): Promise<Folder[]> {
    return Array.from(this.folders.values()).filter(
      (folder) => folder.userId === userId
    );
  }

  async getFolder(id: string): Promise<Folder | undefined> {
    return this.folders.get(id);
  }

  async createFolder(insertFolder: InsertFolder & { userId: string }): Promise<Folder> {
    const id = randomUUID();
    const folder: Folder = { 
      ...insertFolder, 
      id, 
      parentId: insertFolder.parentId || null,
      emoji: insertFolder.emoji || null,
      createdAt: new Date() 
    };
    this.folders.set(id, folder);
    return folder;
  }

  async updateFolder(id: string, update: Partial<InsertFolder>): Promise<Folder | undefined> {
    const folder = this.folders.get(id);
    if (folder) {
      const updated = { ...folder, ...update };
      this.folders.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteFolder(id: string): Promise<void> {
    this.folders.delete(id);
    // Also delete all notes in this folder
    const notesToDelete = Array.from(this.notes.values()).filter(
      (note) => note.folderId === id
    );
    notesToDelete.forEach(note => this.notes.delete(note.id));
  }

  // Note operations
  async getNotesByUserId(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.userId === userId
    ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getNotesByFolderId(folderId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.folderId === folderId
    ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getPinnedNotes(userId: string): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(
      (note) => note.userId === userId && note.isPinned
    ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async searchNotes(userId: string, query: string): Promise<Note[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.notes.values()).filter(
      (note) => note.userId === userId && (
        note.title.toLowerCase().includes(lowercaseQuery) ||
        note.content.toLowerCase().includes(lowercaseQuery) ||
        note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      )
    ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getNote(id: string): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote & { userId: string }): Promise<Note> {
    const id = randomUUID();
    const now = new Date();
    const wordCount = insertNote.content.split(/\s+/).filter(word => word.length > 0).length.toString();
    const note: Note = { 
      title: insertNote.title,
      content: insertNote.content,
      tags: (insertNote.tags as string[]) || [],
      isPinned: insertNote.isPinned || false,
      folderId: insertNote.folderId || null,
      userId: insertNote.userId,
      id,
      wordCount,
      encryptedContent: null,
      createdAt: now,
      updatedAt: now
    };
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: string, update: Partial<UpdateNote>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (note) {
      const wordCount = update.content 
        ? update.content.split(/\s+/).filter(word => word.length > 0).length.toString()
        : note.wordCount;
      
      const updated: Note = { 
        ...note, 
        title: update.title !== undefined ? update.title : note.title,
        content: update.content !== undefined ? update.content : note.content,
        tags: update.tags !== undefined ? (update.tags as string[]) : note.tags,
        isPinned: update.isPinned !== undefined ? update.isPinned : note.isPinned,
        folderId: update.folderId !== undefined ? update.folderId : note.folderId,
        wordCount,
        updatedAt: new Date() 
      };
      this.notes.set(id, updated);
      return updated;
    }
    return undefined;
  }

  async deleteNote(id: string): Promise<void> {
    this.notes.delete(id);
  }
}

export const storage = new MemStorage();
