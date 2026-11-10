import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

import { authMiddleware } from "./auth.js";
import { authRouter } from "./routes/auth.routes.js";
import { eventsRouter } from "./routes/events.routes.js";
import { photosRouter } from "./routes/photos.routes.js";
import { galleryRouter } from "./routes/gallery.routes.js";
import { moderationRouter } from "./routes/moderation.routes.js";
import { rsvpRouter } from "./routes/rsvp.routes.js";
import { driveRouter } from "./routes/drive.routes.js";
import { guestRouter } from "./routes/guest.routes.js";
import { proxyRouter } from "./routes/proxy.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { getConsoleTelemetry } from "./telemetry.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration for Frontend
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://maan-gulati.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, true); // Dev permissive
      }
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Attach Auth Session extraction middleware
app.use(authMiddleware);

// Static uploads & public directory
app.use(express.static(path.resolve(__dirname, "..", "public")));
app.use("/uploads", express.static(path.resolve(__dirname, "..", "public", "uploads")));

// Mount API routes
app.use("/health", healthRouter);
app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/admin/events", eventsRouter);
app.use("/api/admin/photos", photosRouter);
app.use("/api/admin/moderation", moderationRouter);
app.use("/api/admin/rsvp", rsvpRouter);
app.use("/api/gallery", galleryRouter);
app.use("/api/guest", guestRouter);
app.use("/api/rsvp", rsvpRouter);
app.use("/api/google-drive", driveRouter);
app.use("/api/image-proxy", proxyRouter);

// Console Telemetry for CDO • CFO • CTO Executive Dashboard
app.get("/api/console/telemetry", async (_req, res) => {
  try {
    const telemetry = await getConsoleTelemetry();
    res.json(telemetry);
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Helper to serve the Executive Console UI
function serveConsole(res: express.Response) {
  const candidatePaths = [
    path.resolve(__dirname, "..", "public", "console.html"),
    path.resolve(process.cwd(), "public", "console.html"),
    path.resolve(process.cwd(), "backend", "public", "console.html"),
    path.resolve(__dirname, "public", "console.html"),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return res.sendFile(p);
    }
  }

  res.send(`<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0B080A;color:#FFF8F3;display:flex;align-items:center;justify-content:center;height:100vh;"><div><h1>ShaadiSnap AI Backend Active</h1><p>Please check console.html in public/</p></div></body></html>`);
}

// Dedicated Dashboard & Console Routes
app.get("/console", (_req, res) => serveConsole(res));
app.get("/dashboard", (_req, res) => serveConsole(res));
app.get("/admin-console", (_req, res) => serveConsole(res));

// Root Endpoint (Intelligent Content Negotiation: HTML for Browser, JSON for API/curl)
app.get("/", (req, res) => {
  const acceptsHtml = req.headers.accept?.includes("text/html");
  const forceJson = req.query.format === "json" || req.headers.accept?.includes("application/json");

  if (acceptsHtml && !forceJson) {
    return serveConsole(res);
  }

  res.json({
    service: "ShaadiSnap AI - Standalone Backend API",
    version: "1.0.0",
    status: "online",
    dashboardUi: "/console",
    endpoints: {
      health: "/api/health",
      telemetry: "/api/console/telemetry",
      auth: "/api/auth/login",
      events: "/api/admin/events",
      photos: "/api/admin/photos",
      gallery: "/api/gallery/photos",
      moderation: "/api/admin/moderation",
      rsvp: "/api/rsvp",
      googleDrive: "/api/google-drive/picker-config",
      guestPass: "/api/guest/verify-pass",
    },
  });
});

// Export Express app for Vercel / serverless deployments
export default app;
export { app };

// Start listening if executed directly
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(PORT, () => {
    console.log(`=============================================================`);
    console.log(`  ShaadiSnap AI Backend Server is running on port ${PORT}`);
    console.log(`  Console UI:  http://localhost:${PORT}/ (or /console)`);
    console.log(`  Base URL:    http://localhost:${PORT}`);
    console.log(`  Health:      http://localhost:${PORT}/api/health`);
    console.log(`  Telemetry:   http://localhost:${PORT}/api/console/telemetry`);
    console.log(`=============================================================`);
  });

  // Graceful shutdown
  process.on("SIGTERM", () => {
    server.close(() => console.log("Backend server closed gracefully."));
  });
  process.on("SIGINT", () => {
    server.close(() => console.log("Backend server closed gracefully."));
  });
}
