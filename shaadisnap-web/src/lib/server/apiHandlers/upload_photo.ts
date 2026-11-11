import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";

const execFileAsync = promisify(execFile);

const GOOGLE_APPS_SCRIPT_URL =
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbwNSX6iRCcQS_ImqeS9MJ-CZYy02hz39BIfiyRAm20tP9ytxe3FGFMI76rXY6lq-hDQ/exec";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

async function resolvePythonExecutable(): Promise<string> {
  const envPy = process.env.PYTHON_PATH || process.env.PYTHON_BIN;
  if (envPy) return envPy;

  const candidates = [
    // If Next.js runs from shaadisnap-web/
    path.resolve(process.cwd(), "..", "shaadisnap-ml", ".venv", "Scripts", "python.exe"),
    path.resolve(process.cwd(), "..", "shaadisnap-ml", ".venv", "bin", "python"),
    path.resolve(process.cwd(), "..", ".venv", "Scripts", "python.exe"),
    path.resolve(process.cwd(), "..", ".venv", "bin", "python"),
    // If Next.js runs from workspace root
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
  let tmpFilePath: string | null = null;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const ceremony = (formData.get("ceremony") as string) || "Sangeet";
    const eventId = (formData.get("eventId") as string) || "marwaha-gulati-2026";
    const uploaderEmail = (formData.get("uploaderEmail") as string) || (formData.get("email") as string) || "guest@maan-ai.com";
    const driveFolderId = (formData.get("driveFolderId") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 20MB maximum allowed size limit" },
        { status: 400 }
      );
    }

    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const isMimeValid = file.type ? ALLOWED_MIME_TYPES.includes(file.type) : false;
    const isExtValid = [".jpg", ".jpeg", ".png", ".webp", ".heic"].includes(ext);
    if (!isExtValid || (file.type && !isMimeValid)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed formats: JPG, PNG, WebP, HEIC" },
        { status: 400 }
      );
    }

    // Convert file to Base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");

    const payload = {
      filename: `${ceremony}_${Date.now()}_${file.name}`,
      mimeType: file.type || (ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : ext === ".heic" ? "image/heic" : "image/jpeg"),
      base64: base64,
      ceremony: ceremony,
      uploaderEmail: uploaderEmail,
      driveFolderId: driveFolderId,
    };

    // Forward to Google Apps Script Web App
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    let data: { status?: string; id?: string; message?: string; folderId?: string } = {};
    try {
      data = await response.json();
    } catch {
      const errText = await response.text().catch(() => "");
      console.error("Non-JSON response from Google Apps Script:", errText);
      return NextResponse.json(
        { error: "Google Drive service temporarily returned an invalid response. Please try again." },
        { status: 502 }
      );
    }

    if (data.status === "error" || !data.id) {
      return NextResponse.json(
        { error: data.message || "Failed to upload to Google Drive" },
        { status: 500 }
      );
    }

    const driveUrl = `https://lh3.googleusercontent.com/d/${data.id}=s0`;
    let facesIndexed = 0;

    // Trigger AI Facial Recognition indexing
    try {
      const tmpFileName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
      tmpFilePath = path.join(os.tmpdir(), tmpFileName);
      await fs.writeFile(tmpFilePath, buffer);

      const pyPath = await resolvePythonExecutable();
      const { scriptPath, mlDir } = await resolveScriptPath();

      const { stdout } = await execFileAsync(
        pyPath,
        [
          scriptPath,
          "index-photo",
          "--event",
          eventId,
          "--photo-id",
          data.id,
          "--image",
          tmpFilePath,
          "--url",
          driveUrl,
        ],
        {
          timeout: 15000,
          env: {
            ...process.env,
            PYTHONPATH: mlDir,
          },
        }
      );

      const jsonMatch = stdout.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          facesIndexed = parsed.faces_indexed || 0;
        } catch {
          // Ignore JSON parse failure on stdout logging
        }
      }
    } catch (aiErr: unknown) {
      const msg = aiErr instanceof Error ? aiErr.message : String(aiErr);
      console.warn("AI indexing notification:", msg);
    }

    return NextResponse.json({
      success: true,
      fileId: data.id,
      url: driveUrl,
      name: file.name,
      ceremony: ceremony,
      facesIndexed: facesIndexed,
      uploaderEmail: uploaderEmail,
      driveFolderId: driveFolderId || data.folderId,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("Upload error:", msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  } finally {
    if (tmpFilePath) {
      await fs.unlink(tmpFilePath).catch(() => {});
    }
  }
}
