import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  recoveryKey: text("recovery_key").notNull(),
  encryptionKey: text("encryption_key").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const folders = pgTable("folders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  emoji: text("emoji"),
  parentId: varchar("parent_id"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  encryptedContent: text("encrypted_content"),
  isPinned: boolean("is_pinned").default(false).notNull(),
  folderId: varchar("folder_id").references(() => folders.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]).notNull(),
  wordCount: text("word_count").default("0").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFolderSchema = createInsertSchema(folders).pick({
  name: true,
  emoji: true,
  parentId: true,
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  content: true,
  folderId: true,
  tags: true,
  isPinned: true,
});

export const updateNoteSchema = insertNoteSchema.partial().extend({
  id: z.string(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const recoverySchema = z.object({
  username: z.string().min(1),
  recoveryKey: z.string().min(1),
  newPassword: z.string().min(6),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertFolder = z.infer<typeof insertFolderSchema>;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type RecoveryRequest = z.infer<typeof recoverySchema>;

export type User = typeof users.$inferSelect;
export type Folder = typeof folders.$inferSelect;
export type Note = typeof notes.$inferSelect;
