import { NextRequest, NextResponse } from "next/server";
import { formatGoogleDriveImage } from "@/lib/googleDrive";

export interface ImportRequestItem {
  id: string;
  name: string;
  url?: string;
  fallbackUrl?: string;
  driveFileId?: string;
  ceremony?: string;
}

/**
 * POST /api/google-drive/import
 * 
 * Validates and prepares Google Drive photos and albums for automatic import
 * into the live wedding gallery stream.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { photos, ceremony = "Sangeet" } = body as {
      photos: ImportRequestItem[];
      ceremony?: string;
    };

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return NextResponse.json(
        { error: "No photos provided for import" },
        { status: 400 }
      );
    }

    const importedPhotos = photos.map((item, index) => {
      const fileId = item.driveFileId || item.id;
      const cdnUrl = item.url || formatGoogleDriveImage(fileId, 1200);
      const fallback =
        item.fallbackUrl || `https://lh3.googleusercontent.com/d/${fileId}=s0`;

      return {
        id: `gdrive_${fileId}_${Date.now()}_${index}`,
        driveFileId: fileId,
        title: item.name || `Wedding_Drive_Photo_${index + 1}.jpg`,
        url: cdnUrl,
        fallbackUrl: fallback,
        ceremony: item.ceremony || ceremony,
        photographer: "Google Drive Import",
        importedAt: new Date().toISOString(),
      };
    });

    return NextResponse.json({
      success: true,
      count: importedPhotos.length,
      importedPhotos,
      message: `Successfully imported ${importedPhotos.length} photos from Google Drive`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to import photos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
