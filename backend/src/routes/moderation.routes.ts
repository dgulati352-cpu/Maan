import { Router } from "express";
import { getDatabase } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";
import { generateSignedPhotoUrl } from "../storage.js";

export const moderationRouter = Router();

// GET moderation queue
moderationRouter.get("/", requireAuth, requireRole(["SUPER_ADMIN", "EVENT_ADMIN"]), (req, res) => {
  try {
    const eventId = (req.query.eventId as string) || "marwaha-gulati-2026";
    const status = (req.query.status as string) || "PENDING";
    const db = getDatabase();

    const sql = `
      SELECT g.id as submission_id, g.event_id, g.guest_name, g.moderation_status,
             g.created_at as submitted_at, p.id as photo_id, p.filename, p.original_name,
             p.url, p.thumbnail_url, p.size_bytes, p.faces_count, p.file_hash
      FROM guest_uploads g
      JOIN photos p ON g.photo_id = p.id
      WHERE g.event_id = ? AND g.moderation_status = ?
      ORDER BY g.created_at ASC
    `;

    const submissions = (db.prepare(sql).all(eventId, status) as Array<Record<string, unknown>>).map((s) => ({
      ...s,
      signedUrl: generateSignedPhotoUrl(s.photo_id as string),
    }));

    res.json({ success: true, count: submissions.length, submissions });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// POST moderate photo (APPROVE / REJECT)
moderationRouter.post("/", requireAuth, requireRole(["SUPER_ADMIN", "EVENT_ADMIN"]), async (req, res) => {
  try {
    const { submissionId, photoId, action } = req.body || {};

    if ((!submissionId && !photoId) || !["APPROVE", "REJECT"].includes(action)) {
      res.status(400).json({ success: false, error: "Missing submissionId/photoId or valid action (APPROVE/REJECT)." });
      return;
    }

    const db = getDatabase();
    const now = Date.now();
    const reviewerId = req.userSession?.userId || "admin";
    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const photoApprovalStatus = action === "APPROVE" ? "approved" : "rejected";

    if (submissionId) {
      db.prepare(`
        UPDATE guest_uploads
        SET moderation_status = ?, moderated_by = ?, moderated_at = ?
        WHERE id = ?
      `).run(newStatus, reviewerId, now, submissionId);

      // Find photo_id
      const sub = db.prepare("SELECT photo_id, event_id FROM guest_uploads WHERE id = ?").get(submissionId) as { photo_id: string; event_id: string } | undefined;
      if (sub) {
        db.prepare("UPDATE photos SET approval_status = ? WHERE id = ?").run(photoApprovalStatus, sub.photo_id);
      }
    } else if (photoId) {
      db.prepare("UPDATE photos SET approval_status = ? WHERE id = ?").run(photoApprovalStatus, photoId);
      db.prepare(`
        UPDATE guest_uploads
        SET moderation_status = ?, moderated_by = ?, moderated_at = ?
        WHERE photo_id = ?
      `).run(newStatus, reviewerId, now, photoId);
    }

    res.json({
      success: true,
      action,
      status: newStatus,
      message: `Photo successfully ${action === "APPROVE" ? "approved and made public" : "rejected"}.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

