import { NextRequest, NextResponse } from "next/server";
import { getScopedGoogleDrivePhotos } from "@/lib/googleAuth";

/**
 * GET /api/google-drive/photos
 * 
 * Returns photos dynamically scoped to user's Google Drive storage, optionally filtered by albumId or ceremony.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || req.headers.get("x-user-email") || undefined;
    const albumId = searchParams.get("albumId") || undefined;
    const ceremony = searchParams.get("ceremony") || undefined;

    const photos = getScopedGoogleDrivePhotos(email, albumId, ceremony);

    return NextResponse.json({
      success: true,
      photos,
      count: photos.length,
      albumId: albumId || "all",
      email: email || "active_session",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve Google Drive photos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
