import { z } from 'zod';
import { insertArticleSchema, insertCommentSchema, insertReactionSchema, articles } from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  articles: {
    list: {
      method: 'GET' as const,
      path: '/api/articles' as const,
      input: z.object({
        category: z.string().optional(),
        isFeatured: z.string().optional(),
        trending: z.string().optional(),
        search: z.string().optional()
      }).optional(),
      responses: { 200: z.any() },
    },
    get: {
      method: 'GET' as const,
      path: '/api/articles/:id' as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    create: {
      method: 'POST' as const,
      path: '/api/articles' as const,
      input: insertArticleSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation, 401: errorSchemas.unauthorized },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/articles/:id' as const,
      input: insertArticleSchema.partial(),
      responses: { 200: z.any(), 400: errorSchemas.validation, 404: errorSchemas.notFound },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/articles/:id' as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
    incrementView: {
      method: 'POST' as const,
      path: '/api/articles/:id/view' as const,
      responses: { 200: z.any() },
    },
  },
  comments: {
    list: {
      method: 'GET' as const,
      path: '/api/articles/:articleId/comments' as const,
      responses: { 200: z.any() },
    },
    create: {
      method: 'POST' as const,
      path: '/api/articles/:articleId/comments' as const,
      input: z.object({ content: z.string() }),
      responses: { 201: z.any(), 401: errorSchemas.unauthorized },
    },
  },
  reactions: {
    list: {
      method: 'GET' as const,
      path: '/api/articles/:articleId/reactions' as const,
      responses: { 200: z.any() },
    },
    toggle: {
      method: 'POST' as const,
      path: '/api/articles/:articleId/reactions' as const,
      input: z.object({ type: z.string() }),
      responses: { 200: z.any(), 401: errorSchemas.unauthorized },
    },
  },
  ai: {
    chat: {
      method: 'POST' as const,
      path: '/api/ai/chat' as const,
      input: z.object({ 
        message: z.string(), 
        personality: z.string().optional(),
        articleContextId: z.number().optional() 
      }),
      responses: { 200: z.object({ reply: z.string() }) },
    },
  },
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register' as const,
      input: z.object({
        name: z.string(),
        username: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
        confirmPassword: z.string().min(6),
      }),
      responses: { 201: z.any(), 400: errorSchemas.validation },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: { 200: z.any(), 401: errorSchemas.unauthorized },
    },
    adminLogin: {
      method: 'POST' as const,
      path: '/api/admin-login' as const,
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: { 200: z.any(), 401: errorSchemas.unauthorized },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
