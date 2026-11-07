import { NextRequest, NextResponse } from "next/server";
import { getScopedGoogleDriveAlbums } from "@/lib/googleAuth";

/**
 * GET /api/google-drive/albums
 * 
 * Returns wedding photo albums dynamically scoped to the authenticated user's Google Drive.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email") || req.headers.get("x-user-email") || undefined;
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    const albums = getScopedGoogleDriveAlbums(email);

    return NextResponse.json({
      success: true,
      albums: albums,
      total: albums.length,
      email: email || "active_session",
      authenticated: Boolean(token),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to retrieve Google Drive albums";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
