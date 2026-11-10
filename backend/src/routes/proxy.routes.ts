import { Router } from "express";
import fs from "fs";
import path from "path";
import { getDatabase } from "../db.js";
import { verifySignedPhotoUrl, getUploadsDir } from "../storage.js";

export const proxyRouter = Router();

proxyRouter.get("/", (req, res) => {
  try {
    const photoId = req.query.photoId as string;
    const expires = req.query.expires as string;
    const sig = req.query.sig as string;

    if (!photoId) {
      res.status(400).send("Missing photoId.");
      return;
    }

    // Verify HMAC signature if expires & sig are provided
    if (expires && sig) {
      const isValid = verifySignedPhotoUrl(photoId, expires, sig);
      if (!isValid) {
        res.status(403).send("Forbidden. Expired or invalid image signature.");
        return;
      }
    }

    const db = getDatabase();
    const photo = db.prepare("SELECT * FROM photos WHERE id = ?").get(photoId) as {
      id: string;
      filename: string;
      url: string;
      mime_type: string;
    } | undefined;

    if (!photo) {
      res.status(404).send("Photo not found.");
      return;
    }

    const uploadsDir = getUploadsDir();
    const localFilePath = path.join(uploadsDir, photo.filename);

    if (fs.existsSync(localFilePath)) {
      res.setHeader("Content-Type", photo.mime_type || "image/jpeg");
      res.setHeader("Cache-Control", "private, max-age=86400");
      fs.createReadStream(localFilePath).pipe(res);
      return;
    }

    // If file is a remote/sample asset
    if (photo.url.startsWith("http")) {
      res.redirect(photo.url);
      return;
    }

    res.status(404).send("Image file not found on disk.");
  } catch (err) {
    res.status(500).send((err as Error).message);
  }
});

