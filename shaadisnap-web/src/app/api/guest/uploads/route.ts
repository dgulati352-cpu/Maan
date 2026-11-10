import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/server/db";
import { verifyGuestToken } from "@/lib/server/guestPassStore";
import { processAndStoreImageBuffer } from "@/lib/server/storageService";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string | null;
    const file = formData.get("file") as File | null;
    const guestName = (formData.get("guestName") as string) || "Wedding Guest";
    const ceremony = (formData.get("ceremony") as string) || "Reception";

    let eventId = (formData.get("eventId") as string) || "marwaha-gulati-2026";
    let guestPassId: string | null = null;

    // Validate guest pass token if provided
    if (token) {
      const verification = verifyGuestToken(token);
      if (verification.valid && verification.eventId) {
        eventId = verification.eventId;
        guestPassId = verification.pass?.id || null;
      }
    }

    if (!file) {
      return NextResponse.json({ error: "No photo file provided." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size of 25 MB.` },
        { status: 400 }
      );
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported format '${ext}'. Allowed: JPG, PNG, WEBP.` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const photoId = `candid_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    // Store image buffer permanently
    const stored = await processAndStoreImageBuffer(
      buffer,
      file.name,
      eventId,
      photoId,
      file.type || "image/jpeg"
    );

    const db = getDatabase();
    const uploadId = `gu_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const now = Date.now();

    // Insert into photos table with status 'pending' (for moderation)
    db.prepare(`
      INSERT INTO photos (
        id, event_id, ceremony_name, filename, original_name, url, thumbnail_url,
        file_hash, size_bytes, mime_type, faces_count, approval_status, uploader_type,
        uploader_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      photoId,
      eventId,
      ceremony,
      stored.filename,
      file.name,
      stored.url,
      stored.thumbnailUrl,
      stored.fileHash,
      stored.sizeBytes,
      stored.mimeType,
      stored.facesDetected,
      "pending", // Requires admin moderation
      "guest",
      guestName,
      now
    );

    // Insert into guest_uploads table
    db.prepare(`
      INSERT INTO guest_uploads (
        id, event_id, guest_pass_id, photo_id, guest_name, moderation_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      uploadId,
      eventId,
      guestPassId,
      photoId,
      guestName,
      "PENDING",
      now
    );

    return NextResponse.json({
      success: true,
      message: "Photograph uploaded successfully! It is queued for host moderation.",
      uploadId,
      photoId,
      status: "PENDING_MODERATION",
      photo: {
        id: photoId,
        url: stored.url,
        thumbnailUrl: stored.thumbnailUrl,
        filename: stored.filename,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Guest upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

