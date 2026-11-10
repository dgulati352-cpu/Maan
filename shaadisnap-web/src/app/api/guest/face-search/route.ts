import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import {
  verifyGuestToken,
  checkRateLimit,
  logFaceSearchSession,
  logGuestAccess,
} from "@/lib/server/guestPassStore";

const execFileAsync = promisify(execFile);

const COMPREFACE_URL = process.env.COMPREFACE_URL || "http://localhost:8000";
const COMPREFACE_API_KEY = process.env.COMPREFACE_API_KEY || "";

async function resolvePythonExecutable(): Promise<string> {
  const envPy = process.env.PYTHON_PATH || process.env.PYTHON_BIN;
  if (envPy) return envPy;

  const candidates = [
    // Next.js running from shaadisnap-web/
    path.resolve(process.cwd(), "..", "shaadisnap-ml", ".venv", "Scripts", "python.exe"),
    path.resolve(process.cwd(), "..", "shaadisnap-ml", ".venv", "bin", "python"),
    path.resolve(process.cwd(), "..", ".venv", "Scripts", "python.exe"),
    path.resolve(process.cwd(), "..", ".venv", "bin", "python"),
    // Next.js running from workspace root
    path.resolve(process.cwd(), "shaadisnap-ml", ".venv", "Scripts", "python.exe"),
    path.resolve(process.cwd(), "shaadisnap-ml", ".venv", "bin", "python"),
    path.resolve(process.cwd(), ".venv", "Scripts", "python.exe"),
    path.resolve(process.cwd(), ".venv", "bin", "python"),
  ];

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Continue searching
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
      // Continue searching
    }
  }

  const fallback = candidates[0];
  return { scriptPath: fallback, mlDir: path.dirname(fallback) };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let tmpFilePath: string | null = null;
  let passId = "unknown";
  let derivedEventId = "unknown";

  try {
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const formData = await req.formData();
    const token = formData.get("token") as string | null;
    const file = formData.get("file") as File | null;
    const hasConsent = formData.get("hasConsent");
    const rawThreshold = parseFloat((formData.get("threshold") as string) || "0.70");
    const threshold = isNaN(rawThreshold) ? 0.70 : Math.max(0.1, Math.min(0.99, rawThreshold));

    // 1. Mandatory Token Validation
    if (!token) {
      return NextResponse.json(
        { error: "Guest Pass token is required. Access denied." },
        { status: 401 }
      );
    }

    const verification = verifyGuestToken(token, { ipAddress, userAgent, recordAccess: false });
    if (!verification.valid || !verification.pass || !verification.eventId) {
      return NextResponse.json(
        { error: verification.error || "Invalid, expired, or revoked guest pass." },
        { status: 403 }
      );
    }

    passId = verification.pass.id;
    // CRITICAL SECURITY ENFORCEMENT: Event ID is strictly derived from server-verified token
    derivedEventId = verification.eventId;

    // 2. Rate Limiting Check (Max 15 face searches per minute per token/IP)
    const tokenRateOk = checkRateLimit(`token_${passId}`, 15, 60);
    const ipRateOk = checkRateLimit(`ip_${ipAddress}`, 25, 60);

    if (!tokenRateOk || !ipRateOk) {
      logFaceSearchSession({
        guestPassId: passId,
        eventId: derivedEventId,
        matchesCount: 0,
        latencyMs: Date.now() - startTime,
        status: "RATE_LIMITED",
        engine: "security-guard",
      });
      return NextResponse.json(
        { error: "Too many face search requests. Please wait a moment before trying again." },
        { status: 429 }
      );
    }

    // 3. Biometric Consent Verification (DPDP Act 2023 & GDPR)
    if (hasConsent !== "true" && hasConsent !== "1") {
      return NextResponse.json(
        { error: "Explicit biometric consent is required to process facial recognition search." },
        { status: 400 }
      );
    }

    // 4. Selfie File Check
    if (!file) {
      return NextResponse.json({ error: "No selfie photo captured or uploaded." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save temporary selfie file in OS temp folder for inference
    const tmpFileName = `guest_selfie_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
    tmpFilePath = path.join(os.tmpdir(), tmpFileName);
    await fs.writeFile(tmpFilePath, buffer);

    logGuestAccess({
      guestPassId: passId,
      action: "FACE_SCAN_INITIATED",
      ipAddress,
      userAgent,
    });

    let matches: Array<{
      id: string;
      photoId?: string;
      similarity: number;
      photoUrl?: string;
      title?: string;
      ceremony?: string;
    }> = [];
    let engine = "shaadisnap-fastapi-backend";
    let backendProcessed = false;

    // 5. Primary Engine: Ultra-fast HTTP call to live FastAPI backend (port 8001)
    const mlServiceUrl = process.env.ML_SERVICE_URL || "http://localhost:8001";
    const internalApiKey = process.env.SHAADISNAP_INTERNAL_API_KEY || "shaadisnap_dev_secret_key_2026_change_in_production";
    try {
      const mlFormData = new FormData();
      mlFormData.append("event_id", derivedEventId);
      mlFormData.append("guest_id", `guest_${passId.slice(-6)}`);
      mlFormData.append("consent_token", `consent_verified_${passId}_${Date.now()}`);
      mlFormData.append("threshold", threshold.toString());
      const selfieBlob = new Blob([buffer], { type: file.type || "image/jpeg" });
      mlFormData.append("file", selfieBlob, file.name || "guest_selfie.jpg");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const mlRes = await fetch(`${mlServiceUrl}/api/v1/search`, {
        method: "POST",
        headers: {
          "x-api-key": internalApiKey,
        },
        body: mlFormData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (mlRes.ok) {
        const mlData = await mlRes.json();
        if (Array.isArray(mlData.matches)) {
          matches = mlData.matches;
          backendProcessed = true;
        }
      }
    } catch {
      // Backend offline or starting up, fall through to CLI subprocess engine
    }

    // 6. Secondary Engine: Native ArcFace CLI Subprocess Fallback
    if (!backendProcessed) {
      engine = "shaadisnap-arcface-native";
      try {
        const pyPath = await resolvePythonExecutable();
        const { scriptPath, mlDir } = await resolveScriptPath();

        const { stdout } = await execFileAsync(
          pyPath,
          [
            "-W",
            "ignore",
            scriptPath,
            "search-selfie",
            "--event",
            derivedEventId,
            "--selfie",
            tmpFilePath,
            "--threshold",
            threshold.toString(),
            "--guest-id",
            `guest_${passId.slice(-6)}`,
          ],
          {
            timeout: 30000,
            env: {
              ...process.env,
              PYTHONPATH: mlDir,
              PYTHONWARNINGS: "ignore",
            },
          }
        );

        const lines = stdout.trim().split("\n");
        const jsonLine = lines.reverse().find((l) => l.trim().startsWith("{") && l.trim().endsWith("}"));
        if (jsonLine) {
          const parsed = JSON.parse(jsonLine.trim());
          if (Array.isArray(parsed.matches)) {
            matches = parsed.matches;
          }
        }
      } catch (cliErr: unknown) {
        const msg = cliErr instanceof Error ? cliErr.message : String(cliErr);
        console.warn("Native ArcFace CLI search fallback:", msg);

        // 7. Tertiary CompreFace HTTP Fallback
        if (COMPREFACE_API_KEY) {
        try {
          const comprefaceFormData = new FormData();
          const blob = new Blob([buffer], { type: file.type || "image/jpeg" });
          comprefaceFormData.append("file", blob, file.name || "selfie.jpg");

          const comprefaceRes = await fetch(
            `${COMPREFACE_URL}/api/v1/recognition/recognize?limit=50&prediction_count=3&det_prob_threshold=0.8`,
            {
              method: "POST",
              headers: { "x-api-key": COMPREFACE_API_KEY },
              body: comprefaceFormData,
              signal: AbortSignal.timeout(6000),
            }
          );

          if (comprefaceRes.ok) {
            const comprefaceData = await comprefaceRes.json();
            const results = comprefaceData.result || [];
            engine = "compreface";
            matches = results.map((r: { subject?: string; similarity?: number; box?: unknown }, idx: number) => ({
              id: `cf_${idx}`,
              photoId: r.subject || `photo_${idx}`,
              similarity: r.similarity || 0.85,
            }));
          }
        } catch (cfErr: unknown) {
          const cfMsg = cfErr instanceof Error ? cfErr.message : String(cfErr);
          console.warn("CompreFace HTTP call failed:", cfMsg);
        }
      }

      if (matches.length === 0) {
        engine = "simulation";
      }
    }
  }

    const latencyMs = Date.now() - startTime;
    const highestSim = matches.length > 0 ? Math.max(...matches.map((m) => m.similarity)) : undefined;

    // 7. Log Session Audit
    logFaceSearchSession({
      guestPassId: passId,
      eventId: derivedEventId,
      matchesCount: matches.length,
      highestSimilarity: highestSim,
      latencyMs,
      status: matches.length > 0 ? "SUCCESS" : "NO_MATCH",
      engine,
    });

    logGuestAccess({
      guestPassId: passId,
      action: matches.length > 0 ? "FACE_MATCH_SUCCESS" : "FACE_MATCH_EMPTY",
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      engine,
      eventId: derivedEventId,
      total_matches: matches.length,
      matches,
      latency_ms: latencyMs,
      message:
        matches.length > 0
          ? `Found ${matches.length} matching photograph${matches.length === 1 ? "" : "s"}.`
          : "No matching photos found with high confidence under the calibrated threshold.",
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to process face search";
    console.error("Guest face search error:", msg);

    logFaceSearchSession({
      guestPassId: passId,
      eventId: derivedEventId,
      matchesCount: 0,
      latencyMs: Date.now() - startTime,
      status: "FAILED",
      engine: "error-handler",
    });

    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    // 8. CRITICAL BIOMETRIC PRIVACY: Ephemeral selfie file is erased immediately
    if (tmpFilePath) {
      await fs.unlink(tmpFilePath).catch(() => {});
    }
  }
}

