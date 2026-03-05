import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { 
  articles, 
  comments, 
  reactions,
  type InsertArticle,
  type InsertComment,
  type InsertReaction,
  type Article,
  type Comment,
  type Reaction,
  users,
  type User,
  type InsertUser
} from "@shared/schema";

export interface IStorage {
  // Articles
  getArticles(params?: { category?: string, isFeatured?: string, trending?: string, search?: string }): Promise<Article[]>;
  getArticle(id: number): Promise<Article | undefined>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article>;
  deleteArticle(id: number): Promise<void>;
  incrementArticleView(id: number): Promise<void>;

  // Comments
  getComments(articleId: number): Promise<any[]>;
  createComment(comment: InsertComment & { userId: string }): Promise<Comment>;

  // Reactions
  getReactions(articleId: number): Promise<Reaction[]>;
  toggleReaction(reaction: InsertReaction & { userId: string }): Promise<Reaction | { removed: true }>;

  // Users
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updateData: any): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getUserByEmail(email: string) {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0];
  }

  async getUserByUsername(username: string) {
    const results = await db.select().from(users).where(eq(users.username, username));
    return results[0];
  }

  async createUser(insertUser: InsertUser) {
    const results = await db.insert(users).values({
      name: insertUser.name,
      username: insertUser.username,
      email: insertUser.email,
      password: insertUser.password,
      role: insertUser.role || 'user',
    }).returning();
    return results[0];
  }

  async getArticles(params?: { category?: string, isFeatured?: string, trending?: string, search?: string }) {
    const results = await db.select().from(articles).orderBy(desc(articles.createdAt));

    return results.filter(a => {
      if (params?.category && a.category !== params.category) return false;
      if (params?.isFeatured === 'true' && !a.isFeatured) return false;
      if (params?.search) {
        const q = params.search.toLowerCase();
        if (!a.title.toLowerCase().includes(q) && !a.content.toLowerCase().includes(q)) return false;
      }
      if (params?.category === 'Video' && !a.videoUrl) return false;
      return true;
    }).sort((a, b) => {
      if (params?.trending === 'true') {
        return (b.viewCount || 0) - (a.viewCount || 0);
      }
      return 0;
    });
  }

  async getArticle(idOrSlug: string | number) {
    try {
      let query = db.select().from(articles);
      if (typeof idOrSlug === 'number' || !isNaN(Number(idOrSlug))) {
        query = query.where(eq(articles.id, Number(idOrSlug)));
      } else {
        query = query.where(eq(articles.slug, String(idOrSlug)));
      }
      const results = await query;
      return results[0];
    } catch (error) {
      console.error(`Error fetching article ${idOrSlug}:`, error);
      return undefined;
    }
  }

  async createArticle(insertArticle: InsertArticle) {
    const slug = insertArticle.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

    const results = await db.insert(articles).values({
      title: insertArticle.title,
      content: insertArticle.content,
      category: insertArticle.category,
      imageUrl: insertArticle.imageUrl ?? null,
      videoUrl: insertArticle.videoUrl ?? null,
      isFeatured: insertArticle.isFeatured ?? false,
      authorId: insertArticle.authorId,
      sourceUrl: insertArticle.sourceUrl ?? null,
      sourceName: insertArticle.sourceName ?? null,
      slug: slug,
    }).returning();
    return results[0];
  }

  async updateArticle(id: number, updateData: Partial<InsertArticle>) {
    const results = await db.update(articles).set({
      ...(updateData.title !== undefined && { title: updateData.title }),
      ...(updateData.content !== undefined && { content: updateData.content }),
      ...(updateData.category !== undefined && { category: updateData.category }),
      ...(updateData.imageUrl !== undefined && { imageUrl: updateData.imageUrl }),
      ...(updateData.videoUrl !== undefined && { videoUrl: updateData.videoUrl }),
      ...(updateData.isFeatured !== undefined && { isFeatured: updateData.isFeatured }),
    }).where(eq(articles.id, id)).returning();
    if (!results[0]) throw new Error("Article not found");
    return results[0];
  }

  async deleteArticle(id: number) {
    await db.delete(articles).where(eq(articles.id, id));
  }

  async incrementArticleView(id: number) {
    await db.update(articles).set({ viewCount: sql`${articles.viewCount} + 1` }).where(eq(articles.id, id));
  }

  async getComments(articleId: number) {
    const results = await db.select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      userName: users.name,
      userProfileImageUrl: users.profileImageUrl,
    })
      .from(comments)
      .leftJoin(users, sql`${comments.userId} = ${users.id}::text`)
      .where(eq(comments.articleId, articleId))
      .orderBy(desc(comments.createdAt));

    return results.map(c => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      user: {
        name: c.userName,
        profileImageUrl: c.userProfileImageUrl,
      }
    }));
  }

  async createComment(insertComment: InsertComment & { userId: string }) {
    const results = await db.insert(comments).values({
      articleId: insertComment.articleId,
      userId: insertComment.userId,
      content: insertComment.content,
    }).returning();
    return results[0];
  }

  async updateUser(id: number, updateData: any) {
    const results = await db.update(users).set({
      name: updateData.name,
      profileImageUrl: updateData.profileImageUrl,
    }).where(eq(users.id, id)).returning();
    if (!results[0]) throw new Error("User not found");
    return results[0];
  }

  async getReactions(articleId: number) {
    return db.select().from(reactions).where(eq(reactions.articleId, articleId));
  }

  async toggleReaction(insertReaction: InsertReaction & { userId: string }) {
    const existing = await db.select().from(reactions).where(
      and(
        eq(reactions.articleId, insertReaction.articleId),
        eq(reactions.userId, insertReaction.userId),
        eq(reactions.type, insertReaction.type)
      )
    );

    if (existing.length > 0) {
      await db.delete(reactions).where(eq(reactions.id, existing[0].id));
      return { removed: true as const };
    } else {
      const results = await db.insert(reactions).values({
        articleId: insertReaction.articleId,
        userId: insertReaction.userId,
        type: insertReaction.type,
      }).returning();
      return results[0];
    }
  }
}

export const storage = new DatabaseStorage();
