import { NextRequest, NextResponse } from "next/server";
import {
  listAdminAlbums,
  createAdminAlbum,
} from "@/lib/server/adminPhotoManager";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/albums
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "marwaha-gulati-2026";

    const albums = listAdminAlbums(eventId);

    return NextResponse.json({
      success: true,
      count: albums.length,
      albums,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch albums";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * POST /api/admin/albums
 * Body: { eventId?: string, name: string, ceremony: string, description?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId = "marwaha-gulati-2026", name, ceremony = "Reception", description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Album name is required" }, { status: 400 });
    }

    const album = createAdminAlbum(eventId, name.trim(), ceremony, description);

    return NextResponse.json({
      success: true,
      album,
      message: `Album "${album.name}" created successfully.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to create album";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

