import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/server/db";
import { verifySessionToken, requireRole } from "@/lib/server/authService";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "marwaha-gulati-2026";
    const status = searchParams.get("status") || "PENDING";

    const db = getDatabase();
    const submissions = db.prepare(`
      SELECT 
        gu.id as upload_id,
        gu.guest_name,
        gu.moderation_status,
        gu.created_at,
        p.id as photo_id,
        p.url,
        p.thumbnail_url,
        p.filename,
        p.ceremony_name,
        p.faces_count,
        p.size_bytes
      FROM guest_uploads gu
      JOIN photos p ON p.id = gu.photo_id
      WHERE gu.event_id = ? AND gu.moderation_status = ?
      ORDER BY gu.created_at DESC
    `).all(eventId, status);

    return NextResponse.json({
      success: true,
      eventId,
      count: submissions.length,
      submissions,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch moderation queue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("shaadisnap_session")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    const session = verifySessionToken(token || "");
    if (!session || !requireRole(session, ["SUPER_ADMIN", "EVENT_ADMIN"])) {
      return NextResponse.json({ error: "Unauthorized. Admin privileges required." }, { status: 403 });
    }

    const body = await req.json();
    const { uploadId, photoId, action } = body; // action: 'APPROVE' | 'REJECT'

    if (!action || (!uploadId && !photoId)) {
      return NextResponse.json({ error: "Action and uploadId/photoId are required." }, { status: 400 });
    }

    const db = getDatabase();
    const newStatus = action.toUpperCase() === "APPROVE" ? "APPROVED" : "REJECTED";
    const photoApproval = action.toUpperCase() === "APPROVE" ? "approved" : "rejected";
    const now = Date.now();

    if (uploadId) {
      db.prepare(`
        UPDATE guest_uploads 
        SET moderation_status = ?, moderated_by = ?, moderated_at = ?
        WHERE id = ?
      `).run(newStatus, session.name, now, uploadId);

      // Also update photos table
      db.prepare(`
        UPDATE photos
        SET approval_status = ?
        WHERE id = (SELECT photo_id FROM guest_uploads WHERE id = ?)
      `).run(photoApproval, uploadId);
    } else if (photoId) {
      db.prepare(`
        UPDATE photos
        SET approval_status = ?
        WHERE id = ?
      `).run(photoApproval, photoId);

      db.prepare(`
        UPDATE guest_uploads
        SET moderation_status = ?, moderated_by = ?, moderated_at = ?
        WHERE photo_id = ?
      `).run(newStatus, session.name, now, photoId);
    }

    return NextResponse.json({
      success: true,
      message: `Photograph successfully ${newStatus.toLowerCase()}!`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Moderation action failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

