import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/server/db";
import { generateSignedPhotoUrl } from "@/lib/server/storageService";
import { listAdminPhotos } from "@/lib/server/adminPhotoManager";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "marwaha-gulati-2026";
    const ceremony = searchParams.get("ceremony") || "All";
    const album = searchParams.get("album") || "All";
    const search = searchParams.get("search")?.toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "40", 10)));

    const db = getDatabase();

    // Query SQLite database for approved photos
    let query = `
      SELECT * FROM photos 
      WHERE event_id = ? AND approval_status = 'approved'
    `;
    const params: (string | number)[] = [eventId];

    if (ceremony && ceremony !== "All") {
      query += ` AND (LOWER(ceremony_name) = LOWER(?) OR LOWER(ceremony_id) = LOWER(?))`;
      params.push(ceremony, `cer_${ceremony.toLowerCase()}`);
    }

    if (search) {
      query += ` AND (LOWER(filename) LIKE ? OR LOWER(ceremony_name) LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const allPhotos = db.prepare(query).all(...params) as Array<{
      id: string;
      filename: string;
      ceremony_name: string;
      url: string;
      thumbnail_url: string;
      faces_count: number;
      size_bytes: number;
      created_at: number;
    }>;

    // Fallback: If database is freshly initialized or photos were uploaded via admin vault
    let combinedPhotos = allPhotos;
    if (combinedPhotos.length === 0) {
      const vaultPhotos = listAdminPhotos(eventId)
        .filter((p) => p.approvalStatus === "approved" || p.id === "hero_couple_photo")
        .map((p) => ({
          id: p.id,
          filename: p.filename,
          ceremony_name: p.ceremony,
          url: p.url,
          thumbnail_url: p.thumbnailUrl,
          faces_count: p.facesIndexed || p.facesDetected || 1,
          size_bytes: p.sizeBytes,
          created_at: new Date(p.createdAt).getTime(),
        }));
      combinedPhotos = vaultPhotos;
    }

    // Apply pagination
    const total = combinedPhotos.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const pagedPhotos = combinedPhotos.slice(startIndex, startIndex + limit).map((p) => {
      // Secure HMAC-signed proxy URL for private photo delivery
      const signedUrl = p.url.startsWith("/uploads/photos/")
        ? generateSignedPhotoUrl(p.id, 86400) // 24h validity
        : p.url;
      const signedThumb = p.thumbnail_url.startsWith("/uploads/thumbnails/")
        ? generateSignedPhotoUrl(`thumb_${p.id}`, 86400)
        : p.thumbnail_url;

      return {
        id: p.id,
        url: signedUrl,
        rawUrl: p.url,
        thumbnailUrl: signedThumb,
        title: p.filename,
        ceremony: p.ceremony_name || "Reception",
        facesCount: p.faces_count || 1,
        sizeBytes: p.size_bytes,
        createdAt: new Date(p.created_at).toISOString(),
      };
    });

    // Query ceremony list for event
    const ceremonies = db.prepare("SELECT name, slug FROM ceremonies WHERE event_id = ?").all(eventId) as Array<{ name: string; slug: string }>;

    return NextResponse.json({
      success: true,
      eventId,
      total,
      page,
      totalPages,
      ceremonies: ["All", ...ceremonies.map((c) => c.name)],
      photos: pagedPhotos,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load gallery photos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

