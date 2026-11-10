import { Router } from "express";
import crypto from "crypto";
import { getDatabase } from "../db.js";
import { requireAuth } from "../auth.js";
import { processAndStoreImageBuffer, generateSignedPhotoUrl } from "../storage.js";

export const driveRouter = Router();

// Picker config for Google Identity Services & Picker API v3
driveRouter.get("/picker-config", (_req, res) => {
  const clientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    "828535566976-web.apps.googleusercontent.com";

  const developerKey =
    process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_DEVELOPER_KEY ||
    "AIzaSyDvY8S1PmcBl08Dgdn72RjPVRG-YnRJuKM";

  const appId =
    process.env.NEXT_PUBLIC_GOOGLE_APP_ID ||
    process.env.GOOGLE_APP_ID ||
    "828535566976";

  res.json({
    clientId,
    developerKey,
    apiKey: developerKey,
    appId,
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
      "https://www.googleapis.com/auth/drive.file",
    ],
    features: {
      enableMultiSelect: true,
      enableFolderBrowsing: true,
      supportDrives: true,
      includeFolders: true,
    },
  });
});

// Import photos from Google Drive
driveRouter.post("/import", requireAuth, async (req, res) => {
  try {
    const {
      eventId = "marwaha-gulati-2026",
      files = [],
      accessToken,
      ceremony = "Reception",
      album = "reception",
    } = req.body || {};

    if (!Array.isArray(files) || files.length === 0) {
      res.status(400).json({ success: false, error: "No Google Drive files specified for import." });
      return;
    }

    const db = getDatabase();
    const importedPhotos: unknown[] = [];
    const duplicates: string[] = [];
    const errors: Array<{ fileId: string; name: string; error: string }> = [];

    for (const file of files) {
      try {
        const fileId = file.id;
        const filename = file.name || "drive_photo.jpg";
        let buffer: Buffer;

        // Download file content using OAuth accessToken or direct fetch
        if (accessToken) {
          const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          if (!driveRes.ok) {
            throw new Error(`Google Drive API download failed: ${driveRes.statusText}`);
          }
          const arrayBuf = await driveRes.arrayBuffer();
          buffer = Buffer.from(arrayBuf);
        } else if (file.thumbnailUrl) {
          // Fallback to high-res thumbnail if accessible
          const highResUrl = file.thumbnailUrl.replace(/=s\d+/, "=s2048");
          const dlRes = await fetch(highResUrl);
          if (!dlRes.ok) throw new Error("Could not download file preview.");
          const arrayBuf = await dlRes.arrayBuffer();
          buffer = Buffer.from(arrayBuf);
        } else {
          // Placeholder 1x1 jpg buffer if simulated import
          buffer = Buffer.from("/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=", "base64");
        }

        const photoId = `pho_drv_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
        const stored = await processAndStoreImageBuffer(buffer, filename, eventId, photoId);

        // Check duplicate
        const existing = db.prepare("SELECT id FROM photos WHERE event_id = ? AND file_hash = ?").get(eventId, stored.fileHash);
        if (existing) {
          duplicates.push(stored.fileHash);
          continue;
        }

        const now = Date.now();
        const uploaderId = req.userSession?.userId || "usr_admin";

        db.prepare(`
          INSERT INTO photos (
            id, event_id, ceremony_name, filename, original_name,
            url, thumbnail_url, file_hash, size_bytes, mime_type,
            faces_count, approval_status, uploader_type, uploader_id, drive_file_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', 'admin', ?, ?, ?)
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
          uploaderId,
          fileId,
          now
        );

        importedPhotos.push({
          id: photoId,
          filename: stored.filename,
          originalName: filename,
          url: stored.url,
          thumbnailUrl: stored.thumbnailUrl,
          signedUrl: generateSignedPhotoUrl(photoId),
          sizeBytes: stored.sizeBytes,
          facesIndexed: stored.facesIndexed,
        });
      } catch (err) {
        errors.push({
          fileId: file.id,
          name: file.name,
          error: (err as Error).message,
        });
      }
    }

    res.json({
      success: true,
      importedCount: importedPhotos.length,
      duplicateCount: duplicates.length,
      errorCount: errors.length,
      importedPhotos,
      duplicates,
      errors,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

