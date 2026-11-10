import { Router } from "express";
import crypto from "crypto";
import { getDatabase } from "../db.js";
import { requireAuth } from "../auth.js";
import { processAndStoreImageBuffer, generateSignedPhotoUrl } from "../storage.js";

export const photosRouter = Router();

// Duplicate check
photosRouter.post("/duplicate-check", requireAuth, (req, res) => {
  try {
    const { eventId = "marwaha-gulati-2026", hashes, fileHash } = req.body || {};

    const targetHashes: string[] = [];
    if (fileHash && typeof fileHash === "string") {
      targetHashes.push(fileHash);
    }
    if (Array.isArray(hashes)) {
      for (const h of hashes) {
        if (typeof h === "string" && !targetHashes.includes(h)) {
          targetHashes.push(h);
        }
      }
    }

    if (targetHashes.length === 0) {
      res.json({ success: true, duplicates: [], isDuplicate: false });
      return;
    }

    const db = getDatabase();
    const placeholders = targetHashes.map(() => "?").join(",");
    const rows = db.prepare(`
      SELECT file_hash, id, filename FROM photos
      WHERE event_id = ? AND file_hash IN (${placeholders})
    `).all(eventId, ...targetHashes) as Array<{ file_hash: string; id: string; filename: string }>;

    const duplicates = rows.map((r) => r.file_hash);
    const isDuplicate = duplicates.length > 0;

    res.json({
      success: true,
      duplicates,
      duplicateCount: duplicates.length,
      isDuplicate,
      existingPhotos: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Photo Upload
photosRouter.post("/upload", requireAuth, async (req, res) => {
  try {
    const {
      eventId = "marwaha-gulati-2026",
      filename = "photo.jpg",
      imageBase64,
      ceremony = "Reception",
      album = "reception",
      uploaderType = "admin",
    } = req.body || {};

    if (!imageBase64) {
      res.status(400).json({ success: false, error: "Missing imageBase64 data." });
      return;
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const photoId = `pho_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const stored = await processAndStoreImageBuffer(buffer, filename, eventId, photoId);

    const db = getDatabase();
    const now = Date.now();
    const uploaderId = req.userSession?.userId || "usr_admin";

    db.prepare(`
      INSERT INTO photos (
        id, event_id, ceremony_name, filename, original_name,
        url, thumbnail_url, file_hash, size_bytes, mime_type,
        faces_count, approval_status, uploader_type, uploader_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, ?)
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
      stored.facesIndexed,
      uploaderType,
      uploaderId,
      now
    );

    // Create job record as COMPLETED
    db.prepare(`
      INSERT INTO photo_processing_jobs (id, event_id, photo_id, status, progress, created_at, updated_at)
      VALUES (?, ?, ?, 'COMPLETED', 100, ?, ?)
    `).run(`job_${photoId}`, eventId, photoId, now, now);

    res.status(201).json({
      success: true,
      photo: {
        id: photoId,
        url: stored.url,
        thumbnailUrl: stored.thumbnailUrl,
        signedUrl: generateSignedPhotoUrl(photoId),
        fileHash: stored.fileHash,
        facesIndexed: stored.facesIndexed,
        facesDetected: stored.facesDetected,
        sizeBytes: stored.sizeBytes,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// List photos
photosRouter.get("/", requireAuth, (req, res) => {
  try {
    const eventId = (req.query.eventId as string) || "marwaha-gulati-2026";
    const ceremony = req.query.ceremony as string;
    const db = getDatabase();

    let sql = "SELECT * FROM photos WHERE event_id = ?";
    const params: unknown[] = [eventId];

    if (ceremony && ceremony !== "All") {
      sql += " AND ceremony_name = ?";
      params.push(ceremony);
    }
    sql += " ORDER BY created_at DESC";

    const photos = db.prepare(sql).all(...params) as Array<Record<string, unknown>>;
    const mapped = photos.map((p) => ({
      ...p,
      signedUrl: generateSignedPhotoUrl(p.id as string),
    }));

    res.json({ success: true, photos: mapped, total: mapped.length });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Delete photo
photosRouter.delete("/:id", requireAuth, (req, res) => {
  try {
    const photoId = req.params.id;
    const db = getDatabase();
    const photo = db.prepare("SELECT * FROM photos WHERE id = ?").get(photoId) as { size_bytes: number; event_id: string } | undefined;

    if (!photo) {
      res.status(404).json({ success: false, error: "Photo not found." });
      return;
    }

    db.prepare("DELETE FROM photos WHERE id = ?").run(photoId);
    db.prepare("DELETE FROM photo_faces WHERE photo_id = ?").run(photoId);

    // Update storage
    db.prepare(`
      UPDATE storage_usage
      SET total_bytes = MAX(0, total_bytes - ?),
          photo_count = MAX(0, photo_count - 1),
          updated_at = ?
      WHERE event_id = ?
    `).run(photo.size_bytes, Date.now(), photo.event_id);

    res.json({ success: true, message: "Photo deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

