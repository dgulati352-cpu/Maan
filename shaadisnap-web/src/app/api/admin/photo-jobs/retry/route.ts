import { NextRequest, NextResponse } from "next/server";
import { retryFailedJobs } from "@/lib/server/guestPassStore";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventId = body.eventId || "marwaha-gulati-2026";

    const retriedCount = retryFailedJobs(eventId);

    return NextResponse.json({
      success: true,
      retriedCount,
      message: `Reset ${retriedCount} failed job(s) to PENDING for re-indexing.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to retry jobs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

