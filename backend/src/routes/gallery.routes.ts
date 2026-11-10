import { Router } from "express";
import { getDatabase } from "../db.js";
import { generateSignedPhotoUrl } from "../storage.js";

export const galleryRouter = Router();

galleryRouter.get("/photos", (req, res) => {
  try {
    const eventId = (req.query.eventId as string) || "marwaha-gulati-2026";
    const ceremony = (req.query.ceremony as string) || "All";
    const search = ((req.query.search as string) || "").trim();
    const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || "50", 10)));
    const offset = (page - 1) * limit;

    const db = getDatabase();

    // Available ceremonies
    const ceremonyRows = db.prepare("SELECT name FROM ceremonies WHERE event_id = ? ORDER BY name ASC").all(eventId) as Array<{ name: string }>;
    const ceremonyNames = ["All", ...ceremonyRows.map((c) => c.name)];

    let countSql = "SELECT COUNT(*) as total FROM photos WHERE event_id = ? AND approval_status = 'approved'";
    let dataSql = "SELECT * FROM photos WHERE event_id = ? AND approval_status = 'approved'";
    const countParams: unknown[] = [eventId];
    const dataParams: unknown[] = [eventId];

    if (ceremony && ceremony !== "All") {
      countSql += " AND ceremony_name = ?";
      dataSql += " AND ceremony_name = ?";
      countParams.push(ceremony);
      dataParams.push(ceremony);
    }

    if (search) {
      countSql += " AND (filename LIKE ? OR original_name LIKE ?)";
      dataSql += " AND (filename LIKE ? OR original_name LIKE ?)";
      countParams.push(`%${search}%`, `%${search}%`);
      dataParams.push(`%${search}%`, `%${search}%`);
    }

    dataSql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    dataParams.push(limit, offset);

    const totalCount = (db.prepare(countSql).get(...countParams) as { total: number })?.total || 0;
    const rawPhotos = db.prepare(dataSql).all(...dataParams) as Array<{
      id: string;
      url: string;
      thumbnail_url: string;
      filename: string;
      original_name: string;
      ceremony_name: string;
      faces_count: number;
      size_bytes: number;
      created_at: number;
    }>;

    const photos = rawPhotos.map((p) => ({
      id: p.id,
      url: generateSignedPhotoUrl(p.id),
      rawUrl: p.url,
      thumbnailUrl: p.thumbnail_url,
      title: p.original_name || p.filename,
      ceremony: p.ceremony_name,
      facesCount: p.faces_count,
      sizeBytes: p.size_bytes,
      createdAt: new Date(p.created_at).toISOString(),
    }));

    res.json({
      success: true,
      eventId,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      ceremonies: ceremonyNames,
      photos,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

