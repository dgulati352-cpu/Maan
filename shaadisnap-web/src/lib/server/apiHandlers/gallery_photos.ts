import { NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/server/db";
import { generateSignedPhotoUrl } from "@/lib/server/storageService";
import { listAdminPhotos } from "@/lib/server/adminPhotoManager";
import { fetchLiveDriveFolderPhotos } from "@/lib/server/googleDriveSync";

export const dynamic = "force-dynamic";

interface MergedGalleryRow {
  id: string;
  driveFileId?: string;
  filename: string;
  ceremony_name: string;
  url: string;
  thumbnail_url: string;
  fallback_url?: string;
  faces_count: number;
  size_bytes: number;
  created_at: number;
  photographer?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "marwaha-gulati-2026";
    const ceremony = searchParams.get("ceremony") || "All";
    const search = searchParams.get("search")?.toLowerCase();
    const parsedPage = parseInt(searchParams.get("page") || "1", 10);
    const parsedLimit = parseInt(searchParams.get("limit") || "60", 10);
    const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage);
    const limit = Math.max(1, Math.min(100, Number.isNaN(parsedLimit) ? 60 : parsedLimit));

    // Scope official Drive folder sync strictly to primary wedding event (or default)
    const drivePhotosPromise =
      eventId === "marwaha-gulati-2026"
        ? fetchLiveDriveFolderPhotos().catch(() => [])
        : Promise.resolve([]);

    // Query SQLite database safely for approved photos
    let dbRows: Array<{
      id: string;
      filename: string;
      ceremony_name: string;
      url: string;
      thumbnail_url: string;
      faces_count: number;
      size_bytes: number;
      created_at: number;
    }> = [];
    let ceremonies: Array<{ name: string; slug: string }> = [
      { name: "Phere", slug: "phere" },
      { name: "Sangeet", slug: "sangeet" },
      { name: "Mehendi", slug: "mehendi" },
      { name: "Haldi", slug: "haldi" },
      { name: "Reception", slug: "reception" },
    ];

    try {
      const db = getDatabase();
      dbRows = db
        .prepare(`SELECT * FROM photos WHERE event_id = ? AND approval_status = 'approved' ORDER BY created_at DESC`)
        .all(eventId) as typeof dbRows;
      const dbCeremonies = db
        .prepare("SELECT name, slug FROM ceremonies WHERE event_id = ?")
        .all(eventId) as Array<{ name: string; slug: string }>;
      if (dbCeremonies.length > 0) {
        ceremonies = Array.from(
          new Map(dbCeremonies.map((c) => [c.name, c])).values()
        );
      }
    } catch {
      // Non-fatal fallback in restricted serverless sandboxes
    }

    // Collect approved photos from admin vault as well as SQLite
    const vaultRows: MergedGalleryRow[] = listAdminPhotos(eventId)
      .filter((p) => p.approvalStatus === "approved" || p.id === "hero_couple_photo")
      .map((p) => {
        const ts = new Date(p.createdAt).getTime();
        return {
          id: p.id,
          driveFileId: p.driveFileId,
          filename: p.filename,
          ceremony_name: p.ceremony,
          url: p.url,
          thumbnail_url: p.thumbnailUrl,
          fallback_url: p.fallbackUrl,
          faces_count: p.facesIndexed || p.facesDetected || 1,
          size_bytes: p.sizeBytes,
          created_at: Number.isFinite(ts) ? ts : 0,
          photographer: "JMD Studio",
        };
      });

    const liveDrivePhotos = await drivePhotosPromise;

    // Merge Drive photos first, then SQLite DB rows, then admin vault photos (deduped)
    const mergedMap = new Map<string, MergedGalleryRow>();

    for (const dp of liveDrivePhotos) {
      mergedMap.set(dp.id, {
        id: dp.id,
        driveFileId: dp.driveFileId,
        filename: dp.title,
        ceremony_name: dp.ceremony,
        url: dp.url,
        thumbnail_url: dp.thumbnailUrl,
        fallback_url: dp.fallbackUrl,
        faces_count: dp.facesCount,
        size_bytes: dp.sizeBytes,
        created_at: dp.createdAtMs,
        photographer: dp.photographer,
      });
    }

    for (const dr of dbRows) {
      if (!mergedMap.has(dr.id)) {
        mergedMap.set(dr.id, {
          ...dr,
          photographer: "JMD Studio",
        });
      }
    }

    for (const vp of vaultRows) {
      if (!mergedMap.has(vp.id)) {
        mergedMap.set(vp.id, vp);
      }
    }

    let combinedPhotos = Array.from(mergedMap.values()).sort(
      (a, b) => (b.created_at || 0) - (a.created_at || 0)
    );

    if (ceremony && ceremony !== "All") {
      const targetCeremony = ceremony.toLowerCase();
      combinedPhotos = combinedPhotos.filter(
        (p) => (p.ceremony_name || "").toLowerCase() === targetCeremony
      );
    }

    if (search) {
      combinedPhotos = combinedPhotos.filter(
        (p) =>
          (p.filename || "").toLowerCase().includes(search) ||
          (p.ceremony_name || "").toLowerCase().includes(search)
      );
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
        ? generateSignedPhotoUrl(p.id, 86400)
        : p.thumbnail_url;
      const safeTimestamp =
        typeof p.created_at === "number" && Number.isFinite(p.created_at) && p.created_at > 0
          ? p.created_at
          : Date.now();

      return {
        id: p.id,
        driveFileId: p.driveFileId,
        url: signedUrl,
        rawUrl: p.url,
        thumbnailUrl: signedThumb,
        fallbackUrl: p.fallback_url || signedThumb,
        title: p.filename,
        ceremony: p.ceremony_name || "Reception",
        facesCount: p.faces_count || 1,
        photographer: p.photographer || "JMD Studio",
        approvalStatus: "approved" as const,
        sizeBytes: p.size_bytes,
        createdAt: new Date(safeTimestamp).toISOString(),
      };
    });

    return NextResponse.json(
      {
        success: true,
        eventId,
        total,
        page,
        totalPages,
        ceremonies: ["All", ...ceremonies.map((c) => c.name)],
        photos: pagedPhotos,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load gallery photos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

