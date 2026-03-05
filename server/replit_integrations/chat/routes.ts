import type { Express, Request, Response } from "express";
import fetch from "node-fetch";
import { chatStorage } from "./storage";

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

export function registerChatRoutes(app: Express): void {
  // Get all conversations
  app.get("/api/conversations", async (req: Request, res: Response) => {
    try {
      const conversations = await chatStorage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages
  app.get("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const conversation = await chatStorage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      const messages = await chatStorage.getMessagesByConversation(id);
      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });

  // Create new conversation
  app.post("/api/conversations", async (req: Request, res: Response) => {
    try {
      const { title } = req.body;
      const conversation = await chatStorage.createConversation(title || "New Chat");
      res.status(201).json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  // Delete conversation
  app.delete("/api/conversations/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await chatStorage.deleteConversation(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  // Send message and get AI response (streaming)
  app.post("/api/conversations/:id/messages", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Save user message
      await chatStorage.createMessage(conversationId, "user", content);

      // Get conversation history for context
      const messages = await chatStorage.getMessagesByConversation(conversationId);
      const chatMessages = messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
        parts: [{ type: "text", text: m.content }]
      }));

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream response from ChatPlus
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

      let fullResponse = "";
      const body = response.body;

      if (!body) {
        throw new Error("No response body from ChatPlus");
      }

      // Stream handling
      body.on("data", (chunk: Buffer) => {
        const text = chunk.toString();
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith('0:"')) {
            try {
              // Extract the JSON-stringified content part
              // Format is 0:"content"
              const contentMatch = line.match(/^0:"(.*)"$/);
              if (contentMatch) {
                let content = contentMatch[1];
                // Unescape common JSON escapes
                content = content.replace(/\\"/g, '"')
                               .replace(/\\n/g, '\n')
                               .replace(/\\\\/g, '\\');
                if (content) {
                  fullResponse += content;
                  res.write(`data: ${JSON.stringify({ content })}\n\n`);
                }
              }
            } catch (e) {
              console.error("Error parsing line:", line, e);
            }
          }
        }
      });

      body.on("end", async () => {
        // Save assistant message
        await chatStorage.createMessage(conversationId, "assistant", fullResponse);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      });

      body.on("error", (err) => {
        console.error("Stream error:", err);
        res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
        res.end();
      });

    } catch (error) {
      console.error("Error sending message:", error);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: "Failed to send message" })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: "Failed to send message" });
      }
    }
  });
}

