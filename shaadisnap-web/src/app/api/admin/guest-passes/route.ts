import { NextRequest, NextResponse } from "next/server";
import {
  createGuestPass,
  listGuestPasses,
  revokeGuestPass,
  regenerateGuestPass,
  getGuestPassStats,
} from "@/lib/server/guestPassStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "marwaha-gulati-2026";

    const passes = listGuestPasses(eventId);
    const stats = getGuestPassStats(eventId);

    return NextResponse.json({
      success: true,
      eventId,
      passes,
      stats,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch guest passes";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventId = body.eventId || "marwaha-gulati-2026";
    const eventName = body.eventName || "Marwaha & Gulati Wedding Celebration";
    const guestName = body.guestName;
    const guestPhone = body.guestPhone;
    const expiresInHours =
      body.expiresInHours !== undefined ? Number(body.expiresInHours) : null;
    const maxScans = body.maxScans !== undefined ? Number(body.maxScans) : null;

    const origin =
      req.headers.get("origin") ||
      (req.headers.get("host") ? `https://${req.headers.get("host")}` : "https://maan-gulati.vercel.app");

    const result = createGuestPass(
      {
        eventId,
        eventName,
        guestName,
        guestPhone,
        expiresInHours,
        maxScans,
      },
      origin
    );

    return NextResponse.json({
      success: true,
      pass: result.pass,
      rawToken: result.rawToken,
      guestUrl: result.guestUrl,
      whatsappMessage: result.whatsappMessage,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create guest pass";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, passId, reason } = body;

    if (!passId) {
      return NextResponse.json({ error: "Missing passId" }, { status: 400 });
    }

    const origin =
      req.headers.get("origin") ||
      (req.headers.get("host") ? `https://${req.headers.get("host")}` : "https://maan-gulati.vercel.app");

    if (action === "revoke") {
      const revoked = revokeGuestPass(passId, reason || "Revoked by host from Admin Dashboard");
      if (!revoked) {
        return NextResponse.json({ error: "Guest pass not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "Guest pass revoked successfully." });
    }

    if (action === "regenerate") {
      const result = regenerateGuestPass(passId, origin);
      if (!result) {
        return NextResponse.json({ error: "Guest pass not found" }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: "Guest pass regenerated successfully.",
        pass: result.pass,
        rawToken: result.rawToken,
        guestUrl: result.guestUrl,
        whatsappMessage: result.whatsappMessage,
      });
    }

    return NextResponse.json({ error: "Invalid action. Supported: revoke, regenerate" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update guest pass";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

