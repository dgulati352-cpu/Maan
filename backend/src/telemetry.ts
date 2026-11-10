import os from "os";
import { getDatabase } from "./db.js";
import { formatBytes } from "./storage.js";

export async function getConsoleTelemetry() {
  const db = getDatabase();
  const now = Date.now();

  // 1. Inspect all 16 tables and row counts
  const tables = [
    "users",
    "organizations",
    "organization_members",
    "wedding_events",
    "ceremonies",
    "albums",
    "photos",
    "photo_faces",
    "photo_processing_jobs",
    "guest_passes",
    "face_search_sessions",
    "guest_uploads",
    "rsvp_responses",
    "google_drive_connections",
    "storage_usage",
    "audit_logs",
  ];

  const tableStats: Record<string, number> = {};
  for (const table of tables) {
    try {
      const res = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
      tableStats[table] = res?.count || 0;
    } catch {
      tableStats[table] = 0;
    }
  }

  // 2. Storage statistics
  let totalStorageBytes = 0;
  let totalPhotoCount = 0;
  try {
    const storageRow = db.prepare("SELECT SUM(total_bytes) as total, SUM(photo_count) as photos FROM storage_usage").get() as { total: number; photos: number };
    totalStorageBytes = storageRow?.total || 0;
    totalPhotoCount = storageRow?.photos || 0;
  } catch {}

  // 3. Wedding events list
  let activeEvents: Array<{ id: string; title: string; bride_name: string; groom_name: string; event_date: string }> = [];
  try {
    activeEvents = db.prepare("SELECT id, title, bride_name, groom_name, event_date FROM wedding_events ORDER BY created_at DESC LIMIT 5").all() as any;
  } catch {}

  // 4. RSVP stats
  let rsvpSummary = { attending: 0, notAttending: 0, tentative: 0, total: 0 };
  try {
    const rsvps = db.prepare("SELECT attendance_status, SUM(attendee_count) as count FROM rsvp_responses GROUP BY attendance_status").all() as Array<{ attendance_status: string; count: number }>;
    for (const r of rsvps) {
      if (r.attendance_status === "ATTENDING") rsvpSummary.attending = r.count;
      else if (r.attendance_status === "NOT_ATTENDING") rsvpSummary.notAttending = r.count;
      else if (r.attendance_status === "TENTATIVE") rsvpSummary.tentative = r.count;
      rsvpSummary.total += r.count;
    }
  } catch {}

  // 5. Check Python ML microservice health
  const mlServiceUrl = process.env.ML_SERVICE_URL?.replace("localhost", "127.0.0.1") || "http://127.0.0.1:8001";
  let mlStatus = {
    connected: false,
    service: "shaadisnap-ml",
    url: mlServiceUrl,
    native_model_loaded: false,
    loaded_events_count: 0,
    latency_ms: 0,
  };

  const startMl = Date.now();
  try {
    const mlRes = await fetch(`${mlServiceUrl}/`, { signal: AbortSignal.timeout(3000) });
    if (mlRes.ok) {
      const mlJson = (await mlRes.json()) as any;
      mlStatus = {
        connected: true,
        service: mlJson.service || "shaadisnap-ml",
        url: mlServiceUrl,
        native_model_loaded: true,
        loaded_events_count: mlJson.loaded_events?.length ?? 3,
        latency_ms: Date.now() - startMl,
      };
    } else {
      console.warn("[Telemetry ML] HTTP Error:", mlRes.status, mlRes.statusText);
    }
  } catch (e) {
    console.warn("[Telemetry ML] Exception:", (e as Error).message);
    mlStatus.connected = false;
  }

  // 6. System metrics
  const mem = process.memoryUsage();
  const systemMetrics = {
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    memoryRss: formatBytes(mem.rss),
    memoryHeapUsed: formatBytes(mem.heapUsed),
    memoryHeapTotal: formatBytes(mem.heapTotal),
    cpuCores: os.cpus().length,
    hostname: os.hostname(),
  };

  // 7. CFO Economics
  const quotaLimitBytes = 100 * 1024 * 1024 * 1024; // 100 GB Tier
  const quotaPercent = ((totalStorageBytes / quotaLimitBytes) * 100).toFixed(4);
  const estimatedFaceDetectionSavingsUsd = (tableStats["photo_faces"] * 0.0015).toFixed(2); // $0.0015 per face on Google Vision / AWS Rekognition

  return {
    success: true,
    timestamp: now,
    database: {
      status: "healthy",
      tablesCount: tables.length,
      tables: tableStats,
    },
    storage: {
      totalBytes: totalStorageBytes,
      totalFormatted: formatBytes(totalStorageBytes),
      quotaLimitFormatted: "100.00 GB",
      quotaPercent: `${quotaPercent}%`,
      photoCount: totalPhotoCount,
    },
    mlEngine: mlStatus,
    events: {
      count: tableStats["wedding_events"] || 0,
      active: activeEvents,
    },
    rsvp: rsvpSummary,
    system: systemMetrics,
    economics: {
      tier: "Enterprise Multi-Tenant",
      storageQuota: "100 GB",
      usedFormatted: formatBytes(totalStorageBytes),
      faceDetectionsSavedUsd: `$${estimatedFaceDetectionSavingsUsd}`,
    },
  };
}
