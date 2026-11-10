import { NextRequest, NextResponse } from "next/server";
import { verifyGuestToken } from "@/lib/server/guestPassStore";
import { WEDDING_EVENT } from "@/data/mockWeddingData";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, valid: false, error: "Missing guest pass token in query." },
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const verification = verifyGuestToken(token, {
      ipAddress,
      userAgent,
      recordAccess: true,
    });

    if (!verification.valid || !verification.pass) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: verification.error || "Invalid or revoked guest pass.",
        },
        { status: 403 }
      );
    }

    // Public sanitized event details (zero internal secrets or complete album leak)
    return NextResponse.json({
      success: true,
      valid: true,
      eventId: verification.pass.eventId,
      pass: {
        id: verification.pass.id,
        guestName: verification.pass.guestName || "Distinguished Guest",
        eventId: verification.pass.eventId,
        eventName: verification.pass.eventName,
        expiresAt: verification.pass.expiresAt,
        scanCount: verification.pass.scanCount,
        maxScans: verification.pass.maxScans,
      },
      event: {
        id: verification.pass.eventId,
        name: verification.pass.eventName,
        couple: WEDDING_EVENT.couple,
        venue: WEDDING_EVENT.venue,
        date: WEDDING_EVENT.date,
        coverPhoto: "/hero-couple.jpg",
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, valid: false, error: msg },
      { status: 500 }
    );
  }
}

