import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface GuestPassRecord {
  id: string;
  tokenHash: string;
  rawTokenPreview?: string; // Truncated preview (e.g. "a9f8...b32c") for admin display only
  eventId: string;
  eventName: string;
  guestName?: string;
  guestPhone?: string;
  expiresAt?: string; // ISO string or null
  isRevoked: boolean;
  revokedAt?: string;
  revokedReason?: string;
  maxScans?: number; // null = unlimited
  scanCount: number;
  lastAccessedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FaceSearchSessionRecord {
  id: string;
  guestPassId: string;
  eventId: string;
  matchesCount: number;
  highestSimilarity?: number;
  latencyMs: number;
  status: "SUCCESS" | "NO_MATCH" | "FAILED" | "RATE_LIMITED";
  engine: string;
  createdAt: string;
}

export interface GuestAccessLogRecord {
  id: string;
  guestPassId: string;
  action:
  | "PAGE_VIEW"
  | "FACE_SCAN_INITIATED"
  | "FACE_MATCH_SUCCESS"
  | "FACE_MATCH_EMPTY"
  | "PHOTO_DOWNLOAD_SINGLE"
  | "PHOTO_DOWNLOAD_BATCH"
  | "PASS_REVOKED";
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface PhotoProcessingJobRecord {
  id: string;
  eventId: string;
  photoId: string;
  photoUrl: string;
  ceremony?: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  facesDetected?: number;
  errorMessage?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface StoreData {
  passes: GuestPassRecord[];
  sessions: FaceSearchSessionRecord[];
  logs: GuestAccessLogRecord[];
  jobs: PhotoProcessingJobRecord[];
}

// In-memory store + persistent file fallback
let storeCache: StoreData | null = null;
const rateLimitBuckets: Map<string, { count: number; resetAt: number }> = new Map();

function getStoreFilePath(): string {
  // Use persistent data directory in shaadisnap-web or temp directory
  const rootCandidates = [
    path.resolve(process.cwd(), "data"),
    path.resolve(process.cwd(), "..", "data"),
    path.resolve(process.cwd(), ".next"),
  ];

  for (const dir of rootCandidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return path.join(dir, "guest_passes_vault.json");
    } catch {
      // Try next candidate
    }
  }

  return path.join(process.cwd(), "guest_passes_vault.json");
}

function loadStore(): StoreData {
  if (storeCache) return storeCache;

  const defaultData: StoreData = {
    passes: [],
    sessions: [],
    logs: [],
    jobs: [],
  };

  try {
    const filePath = getStoreFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      storeCache = JSON.parse(raw);
      return storeCache!;
    }
  } catch (err) {
    console.warn("Could not read persistent guest pass store file:", err);
  }

  // Seed default demonstration event pass for Marwaha & Gulati wedding
  storeCache = defaultData;
  seedInitialEventData(storeCache);
  saveStore();
  return storeCache;
}

function saveStore(): void {
  if (!storeCache) return;
  try {
    const filePath = getStoreFilePath();
    fs.writeFileSync(filePath, JSON.stringify(storeCache, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not write persistent guest pass store file:", err);
  }
}

function seedInitialEventData(data: StoreData) {
  // Seed a demo guest pass for testing: token = "mg-royal-guest-2026-vip"
  const demoToken = "mg-royal-guest-2026-vip";
  const demoHash = hashToken(demoToken);

  if (!data.passes.some((p) => p.tokenHash === demoHash)) {
    data.passes.push({
      id: "pass-seed-001",
      tokenHash: demoHash,
      rawTokenPreview: "mg-ro...-vip",
      eventId: "marwaha-gulati-2026",
      eventName: "Marwaha & Gulati Wedding Celebration",
      guestName: "Ananya Gulati (Family VIP)",
      guestPhone: "+91 98765 43210",
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isRevoked: false,
      maxScans: 100,
      scanCount: 0,
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

// Cryptographic token helpers
export function generateGuestToken(): string {
  // 24 random bytes = 48 hex chars = 192 bits of cryptographic entropy
  return crypto.randomBytes(24).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

// Rate Limiter: Max 15 face searches per minute per token or IP
export function checkRateLimit(key: string, maxRequests = 15, windowSeconds = 60): boolean {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (bucket.count >= maxRequests) {
    return false;
  }

  bucket.count += 1;
  return true;
}

// --- Guest Pass Management Functions ---

export interface CreateGuestPassInput {
  eventId: string;
  eventName: string;
  guestName?: string;
  guestPhone?: string;
  expiresInHours?: number | null; // null = never expires
  maxScans?: number | null;
}

export interface CreatedGuestPassResult {
  pass: GuestPassRecord;
  rawToken: string;
  guestUrl: string;
  whatsappMessage: string;
}

export function createGuestPass(
  input: CreateGuestPassInput,
  origin = "https://maan-gulati.vercel.app"
): CreatedGuestPassResult {
  const store = loadStore();
  const rawToken = generateGuestToken();
  const tokenHash = hashToken(rawToken);
  const id = `pass_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();

  let expiresAt: string | undefined = undefined;
  if (input.expiresInHours && input.expiresInHours > 0) {
    expiresAt = new Date(Date.now() + input.expiresInHours * 3600 * 1000).toISOString();
  }

  const pass: GuestPassRecord = {
    id,
    tokenHash,
    rawTokenPreview: `${rawToken.slice(0, 4)}...${rawToken.slice(-4)}`,
    eventId: input.eventId || "marwaha-gulati-2026",
    eventName: input.eventName || "Marwaha & Gulati Wedding Celebration",
    guestName: input.guestName?.trim() || undefined,
    guestPhone: input.guestPhone?.trim() || undefined,
    expiresAt,
    isRevoked: false,
    maxScans: input.maxScans ?? undefined,
    scanCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  store.passes.unshift(pass);
  saveStore();

  const guestUrl = `${origin}/guest/${rawToken}`;
  const whatsappMessage = `Hey! ❤️ Your wedding memories are ready.\n\nOpen your private photo link and scan your face to discover all your pictures.\n\n${guestUrl}\n\nNo login required!`;

  return {
    pass,
    rawToken,
    guestUrl,
    whatsappMessage,
  };
}

export interface VerifyGuestTokenResult {
  valid: boolean;
  pass?: GuestPassRecord;
  eventId?: string;
  eventName?: string;
  error?: string;
}

export function verifyGuestToken(
  token: string,
  options?: { ipAddress?: string; userAgent?: string; recordAccess?: boolean }
): VerifyGuestTokenResult {
  if (!token || typeof token !== "string" || token.trim().length === 0) {
    return { valid: false, error: "Missing or invalid guest pass token." };
  }

  const store = loadStore();
  const tokenHash = hashToken(token);
  const pass = store.passes.find((p) => p.tokenHash === tokenHash);

  if (!pass) {
    return { valid: false, error: "Guest pass not found or invalid token." };
  }

  if (pass.isRevoked) {
    return {
      valid: false,
      error: pass.revokedReason || "This guest pass has been revoked by the wedding organizers.",
    };
  }

  if (pass.expiresAt) {
    const expiryTime = new Date(pass.expiresAt).getTime();
    if (Date.now() > expiryTime) {
      return {
        valid: false,
        error: "This guest pass has expired. Please contact the wedding host for a new link.",
      };
    }
  }

  if (pass.maxScans && pass.scanCount >= pass.maxScans) {
    return {
      valid: false,
      error: "This guest pass has reached its maximum authorized scan limit.",
    };
  }

  if (options?.recordAccess !== false) {
    pass.scanCount += 1;
    pass.lastAccessedAt = new Date().toISOString();
    pass.updatedAt = new Date().toISOString();

    store.logs.unshift({
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      guestPassId: pass.id,
      action: "PAGE_VIEW",
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      timestamp: new Date().toISOString(),
    });

    saveStore();
  }

  return {
    valid: true,
    pass,
    eventId: pass.eventId,
    eventName: pass.eventName,
  };
}

export function revokeGuestPass(passId: string, reason = "Revoked by host"): boolean {
  const store = loadStore();
  const pass = store.passes.find((p) => p.id === passId);
  if (!pass) return false;

  pass.isRevoked = true;
  pass.revokedAt = new Date().toISOString();
  pass.revokedReason = reason;
  pass.updatedAt = new Date().toISOString();

  store.logs.unshift({
    id: `log_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    guestPassId: pass.id,
    action: "PASS_REVOKED",
    timestamp: new Date().toISOString(),
  });

  saveStore();
  return true;
}

export function regenerateGuestPass(
  passId: string,
  origin = "https://maan-gulati.vercel.app"
): CreatedGuestPassResult | null {
  const store = loadStore();
  const oldPass = store.passes.find((p) => p.id === passId);
  if (!oldPass) return null;

  // Revoke the old pass
  oldPass.isRevoked = true;
  oldPass.revokedAt = new Date().toISOString();
  oldPass.revokedReason = "Regenerated new pass";
  oldPass.updatedAt = new Date().toISOString();

  // Create a new replacement pass with same parameters
  return createGuestPass(
    {
      eventId: oldPass.eventId,
      eventName: oldPass.eventName,
      guestName: oldPass.guestName,
      guestPhone: oldPass.guestPhone,
      maxScans: oldPass.maxScans,
    },
    origin
  );
}

export function listGuestPasses(eventId?: string): GuestPassRecord[] {
  const store = loadStore();
  if (!eventId || eventId === "all") {
    return store.passes;
  }
  return store.passes.filter((p) => p.eventId === eventId);
}

export function getGuestPassStats(eventId?: string) {
  const store = loadStore();
  const filteredPasses =
    !eventId || eventId === "all" ? store.passes : store.passes.filter((p) => p.eventId === eventId);
  const filteredSessions =
    !eventId || eventId === "all"
      ? store.sessions
      : store.sessions.filter((s) => s.eventId === eventId);

  const totalPasses = filteredPasses.length;
  const activePasses = filteredPasses.filter(
    (p) =>
      !p.isRevoked &&
      (!p.expiresAt || new Date(p.expiresAt).getTime() > Date.now()) &&
      (!p.maxScans || p.scanCount < p.maxScans)
  ).length;
  const totalScans = filteredPasses.reduce((acc, p) => acc + (p.scanCount || 0), 0);
  const successfulSearches = filteredSessions.filter((s) => s.status === "SUCCESS").length;

  return {
    totalPasses,
    activePasses,
    revokedPasses: totalPasses - activePasses,
    totalScans,
    successfulSearches,
  };
}

// --- Face Search Sessions & Audit Logs ---

export function logFaceSearchSession(record: Omit<FaceSearchSessionRecord, "id" | "createdAt">): void {
  const store = loadStore();
  store.sessions.unshift({
    id: `sess_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    ...record,
    createdAt: new Date().toISOString(),
  });
  saveStore();
}

export function logGuestAccess(record: Omit<GuestAccessLogRecord, "id" | "timestamp">): void {
  const store = loadStore();
  store.logs.unshift({
    id: `log_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    ...record,
    timestamp: new Date().toISOString(),
  });
  saveStore();
}

// --- Photo Processing Jobs Queue ---

export function createPhotoProcessingJob(input: {
  eventId: string;
  photoId: string;
  photoUrl: string;
  ceremony?: string;
}): PhotoProcessingJobRecord {
  const store = loadStore();
  const existing = store.jobs.find(
    (j) => j.eventId === input.eventId && j.photoId === input.photoId
  );
  if (existing) {
    existing.attempts += 1;
    existing.status = "PENDING";
    existing.updatedAt = new Date().toISOString();
    saveStore();
    return existing;
  }

  const job: PhotoProcessingJobRecord = {
    id: `job_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
    eventId: input.eventId,
    photoId: input.photoId,
    photoUrl: input.photoUrl,
    ceremony: input.ceremony,
    status: "PENDING",
    facesDetected: 0,
    attempts: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.jobs.unshift(job);
  saveStore();
  return job;
}

export function updatePhotoProcessingJob(
  jobId: string,
  update: Partial<PhotoProcessingJobRecord>
): void {
  const store = loadStore();
  const job = store.jobs.find((j) => j.id === jobId);
  if (!job) return;

  Object.assign(job, update, { updatedAt: new Date().toISOString() });
  if (update.status === "COMPLETED" || update.status === "FAILED") {
    job.completedAt = new Date().toISOString();
  }
  saveStore();
}

export function listPhotoProcessingJobs(eventId?: string): PhotoProcessingJobRecord[] {
  const store = loadStore();
  if (!eventId || eventId === "all") {
    return store.jobs;
  }
  return store.jobs.filter((j) => j.eventId === eventId);
}

export function retryFailedJobs(eventId?: string): number {
  const store = loadStore();
  let count = 0;
  for (const job of store.jobs) {
    if ((!eventId || job.eventId === eventId) && job.status === "FAILED") {
      job.status = "PENDING";
      job.attempts += 1;
      job.updatedAt = new Date().toISOString();
      count += 1;
    }
  }
  if (count > 0) saveStore();
  return count;
}

