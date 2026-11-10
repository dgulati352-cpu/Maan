import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/server/db";
import { verifySessionToken, requireRole } from "@/lib/server/authService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "marwaha-gulati-2026";
    const status = searchParams.get("status"); // 'ATTENDING' | 'NOT_ATTENDING' | 'TENTATIVE' | 'ALL'
    const search = searchParams.get("search")?.toLowerCase();
    const exportCsv = searchParams.get("format") === "csv";

    const db = getDatabase();

    let query = `SELECT * FROM rsvp_responses WHERE event_id = ?`;
    const params: (string | number)[] = [eventId];

    if (status && status !== "ALL") {
      query += ` AND attendance_status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (LOWER(guest_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(phone) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const rsvps = db.prepare(query).all(...params) as Array<{
      id: string;
      event_id: string;
      guest_name: string;
      email: string | null;
      phone: string | null;
      attendance_status: string;
      attendee_count: number;
      dietary_preferences: string | null;
      message: string | null;
      created_at: number;
    }>;

    // Summary statistics
    const stats = {
      total: rsvps.length,
      attending: rsvps.filter((r) => r.attendance_status === "ATTENDING").length,
      notAttending: rsvps.filter((r) => r.attendance_status === "NOT_ATTENDING").length,
      totalGuestCount: rsvps
        .filter((r) => r.attendance_status === "ATTENDING")
        .reduce((acc, r) => acc + (r.attendee_count || 1), 0),
    };

    if (exportCsv) {
      const headers = "ID,Guest Name,Email,Phone,Status,Count,Dietary Preferences,Message,Date\n";
      const rows = rsvps
        .map((r) =>
          [
            r.id,
            `"${(r.guest_name || "").replace(/"/g, '""')}"`,
            r.email || "",
            r.phone || "",
            r.attendance_status,
            r.attendee_count,
            `"${(r.dietary_preferences || "").replace(/"/g, '""')}"`,
            `"${(r.message || "").replace(/"/g, '""')}"`,
            new Date(r.created_at).toISOString(),
          ].join(",")
        )
        .join("\n");

      return new NextResponse(headers + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="wedding_rsvps_${eventId}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      eventId,
      stats,
      rsvps,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch RSVPs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

