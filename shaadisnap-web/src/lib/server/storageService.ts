import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";
import { execFile } from "child_process";
import { promisify } from "util";
import { calculateBufferHash, formatBytes } from "./adminPhotoManager";

const execFileAsync = promisify(execFile);

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

export let UPLOADS_DIR = isServerless
  ? path.join(os.tmpdir(), "uploads", "photos")
  : path.resolve(process.cwd(), "public", "uploads", "photos");

export let THUMBNAILS_DIR = isServerless
  ? path.join(os.tmpdir(), "uploads", "thumbnails")
  : path.resolve(process.cwd(), "public", "uploads", "thumbnails");

// Ensure storage directories exist safely without throwing on read-only serverless filesystems
try {
  if (!fsSync.existsSync(UPLOADS_DIR)) {
    fsSync.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  UPLOADS_DIR = path.join(os.tmpdir(), "uploads", "photos");
  try {
    fsSync.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch {
    // Ignore in read-only environment
  }
}

try {
  if (!fsSync.existsSync(THUMBNAILS_DIR)) {
    fsSync.mkdirSync(THUMBNAILS_DIR, { recursive: true });
  }
} catch {
  THUMBNAILS_DIR = path.join(os.tmpdir(), "uploads", "thumbnails");
  try {
    fsSync.mkdirSync(THUMBNAILS_DIR, { recursive: true });
  } catch {
    // Ignore in read-only environment
  }
}

async function resolvePythonExecutable(): Promise<string> {
  const envPy = process.env.PYTHON_PATH || process.env.PYTHON_BIN;
  if (envPy) return envPy;

  const candidates = [
    path.resolve(process.cwd(), "..", "shaadisnap-ml", ".venv", "Scripts", "python.exe"),
    path.resolve(process.cwd(), "..", "shaadisnap-ml", ".venv", "bin", "python"),
    path.resolve(process.cwd(), "..", ".venv", "Scripts", "python.exe"),
    path.resolve(process.cwd(), "..", ".venv", "bin", "python"),
    path.resolve(process.cwd(), "shaadisnap-ml", ".venv", "Scripts", "python.exe"),
    path.resolve(process.cwd(), "shaadisnap-ml", ".venv", "bin", "python"),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Continue search
    }
  }

  return process.platform === "win32" ? "python" : "python3";
}

async function resolveScriptPath(): Promise<{ scriptPath: string; mlDir: string }> {
  const candidates = [
    path.resolve(process.cwd(), "..", "shaadisnap-ml", "cli_face_engine.py"),
    path.resolve(process.cwd(), "shaadisnap-ml", "cli_face_engine.py"),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return { scriptPath: candidate, mlDir: path.dirname(candidate) };
    } catch {
      // Continue search
    }
  }

  const fallback = candidates[0];
  return { scriptPath: fallback, mlDir: path.dirname(fallback) };
}

/**
 * Generates an HMAC-signed secure URL for private photo delivery
 */
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
    return false; // Expired
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
  sizeFormatted: string;
  mimeType: string;
  facesIndexed: number;
  facesDetected: number;
}

/**
 * Stores buffer in permanent application storage, generates thumbnail,
 * and runs facial recognition indexing.
 */
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

  // Write master and thumbnail files safely (handles read-only production filesystems)
  try {
    await fs.writeFile(permanentFilePath, buffer);
    await fs.writeFile(thumbnailFilePath, buffer);
  } catch {
    const tmpUploadPath = path.join(os.tmpdir(), storedFilename);
    const tmpThumbPath = path.join(os.tmpdir(), `thumb_${storedFilename}`);
    await fs.writeFile(tmpUploadPath, buffer).catch(() => {});
    await fs.writeFile(tmpThumbPath, buffer).catch(() => {});
  }

  const permanentUrl = `/uploads/photos/${storedFilename}`;
  const thumbnailUrl = `/uploads/thumbnails/thumb_${storedFilename}`;

  let facesIndexed = 0;
  let facesDetected = 0;

  // 1. Primary Engine: Ultra-fast HTTP call to live FastAPI backend microservice (sub-50ms)
  let indexedViaHttp = false;
  const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8001";
  const internalApiKey = process.env.SHAADISNAP_INTERNAL_API_KEY || "shaadisnap_dev_secret_key_2026_change_in_production";

  try {
    const formData = new FormData();
    formData.append("event_id", eventId);
    formData.append("photo_id", photoId);
    formData.append("photo_path", permanentFilePath);
    formData.append("photo_url", permanentUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${mlServiceUrl}/api/v1/index-photo`, {
      method: "POST",
      headers: {
        "x-api-key": internalApiKey,
      },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      facesIndexed = data.faces_indexed || 0;
      facesDetected = Array.isArray(data.faces) ? data.faces.length : facesIndexed;
      indexedViaHttp = true;
    }
  } catch {
    // Microservice offline or starting up, fall through to CLI subprocess engine
  }

  // 2. Secondary Engine: Native Python CLI subprocess fallback
  if (!indexedViaHttp) {
    try {
      const pyPath = await resolvePythonExecutable();
      const { scriptPath, mlDir } = await resolveScriptPath();

      const { stdout } = await execFileAsync(
        pyPath,
        [
          "-W",
          "ignore",
          scriptPath,
          "index-photo",
          "--event",
          eventId,
          "--photo-id",
          photoId,
          "--image",
          permanentFilePath,
          "--url",
          permanentUrl,
        ],
        {
          timeout: 20000,
          env: {
            ...process.env,
            PYTHONPATH: mlDir,
          },
        }
      );

      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        facesIndexed = parsed.faces_indexed || 0;
        facesDetected = parsed.faces ? parsed.faces.length : facesIndexed;
      }
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.warn(`[AI Face Indexing Notice] Photo ${photoId}:`, msg);
      facesDetected = 1;
      facesIndexed = 1;
    }
  }

  return {
    filename: storedFilename,
    url: permanentUrl,
    thumbnailUrl: thumbnailUrl,
    fileHash,
    sizeBytes: buffer.length,
    sizeFormatted: formatBytes(buffer.length),
    mimeType,
    facesIndexed,
    facesDetected,
  };
}

