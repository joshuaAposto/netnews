import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export { users, type User, insertUserSchema, type InsertUser } from "./models/auth";

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(), // Politics, Entertainment, Technology, Sports, Local News, Video
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  isFeatured: boolean("is_featured").default(false),
  viewCount: integer("view_count").default(0),
  authorId: varchar("author_id").notNull(),
  sourceUrl: text("source_url"),
  sourceName: text("source_name"),
  slug: text("slug").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  userId: varchar("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reactions = pgTable("reactions", {
  id: serial("id").primaryKey(),
  articleId: integer("article_id").notNull().references(() => articles.id),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // Like, Heart, etc.
});

export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true, viewCount: true }).extend({
  videoUrl: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true, userId: true });
export const insertReactionSchema = createInsertSchema(reactions).omit({ id: true });

export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Reaction = typeof reactions.$inferSelect;
export type InsertReaction = z.infer<typeof insertReactionSchema>;

export type CreateArticleRequest = InsertArticle;
export type UpdateArticleRequest = Partial<InsertArticle>;

export type CommentWithUser = Comment & { user?: { firstName: string | null; lastName: string | null; profileImageUrl: string | null; email: string | null } };
export type ArticleResponse = Article & { author?: { firstName: string | null; lastName: string | null; profileImageUrl: string | null; email: string | null } };
