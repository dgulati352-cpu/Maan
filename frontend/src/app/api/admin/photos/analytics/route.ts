import { NextRequest, NextResponse } from "next/server";
import { getAdminPhotoAnalytics } from "@/lib/server/adminPhotoManager";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/photos/analytics
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "marwaha-gulati-2026";

    const analytics = getAdminPhotoAnalytics(eventId);

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to load photo analytics";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

