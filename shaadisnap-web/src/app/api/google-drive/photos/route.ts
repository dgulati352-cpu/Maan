import { NextRequest, NextResponse } from "next/server";
import { SAMPLE_GOOGLE_DRIVE_PHOTOS } from "@/lib/googleAuth";

/**
 * GET /api/google-drive/photos
 * 
 * Returns photos from user's Google Drive storage, optionally filtered by albumId or ceremony.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const albumId = searchParams.get("albumId");
    const ceremony = searchParams.get("ceremony");

    let photos = [...SAMPLE_GOOGLE_DRIVE_PHOTOS];

    if (albumId && albumId !== "all") {
      photos = photos.filter((p) => p.albumId === albumId);
    }

    if (ceremony && ceremony !== "All") {
      photos = photos.filter(
        (p) => p.ceremony.toLowerCase() === ceremony.toLowerCase()
      );
    }

    return NextResponse.json({
      success: true,
      photos,
      count: photos.length,
      albumId: albumId || "all",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve Google Drive photos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
