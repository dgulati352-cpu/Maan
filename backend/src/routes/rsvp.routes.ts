import { Router } from "express";
import crypto from "crypto";
import { getDatabase } from "../db.js";
import { requireAuth, requireRole } from "../auth.js";

export const rsvpRouter = Router();

// Guest RSVP submission (Public)
rsvpRouter.post("/", (req, res) => {
  try {
    const {
      eventId = "marwaha-gulati-2026",
      guestName,
      email,
      phone,
      attendanceStatus = "ATTENDING",
      attendeeCount = 1,
      dietaryPreferences,
      message,
    } = req.body || {};

    if (!guestName || !attendanceStatus) {
      res.status(400).json({ success: false, error: "Guest name and attendance status are required." });
      return;
    }

    const db = getDatabase();
    const rsvpId = `rsvp_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const now = Date.now();

    db.prepare(`
      INSERT INTO rsvp_responses (
        id, event_id, guest_name, email, phone, attendance_status,
        attendee_count, dietary_preferences, message, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      rsvpId,
      eventId,
      guestName,
      email || null,
      phone || null,
      attendanceStatus,
      Math.max(1, Number(attendeeCount) || 1),
      dietaryPreferences || null,
      message || null,
      now
    );

    res.status(201).json({
      success: true,
      id: rsvpId,
      message: "RSVP recorded successfully. Thank you!",
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

// Admin RSVP View & CSV Export
rsvpRouter.get("/", requireAuth, requireRole(["SUPER_ADMIN", "EVENT_ADMIN"]), (req, res) => {
  try {
    const eventId = (req.query.eventId as string) || "marwaha-gulati-2026";
    const status = req.query.status as string;
    const format = req.query.format as string;
    const db = getDatabase();

    let sql = "SELECT * FROM rsvp_responses WHERE event_id = ?";
    const params: unknown[] = [eventId];

    if (status && status !== "ALL") {
      sql += " AND attendance_status = ?";
      params.push(status);
    }
    sql += " ORDER BY created_at DESC";

    const rows = db.prepare(sql).all(...params) as Array<{
      id: string;
      guest_name: string;
      email: string | null;
      phone: string | null;
      attendance_status: string;
      attendee_count: number;
      dietary_preferences: string | null;
      message: string | null;
      created_at: number;
    }>;

    if (format === "csv") {
      const headers = ["ID", "Guest Name", "Email", "Phone", "Status", "Guests Count", "Dietary", "Message", "Submitted At"];
      const csvLines = [headers.join(",")];

      for (const r of rows) {
        const line = [
          r.id,
          `"${(r.guest_name || "").replace(/"/g, '""')}"`,
          `"${(r.email || "").replace(/"/g, '""')}"`,
          `"${(r.phone || "").replace(/"/g, '""')}"`,
          r.attendance_status,
          r.attendee_count,
          `"${(r.dietary_preferences || "").replace(/"/g, '""')}"`,
          `"${(r.message || "").replace(/"/g, '""')}"`,
          new Date(r.created_at).toISOString(),
        ];
        csvLines.push(line.join(","));
      }

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="wedding_rsvp_${eventId}.csv"`);
      res.send(csvLines.join("\n"));
      return;
    }

    const attendingCount = rows.filter((r) => r.attendance_status === "ATTENDING").reduce((acc, r) => acc + r.attendee_count, 0);
    const notAttendingCount = rows.filter((r) => r.attendance_status === "NOT_ATTENDING").length;
    const tentativeCount = rows.filter((r) => r.attendance_status === "TENTATIVE").length;

    res.json({
      success: true,
      totalResponses: rows.length,
      stats: {
        attendingGuests: attendingCount,
        notAttendingCount,
        tentativeCount,
      },
      responses: rows,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: (err as Error).message });
  }
});

