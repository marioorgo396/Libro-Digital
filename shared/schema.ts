import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const bookSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string(),
  description: z.string(),
  cover: z.string().nullable(),
  file: z.string(),
  license: z.string(),
});

export type Book = z.infer<typeof bookSchema>;

export const booksConfigSchema = z.object({
  books: z.array(bookSchema),
  instructions: z.object({
    es: z.string(),
  }).optional(),
});

export type BooksConfig = z.infer<typeof booksConfigSchema>;

export const highlightSchema = z.object({
  id: z.string(),
  pageNumber: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  color: z.string(),
  timestamp: z.number(),
  originalCanvasWidth: z.number(),
  originalCanvasHeight: z.number(),
});

export type Highlight = z.infer<typeof highlightSchema>;

export const highlightStorageSchema = z.object({
  pdfId: z.string(),
  highlights: z.array(highlightSchema),
});

export type HighlightStorage = z.infer<typeof highlightStorageSchema>;

export const textAnnotationSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  pageNumber: z.number(),
  content: z.string(),
  timestamp: z.number(),
});

export type TextAnnotation = z.infer<typeof textAnnotationSchema>;

export const annotationsStorageSchema = z.object({
  bookId: z.string(),
  annotations: z.array(textAnnotationSchema),
});

export type AnnotationsStorage = z.infer<typeof annotationsStorageSchema>;

export const examEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  description: z.string().optional(),
  bookIds: z.array(z.string()),
  timestamp: z.number(),
});

export type ExamEntry = z.infer<typeof examEntrySchema>;

export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', value: '#FBBF24', opacity: 0.3 },
  { name: 'Green', value: '#34D399', opacity: 0.3 },
  { name: 'Blue', value: '#60A5FA', opacity: 0.3 },
  { name: 'Pink', value: '#F472B6', opacity: 0.3 },
  { name: 'Purple', value: '#A78BFA', opacity: 0.3 },
  { name: 'Orange', value: '#FB923C', opacity: 0.3 },
] as const;

export const ZOOM_LEVELS = [
  { label: 'Ajustar ancho', value: 'fit-width' },
  { label: 'Ajustar página', value: 'fit-page' },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
  { label: '125%', value: 1.25 },
  { label: '150%', value: 1.5 },
  { label: '200%', value: 2 },
] as const;
