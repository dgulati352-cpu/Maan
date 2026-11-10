import { NextRequest, NextResponse } from "next/server";
import {
  scanDriveFolder,
  importSingleDrivePhoto,
  DriveImportItem,
  DriveImportProgressResult,
} from "@/lib/server/googleDriveServerService";

export const dynamic = "force-dynamic";

/**
 * POST /api/google-drive/picker-import
 * 
 * Body:
 * {
 *   accessToken: string,
 *   items: Array<{ id: string, name: string, mimeType?: string, sizeBytes?: number, isFolder?: boolean }>,
 *   ceremony?: string,
 *   album?: string,
 *   eventId?: string,
 *   uploaderEmail?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      accessToken,
      items = [],
      ceremony = "Reception",
      album = "Google Drive Imports",
      eventId = "marwaha-gulati-2026",
      uploaderEmail = "admin@maan-ai.com",
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items selected for import" }, { status: 400 });
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Google OAuth access token is required" }, { status: 401 });
    }

    // Expand any folders selected into individual photo files
    const photosToImport: DriveImportItem[] = [];

    for (const item of items) {
      if (item.isFolder || item.mimeType === "application/vnd.google-apps.folder") {
        try {
          // Scan folder recursively / with pagination
          let currentToken: string | undefined = undefined;
          let scannedCount = 0;
          do {
            const folderScan = await scanDriveFolder(item.id, accessToken, currentToken, 100);
            for (const file of folderScan.files) {
              if (!file.isFolder) {
                photosToImport.push({
                  fileId: file.id,
                  filename: file.name,
                  sizeBytes: file.sizeBytes,
                  ceremony,
                  album: item.name || album,
                  folderId: item.id,
                  folderName: folderScan.folderName,
                });
              }
            }
            currentToken = folderScan.nextPageToken;
            scannedCount += folderScan.files.length;
          } while (currentToken && scannedCount < 500); // Safety limit per folder
        } catch (folderErr) {
          console.warn(`Failed scanning Drive folder ${item.id}:`, folderErr);
        }
      } else {
        photosToImport.push({
          fileId: item.id,
          filename: item.name || `Drive_Photo_${item.id.slice(0, 6)}.jpg`,
          sizeBytes: item.sizeBytes,
          ceremony,
          album,
          folderId: item.folderId,
          folderName: item.folderName,
        });
      }
    }

    if (photosToImport.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No supported image files found in the selected Drive items or folders.",
      }, { status: 400 });
    }

    // Process files sequentially or in controlled batches to avoid Google rate limits
    const results: DriveImportProgressResult[] = [];
    let completedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;

    for (const target of photosToImport) {
      const res = await importSingleDrivePhoto(target, accessToken, eventId, uploaderEmail);
      results.push(res);

      if (res.status === "COMPLETED") completedCount++;
      if (res.status === "SKIPPED_DUPLICATE") duplicateCount++;
      if (res.status === "FAILED") failedCount++;
    }

    return NextResponse.json({
      success: true,
      totalRequested: photosToImport.length,
      completedCount,
      duplicateCount,
      failedCount,
      results,
      message: `Processed ${photosToImport.length} photos: ${completedCount} imported, ${duplicateCount} duplicates skipped, ${failedCount} failed.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error during Google Drive import";
    console.error("Drive import error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

