import { Router } from "express";
import crypto from "crypto";
import { getDatabase } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

export const eventsRouter = Router();

// GET all events
eventsRouter.get("/", requireAuth, requireRole(["SUPER_ADMIN", "EVENT_ADMIN"]), (_req, res) => {
  try {
    const db = getDatabase();
    const events = db.prepare(`
      SELECT e.*, 
             COALESCE(s.total_bytes, 0) as total_bytes_used,
             COALESCE(s.photo_count, 0) as photo_count
      FROM wedding_events e
      LEFT JOIN storage_usage s ON e.id = s.event_id
      ORDER BY e.created_at DESC
    `).all();

    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// POST create event
eventsRouter.post("/", requireAuth, requireRole(["SUPER_ADMIN"]), (req, res) => {
  try {
    const {
      title,
      brideName,
      groomName,
      eventDate,
      venue,
      location,
      coverImage,
      description,
      storageAllocatedGb = 50,
    } = req.body || {};

    if (!title || !brideName || !groomName || !eventDate || !venue) {
      res.status(400).json({ success: false, error: "Missing required wedding event fields." });
      return;
    }

    const db = getDatabase();
    const eventId = `evt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const baseSlug = `${brideName.toLowerCase().replace(/[^a-z0-9]/g, "")}-${groomName.toLowerCase().replace(/[^a-z0-9]/g, "")}-wedding`;
    const slugSuffix = crypto.randomBytes(2).toString("hex");
    const slug = `${baseSlug}-${slugSuffix}`;

    const now = Date.now();
    const storageAllocatedBytes = Number(storageAllocatedGb) * 1024 * 1024 * 1024;
    const organizerId = req.userSession?.userId || "usr_super_admin_001";

    db.prepare(`
      INSERT INTO wedding_events (
        id, slug, title, bride_name, groom_name, event_date, venue, location,
        cover_image, description, status, organizer_id, storage_allocated_bytes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)
    `).run(
      eventId,
      slug,
      title,
      brideName,
      groomName,
      eventDate,
      venue,
      location || venue,
      coverImage || "/hero-couple.jpg",
      description || "",
      organizerId,
      storageAllocatedBytes,
      now,
      now
    );

    // Auto-create default ceremonies and albums
    const defaultCeremonies = ["Mehendi", "Haldi", "Engagement", "Sangeet", "Baraat", "Phere", "Reception", "Custom"];
    for (const cer of defaultCeremonies) {
      const cerSlug = cer.toLowerCase().replace(/[^a-z0-9]/g, "");
      db.prepare(`
        INSERT INTO ceremonies (id, event_id, name, slug, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `cer_${cerSlug}_${eventId}`,
        eventId,
        cer,
        cerSlug,
        `${cer} Ceremony`,
        now
      );

      db.prepare(`
        INSERT INTO albums (id, event_id, ceremony_id, name, slug, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        `alb_${cerSlug}_${eventId}`,
        eventId,
        `cer_${cerSlug}_${eventId}`,
        `${cer} Album`,
        cerSlug,
        `Photographs from ${cer}`,
        now
      );
    }

    // Initialize storage tracking
    db.prepare(`
      INSERT INTO storage_usage (id, event_id, total_bytes, photo_count, thumbnail_bytes, updated_at)
      VALUES (?, ?, 0, 0, 0, ?)
    `).run(`storage_${eventId}`, eventId, now);

    res.status(201).json({
      success: true,
      event: {
        id: eventId,
        slug,
        title,
        brideName,
        groomName,
        eventDate,
        venue,
        location,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// GET event by ID
eventsRouter.get("/:id", requireAuth, (req, res) => {
  try {
    const db = getDatabase();
    const event = db.prepare("SELECT * FROM wedding_events WHERE id = ? OR slug = ?").get(req.params.id, req.params.id);
    if (!event) {
      res.status(404).json({ success: false, error: "Wedding event not found." });
      return;
    }
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

