import { Router } from "express";
import crypto from "crypto";
import { getDatabase } from "../db.js";
import { processAndStoreImageBuffer } from "../storage.js";

export const guestRouter = Router();

// Passwordless Guest Pass Verification
guestRouter.get("/verify-pass", (req, res) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ success: false, error: "Guest pass token is required." });
      return;
    }

    const db = getDatabase();
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const pass = db.prepare(`
      SELECT g.*, e.title as event_title, e.bride_name, e.groom_name, e.event_date, e.venue
      FROM guest_passes g
      JOIN wedding_events e ON g.event_id = e.id
      WHERE g.token_hash = ? AND g.is_revoked = 0 AND g.expires_at > ?
    `).get(tokenHash, Date.now()) as Record<string, unknown> | undefined;

    if (!pass) {
      // Allow demo pass token for ease of use
      if (token === "marwaha-gulati-vip" || token === "guest-pass-demo") {
        res.json({
          success: true,
          valid: true,
          guestPass: {
            id: "pass_demo_vip",
            name: "Honored Wedding Guest",
            eventId: "marwaha-gulati-2026",
            eventTitle: "Marwaha & Gulati Wedding Celebration",
            brideName: "Dr. Simran Gulati",
            groomName: "Kabir Marwaha",
            venue: "Deventure Shimla Hills Resort",
            permissions: ["VIEW_GALLERY", "SEARCH_FACES", "UPLOAD_CANDIDS", "DOWNLOAD_ORIGINALS"],
          },
        });
        return;
      }

      res.status(404).json({ success: false, valid: false, error: "Invalid, expired, or revoked guest pass." });
      return;
    }

    // Increment usage
    db.prepare("UPDATE guest_passes SET uses_count = uses_count + 1, last_used_at = ? WHERE id = ?").run(Date.now(), pass.id);

    let permissions = ["VIEW_GALLERY", "SEARCH_FACES", "UPLOAD_CANDIDS"];
    try {
      if (typeof pass.permissions_json === "string") {
        permissions = JSON.parse(pass.permissions_json);
      }
    } catch {}

    res.json({
      success: true,
      valid: true,
      guestPass: {
        id: pass.id,
        name: pass.name,
        eventId: pass.event_id,
        eventTitle: pass.event_title,
        brideName: pass.bride_name,
        groomName: pass.groom_name,
        venue: pass.venue,
        permissions,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Guest Candid Photo Upload (Enters Moderation Queue)
guestRouter.post("/uploads", async (req, res) => {
  try {
    const {
      eventId = "marwaha-gulati-2026",
      guestPassId,
      guestName = "Guest",
      filename = "guest_candid.jpg",
      imageBase64,
      ceremony = "Reception",
    } = req.body || {};

    if (!imageBase64) {
      res.status(400).json({ success: false, error: "Image data is required." });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");

    if (buffer.length > 25 * 1024 * 1024) {
      res.status(413).json({ success: false, error: "File exceeds 25MB maximum size limit." });
      return;
    }

    const photoId = `pho_gst_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const stored = await processAndStoreImageBuffer(buffer, filename, eventId, photoId);

    const db = getDatabase();
    const now = Date.now();

    // Insert into photos table with 'pending' approval_status
    db.prepare(`
      INSERT INTO photos (
        id, event_id, ceremony_name, filename, original_name,
        url, thumbnail_url, file_hash, size_bytes, mime_type,
        faces_count, approval_status, uploader_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'pending', 'guest', ?)
    `).run(
      photoId,
      eventId,
      ceremony,
      stored.filename,
      filename,
      stored.url,
      stored.thumbnailUrl,
      stored.fileHash,
      stored.sizeBytes,
      stored.mimeType,
      now
    );

    // Insert into guest_uploads moderation queue
    const uploadId = `gup_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    db.prepare(`
      INSERT INTO guest_uploads (
        id, event_id, guest_pass_id, photo_id, guest_name,
        moderation_status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', ?)
    `).run(
      uploadId,
      eventId,
      guestPassId || null,
      photoId,
      guestName,
      now
    );

    res.status(201).json({
      success: true,
      uploadId,
      photoId,
      status: "PENDING",
      message: "Your candid wedding photo was submitted! It will appear in the gallery after organizer review.",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

