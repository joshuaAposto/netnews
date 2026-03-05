import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import bcrypt from "bcrypt";
import { insertArticleSchema, insertUserSchema } from "@shared/schema";
import { db, initDb } from "./db";
import { sql } from "drizzle-orm";
import fetch from "node-fetch";

const CHATPLUS_URL = "https://chatplus.com/api/chat";
const CHATPLUS_HEADERS = {
  "Host": "chatplus.com",
  "sec-ch-ua": '"Chromium";v="137", "Not/A)Brand";v="24"',
  "sec-ch-ua-platform": '"Android"',
  "sec-ch-ua-mobile": "?1",
  "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
  "Content-Type": "application/json",
  "Accept": "*/*",
  "Origin": "https://chatplus.com",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Dest": "empty",
  "Referer": "https://chatplus.com/",
  "Accept-Language": "en-PH,en-US;q=0.9,en;q=0.8"
};

// Auth middleware placeholder
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/auth/user", async (req, res) => {
    const session = req.session as any;
    if (session && session.userId) {
      // Special handling for static admin
      if (session.username === "admin" && session.userId === 1000000) {
        return res.json({
          id: 1000000,
          username: "admin",
          role: "admin",
          name: "Admin User",
          profileImageUrl: null
        });
      }

      const user = await storage.getUserByUsername(session.username);
      if (!user) return res.status(401).json({ message: "Not logged in" });
      return res.json({ 
        id: user.id, 
        username: user.username, 
        role: user.role,
        name: user.name,
        profileImageUrl: user.profileImageUrl 
      });
    }
    res.status(401).json({ message: "Not logged in" });
  });

  app.post("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const { name, profileImageUrl } = req.body;
      const user = await storage.updateUser((req.session as any).userId, { name, profileImageUrl });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const { name, username, email, password, confirmPassword } = req.body;

      if (!name || !username || !email || !password || !confirmPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        name,
        username,
        email,
        password: hashedPassword,
        role: "user"
      });

      // @ts-ignore
      (req.session as any).userId = user.id;
      // @ts-ignore
      (req.session as any).username = user.username;
      // @ts-ignore
      (req.session as any).role = user.role;

      res.status(201).json({ 
        message: "User registered successfully",
        user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role }
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ message: "Internal error during registration" });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username/Email and password are required" });
      }

      let user;
      if (username.includes("@")) {
        user = await storage.getUserByEmail(username);
      } else {
        user = await storage.getUserByUsername(username);
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // @ts-ignore
      (req.session as any).userId = user.id;
      // @ts-ignore
      (req.session as any).username = user.username;
      // @ts-ignore
      (req.session as any).role = user.role;

      res.json({ message: "Login successful", user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ message: "Internal error during login" });
    }
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.clearCookie('connect.sid'); // Clear the session cookie
      res.redirect("/"); // Redirect to home page after logout
    });
  });

  app.post("/api/admin/articles", isAuthenticated, async (req: any, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access only" });
      }
      const input = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle({ ...input, authorId: String((req.session as any).userId) });
      res.status(201).json(article);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post("/api/admin-login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (username === "admin" && password === "joshua") {
        const session = req.session as any;
        session.userId = 1000000; // Use a high number for static admin ID
        session.username = "admin";
        session.role = "admin";
        
        // Ensure session is saved before responding
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Failed to save session" });
          }
          res.json({ 
            message: "Admin login successful", 
            user: { id: 1000000, username: "admin", role: "admin" }
          });
        });
        return;
      }
      res.status(401).json({ message: "Unauthorized: Invalid admin credentials" });
    } catch (err) {
      console.error("Admin login error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Articles
  app.get(api.articles.list.path, async (req, res) => {
    try {
      const articles = await storage.getArticles(req.query);
      res.json(articles);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.get(api.articles.get.path, async (req, res) => {
    try {
      const idOrSlug = req.params.id;
      const article = await storage.getArticle(idOrSlug);
      if (!article) return res.status(404).json({ message: 'Not found' });
      res.json(article);
    } catch (err) {
      console.error("Error fetching article:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.articles.create.path, isAuthenticated, async (req: any, res) => {
    try {
      if (req.session.role !== "admin") {
        return res.status(403).json({ message: "Forbidden: Admin access only" });
      }
      const input = api.articles.create.input.parse(req.body);
      const article = await storage.createArticle({ ...input, authorId: String((req.session as any).userId) });
      res.status(201).json(article);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.put(api.articles.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.articles.update.input.parse(req.body);
      const article = await storage.updateArticle(Number(req.params.id), input);
      res.json(article);
    } catch (err) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.delete(api.articles.delete.path, isAuthenticated, async (req, res) => {
    try {
      await storage.deleteArticle(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.articles.incrementView.path, async (req, res) => {
    try {
      const articleId = Number(req.params.id);
      const session = req.session as any;

      if (!session.viewedArticles) {
        session.viewedArticles = [];
      }

      if (!session.viewedArticles.includes(articleId)) {
        await storage.incrementArticleView(articleId);
        session.viewedArticles.push(articleId);
        req.session.save();
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  // Comments
  app.get(api.comments.list.path, async (req, res) => {
    try {
      const comments = await storage.getComments(Number(req.params.articleId));
      res.json(comments);
    } catch (err) {
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.comments.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ message: "Content is required" });
      }
      const comment = await storage.createComment({
        content: content,
        articleId: Number(req.params.articleId),
        userId: String((req.session as any).userId)
      });
      res.status(201).json(comment);
    } catch (err) {
      console.error("Create comment error:", err);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Reactions
  app.get(api.reactions.list.path, async (req, res) => {
    try {
      const reactions = await storage.getReactions(Number(req.params.articleId));
      res.json(reactions);
    } catch (err) {
      console.error("Get reactions error:", err);
      res.status(500).json({ message: "Internal error" });
    }
  });

  app.post(api.reactions.toggle.path, isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.body;
      if (!type) {
        return res.status(400).json({ message: "Type is required" });
      }
      const result = await storage.toggleReaction({
        type: type,
        articleId: Number(req.params.articleId),
        userId: String((req.session as any).userId)
      });
      res.json(result);
    } catch (err) {
      console.error("Toggle reaction error:", err);
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // AI Chat
  app.post(api.ai.chat.path, async (req, res) => {
    try {
      const { message, personality, articleContextId } = req.body;
      let systemPrompt = "You are a helpful AI assistant for a news platform.";
      
      if (personality) {
        systemPrompt += ` Your personality is: ${personality}.`;
      }
      
      let contextMsg = "";
      if (articleContextId) {
        const article = await storage.getArticle(Number(articleContextId));
        if (article) {
          contextMsg = `Context - The user is currently reading this news article titled "${article.title}". Content: ${article.content.substring(0, 1000)}...`;
        }
      }

      const chatMessages = [
        { role: "system", content: systemPrompt },
        ...(contextMsg ? [{ role: "system", content: contextMsg }] : []),
        { 
          role: "user", 
          content: message,
          parts: [{ type: "text", text: message }]
        }
      ];

      const response = await fetch(CHATPLUS_URL, {
        method: "POST",
        headers: CHATPLUS_HEADERS,
        body: JSON.stringify({
          id: "guest",
          messages: chatMessages,
          selectedChatModelId: "gpt-4o-mini",
          token: null
        })
      });

      if (!response.ok) {
        throw new Error(`ChatPlus API error: ${response.statusText}`);
      }

      const text = await response.text();
      let fullResponse = "";
      const lines = text.split("\n");
      
      for (const line of lines) {
        if (line.startsWith('0:"')) {
          const contentMatch = line.match(/^0:"(.*)"$/);
          if (contentMatch) {
            let content = contentMatch[1];
            content = content.replace(/\\"/g, '"')
                           .replace(/\\n/g, '\n')
                           .replace(/\\\\/g, '\\');
            fullResponse += content;
          }
        }
      }

      res.json({ reply: fullResponse || "I'm sorry, I couldn't generate a response." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to generate AI response" });
    }
  });

  async function seed() {
    try {
      const existingArticles = await storage.getArticles();
      if (existingArticles.length === 0) {
        console.log("No initial articles to seed.");
      }
    } catch (e) {
      console.error("Failed to seed", e);
    }
  }

  initDb().then(seed).catch(console.error);

  const httpServer = createServer(app);
  return httpServer;
}
