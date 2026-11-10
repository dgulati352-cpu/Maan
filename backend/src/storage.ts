import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { getDatabase } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Common uploads directory
const UPLOADS_DIR = path.resolve(__dirname, "..", "public", "uploads", "photos");
const THUMBNAILS_DIR = path.resolve(__dirname, "..", "public", "uploads", "thumbnails");

if (!fsSync.existsSync(UPLOADS_DIR)) {
  fsSync.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fsSync.existsSync(THUMBNAILS_DIR)) {
  fsSync.mkdirSync(THUMBNAILS_DIR, { recursive: true });
}

export function calculateBufferHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function generateSignedPhotoUrl(photoId: string, expiresInSeconds: number = 86400): string {
  const secret = process.env.SHAADISNAP_INTERNAL_API_KEY || "shaadisnap_dev_secret_key_2026_change_in_production";
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${photoId}:${expiresAt}`)
    .digest("hex");

  return `/api/image-proxy?photoId=${encodeURIComponent(photoId)}&expires=${expiresAt}&sig=${signature}`;
}

export function verifySignedPhotoUrl(photoId: string, expiresStr: string, sig: string): boolean {
  const secret = process.env.SHAADISNAP_INTERNAL_API_KEY || "shaadisnap_dev_secret_key_2026_change_in_production";
  const expires = parseInt(expiresStr, 10);
  if (isNaN(expires) || Date.now() / 1000 > expires) {
    return false;
  }

  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${photoId}:${expires}`)
    .digest("hex");

  const bufSig = Buffer.from(sig);
  const bufExpected = Buffer.from(expectedSig);
  if (bufSig.length !== bufExpected.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufSig, bufExpected);
}

export interface StoredImageResult {
  filename: string;
  url: string;
  thumbnailUrl: string;
  fileHash: string;
  sizeBytes: number;
  mimeType: string;
  facesIndexed: number;
  facesDetected: number;
}

export async function processAndStoreImageBuffer(
  buffer: Buffer,
  originalFilename: string,
  eventId: string,
  photoId: string,
  mimeType: string = "image/jpeg"
): Promise<StoredImageResult> {
  const fileHash = calculateBufferHash(buffer);
  const ext = path.extname(originalFilename).toLowerCase() || ".jpg";
  const cleanBase = path.basename(originalFilename, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
  const storedFilename = `${cleanBase}_${Date.now()}_${photoId.slice(0, 6)}${ext}`;

  const permanentFilePath = path.join(UPLOADS_DIR, storedFilename);
  const thumbnailFilePath = path.join(THUMBNAILS_DIR, `thumb_${storedFilename}`);

  await fs.writeFile(permanentFilePath, buffer);
  await fs.writeFile(thumbnailFilePath, buffer);

  const permanentUrl = `/uploads/photos/${storedFilename}`;
  const thumbnailUrl = `/uploads/thumbnails/thumb_${storedFilename}`;

  let facesIndexed = 0;
  let facesDetected = 0;

  // Trigger indexing via Python ML microservice on port 8001
  const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8001";
  const internalApiKey = process.env.SHAADISNAP_INTERNAL_API_KEY || "shaadisnap_dev_secret_key_2026_change_in_production";

  try {
    const mlResponse = await fetch(`${mlServiceUrl}/api/v1/index-photo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Key": internalApiKey,
      },
      body: JSON.stringify({
        event_id: eventId,
        photo_id: photoId,
        image_base64: buffer.toString("base64"),
        image_url: permanentUrl,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (mlResponse.ok) {
      const mlData = (await mlResponse.json()) as { faces_detected?: number; faces_indexed?: number };
      facesDetected = mlData.faces_detected || 0;
      facesIndexed = mlData.faces_indexed || 0;
    }
  } catch (err) {
    console.warn(`[ML Engine HTTP] Indexing call to ${mlServiceUrl} skipped:`, (err as Error).message);
  }

  // Update storage usage in SQLite
  try {
    const db = getDatabase();
    db.prepare(`
      INSERT INTO storage_usage (id, event_id, total_bytes, photo_count, thumbnail_bytes, updated_at)
      VALUES (?, ?, ?, 1, ?, ?)
      ON CONFLICT(event_id) DO UPDATE SET
        total_bytes = total_bytes + excluded.total_bytes,
        photo_count = photo_count + 1,
        thumbnail_bytes = thumbnail_bytes + excluded.thumbnail_bytes,
        updated_at = excluded.updated_at
    `).run(
      `storage_${eventId}`,
      eventId,
      buffer.length,
      buffer.length,
      Date.now()
    );
  } catch (dbErr) {
    console.error("[Storage Update Error]", dbErr);
  }

  return {
    filename: storedFilename,
    url: permanentUrl,
    thumbnailUrl,
    fileHash,
    sizeBytes: buffer.length,
    mimeType,
    facesIndexed,
    facesDetected,
  };
}

export function getUploadsDir(): string {
  return UPLOADS_DIR;
}

export function getThumbnailsDir(): string {
  return THUMBNAILS_DIR;
}

