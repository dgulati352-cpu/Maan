import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/server/db";
import { verifySessionToken, requireRole } from "@/lib/server/authService";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const db = getDatabase();
    const token =
      req.cookies.get("shaadisnap_session")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const session = token ? verifySessionToken(token) : null;
    // Allow viewing events if authenticated or return public active events list
    const events = db.prepare(`
      SELECT 
        e.*,
        COALESCE(s.total_bytes, 0) as storage_used_bytes,
        COALESCE(s.photo_count, 0) as total_photos,
        (SELECT COUNT(*) FROM guest_passes gp WHERE gp.event_id = e.id AND gp.is_revoked = 0) as active_passes_count
      FROM wedding_events e
      LEFT JOIN storage_usage s ON s.event_id = e.id
      ORDER BY e.created_at DESC
    `).all();

    return NextResponse.json({ success: true, events });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch wedding events";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDatabase();
    const token =
      req.cookies.get("shaadisnap_session")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const session = verifySessionToken(token || "");
    if (!session || !requireRole(session, ["SUPER_ADMIN", "EVENT_ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      bride_name,
      groom_name,
      event_date,
      venue,
      location,
      cover_image,
      description,
      storage_allocated_bytes,
    } = body;

    if (!title || !bride_name || !groom_name) {
      return NextResponse.json(
        { error: "Title, Bride name, and Groom name are required fields." },
        { status: 400 }
      );
    }

    const baseSlug = `${bride_name}-${groom_name}-${new Date().getFullYear()}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const slug = `${baseSlug}-${crypto.randomBytes(2).toString("hex")}`;
    
    const eventId = `evt_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO wedding_events (
        id, slug, title, bride_name, groom_name, event_date, venue, location,
        cover_image, description, status, organizer_id, storage_allocated_bytes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventId,
      slug,
      title,
      bride_name,
      groom_name,
      event_date || "2026-11-12",
      venue || "Grand Palace",
      location || "India",
      cover_image || "/hero-couple.jpg",
      description || "Wedding celebration",
      "active",
      session.userId,
      storage_allocated_bytes || 53687091200,
      now,
      now
    );

    // Create 8 standard ceremony categories
    const ceremonies = [
      { name: "Mehendi", slug: "mehendi" },
      { name: "Haldi", slug: "haldi" },
      { name: "Engagement", slug: "engagement" },
      { name: "Sangeet", slug: "sangeet" },
      { name: "Baraat", slug: "baraat" },
      { name: "Phere", slug: "phere" },
      { name: "Reception", slug: "reception" },
      { name: "Custom", slug: "custom" },
    ];

    for (const c of ceremonies) {
      const cerId = `cer_${c.slug}_${eventId.slice(-6)}`;
      db.prepare(`
        INSERT INTO ceremonies (id, event_id, name, slug, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(cerId, eventId, c.name, c.slug, now);

      db.prepare(`
        INSERT INTO albums (id, event_id, ceremony_id, name, slug, description, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(`alb_${c.slug}_${eventId.slice(-6)}`, eventId, cerId, `${c.name} Album`, c.slug, `Photographs from ${c.name}`, now);
    }

    // Initialize storage usage entry
    db.prepare(`
      INSERT INTO storage_usage (id, event_id, total_bytes, photo_count, thumbnail_bytes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(`storage_${eventId}`, eventId, 0, 0, 0, now);

    return NextResponse.json({
      success: true,
      event: {
        id: eventId,
        slug,
        title,
        bride_name,
        groom_name,
        event_date,
        venue,
        location,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create wedding event";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
