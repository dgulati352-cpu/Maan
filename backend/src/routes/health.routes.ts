import { Router } from "express";
import { getDatabase } from "../db.js";

export const healthRouter = Router();

function getHealthStatus() {
  let dbStatus = "healthy";
  let tableCount = 0;
  try {
    const db = getDatabase();
    const row = db.prepare("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'").get() as { count: number };
    tableCount = row.count;
  } catch (err) {
    dbStatus = `unhealthy: ${(err as Error).message}`;
  }

  return {
    status: dbStatus.startsWith("healthy") ? "healthy" : "degraded",
    service: "shaadisnap-backend",
    version: "1.0.0",
    database: {
      type: "sqlite",
      status: dbStatus,
      tables: tableCount,
    },
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  };
}

healthRouter.get("/", (_req, res) => {
  res.json(getHealthStatus());
});

healthRouter.get("/health", (_req, res) => {
  res.json(getHealthStatus());
});

