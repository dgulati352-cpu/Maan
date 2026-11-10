import { NextRequest, NextResponse } from "next/server";
import { findPhotoByHash, listAdminPhotos } from "@/lib/server/adminPhotoManager";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/photos/duplicate-check
 * Body: { eventId?: string, hashes: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId = "marwaha-gulati-2026", hashes = [], fileHash } = body;

    const hashList = Array.isArray(hashes) ? [...hashes] : [];
    if (fileHash && typeof fileHash === "string") {
      hashList.push(fileHash);
    }

    if (hashList.length === 0) {
      return NextResponse.json({ success: true, isDuplicate: false, duplicates: [] });
    }

    const duplicates: Array<{ hash: string; existingPhotoId: string; existingFilename: string }> = [];

    for (const hash of hashList) {
      if (typeof hash === "string" && hash.length === 64) {
        const match = findPhotoByHash(eventId, hash);
        if (match) {
          duplicates.push({
            hash,
            existingPhotoId: match.id,
            existingFilename: match.filename,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      isDuplicate: duplicates.length > 0,
      duplicateCount: duplicates.length,
      duplicates,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Duplicate check failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

