import express, { type Express } from "express";
import fs from "fs";
import path from "path";

const __dirname = path.resolve();

export function serveStatic(app: Express) {

  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {

    const altPath = path.resolve(process.cwd(), "dist", "public");

    if (fs.existsSync(altPath)) {

      app.use(express.static(altPath));

      app.get("/*", (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }

        res.sendFile(path.resolve(altPath, "index.html"));
      });

      return;
    }

    throw new Error(
      `Could not find the build directory: ${distPath}`
    );
  }

  app.use(express.static(distPath));

  app.get("/*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    res.sendFile(path.resolve(distPath, "index.html"));
  });

}
