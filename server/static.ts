import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function serveStatic(app: Express) {

  const distPath = path.join(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(`Missing build folder: ${distPath}`);
  }

  app.use(express.static(distPath));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(path.join(distPath, "index.html"));
  });

}
