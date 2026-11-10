import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
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

// Static uploads directory
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

// Root information endpoint
app.get("/", (_req, res) => {
  res.json({
    service: "ShaadiSnap AI - Standalone Backend API",
    version: "1.0.0",
    status: "online",
    endpoints: {
      health: "/api/health",
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

// Start listening
const server = app.listen(PORT, () => {
  console.log(`=============================================================`);
  console.log(`  ShaadiSnap AI Backend Server is running on port ${PORT}`);
  console.log(`  Base URL:  http://localhost:${PORT}`);
  console.log(`  Health:    http://localhost:${PORT}/api/health`);
  console.log(`  Gallery:   http://localhost:${PORT}/api/gallery/photos`);
  console.log(`=============================================================`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  server.close(() => console.log("Backend server closed gracefully."));
});
process.on("SIGINT", () => {
  server.close(() => console.log("Backend server closed gracefully."));
});

