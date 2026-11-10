import { NextRequest, NextResponse } from "next/server";
import {
  listPhotoProcessingJobs,
  createPhotoProcessingJob,
} from "@/lib/server/guestPassStore";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "marwaha-gulati-2026";

    const jobs = listPhotoProcessingJobs(eventId);
    const summary = {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "PENDING").length,
      processing: jobs.filter((j) => j.status === "PROCESSING").length,
      completed: jobs.filter((j) => j.status === "COMPLETED").length,
      failed: jobs.filter((j) => j.status === "FAILED").length,
    };

    return NextResponse.json({
      success: true,
      eventId,
      jobs,
      summary,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch photo processing jobs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, photoId, photoUrl, ceremony } = body;

    if (!photoId || !photoUrl) {
      return NextResponse.json({ error: "Missing required photoId or photoUrl" }, { status: 400 });
    }

    const job = createPhotoProcessingJob({
      eventId: eventId || "marwaha-gulati-2026",
      photoId,
      photoUrl,
      ceremony,
    });

    return NextResponse.json({ success: true, job });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create processing job";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

