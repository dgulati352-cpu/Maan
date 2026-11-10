import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/server/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, attending, message, phone, email, attendeeCount, dietaryPreferences, eventId } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const db = getDatabase();
    const rsvpId = `rsvp_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const attendanceStatus =
      attending === "yes" || attending === "ATTENDING"
        ? "ATTENDING"
        : attending === "no" || attending === "NOT_ATTENDING"
        ? "NOT_ATTENDING"
        : "TENTATIVE";

    const targetEventId = eventId || "marwaha-gulati-2026";
    const now = Date.now();

    db.prepare(`
      INSERT INTO rsvp_responses (
        id, event_id, guest_name, email, phone, attendance_status,
        attendee_count, dietary_preferences, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      rsvpId,
      targetEventId,
      name.trim(),
      email || null,
      phone || null,
      attendanceStatus,
      attendeeCount ? parseInt(attendeeCount, 10) : 1,
      dietaryPreferences || null,
      message ? message.trim() : null,
      now
    );

    return NextResponse.json({
      success: true,
      message: "RSVP successfully recorded!",
      rsvpId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to record RSVP";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

