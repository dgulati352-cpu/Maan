import { NextRequest, NextResponse } from "next/server";
import {
  listAdminPhotos,
  createAdminPhoto,
  deleteAdminPhoto,
  batchDeleteAdminPhotos,
  batchApproveAdminPhotos,
  batchAssignAlbum,
  createPhotoJob,
  updatePhotoJob,
  findPhotoByHash,
  calculateBufferHash,
  formatBytes,
} from "@/lib/server/adminPhotoManager";
import { processAndStoreImageBuffer } from "@/lib/server/storageService";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/photos
 * Query parameters:
 * - eventId: default "marwaha-gulati-2026"
 * - ceremony: "All" | "Mehendi" | "Haldi" | ...
 * - album: "All" | album name
 * - source: "all" | "computer" | "google_drive" | "folder_drag"
 * - status: "all" | "COMPLETED" | "PROCESSING" | "FAILED" | "PENDING"
 * - search: search term
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId") || "marwaha-gulati-2026";
    const ceremony = searchParams.get("ceremony");
    const album = searchParams.get("album");
    const source = searchParams.get("source");
    const status = searchParams.get("status");
    const search = searchParams.get("search")?.toLowerCase();

    let photos = listAdminPhotos(eventId);

    if (ceremony && ceremony !== "All") {
      photos = photos.filter((p) => p.ceremony.toLowerCase() === ceremony.toLowerCase());
    }

    if (album && album !== "All") {
      photos = photos.filter((p) => p.album.toLowerCase() === album.toLowerCase());
    }

    if (source && source !== "all") {
      photos = photos.filter((p) => p.source === source);
    }

    if (status && status !== "all") {
      photos = photos.filter((p) => p.processingStatus === status);
    }

    if (search) {
      photos = photos.filter(
        (p) =>
          p.filename.toLowerCase().includes(search) ||
          p.ceremony.toLowerCase().includes(search) ||
          p.album.toLowerCase().includes(search) ||
          (p.driveFolderName && p.driveFolderName.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({
      success: true,
      count: photos.length,
      photos,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch admin photos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".heic"];

/**
 * POST /api/admin/photos
 * Accepts multipart/form-data:
 * - file: File
 * - ceremony: string
 * - album: string
 * - eventId: string
 * - source: "computer" | "folder_drag"
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const ceremony = (formData.get("ceremony") as string) || "Reception";
    const album = (formData.get("album") as string) || "General Celebration";
    const eventId = (formData.get("eventId") as string) || "marwaha-gulati-2026";
    const source = (formData.get("source") as "computer" | "folder_drag") || "computer";
    const uploaderEmail = (formData.get("uploaderEmail") as string) || "admin@maan-ai.com";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const ext = "." + (file.name.split(".").pop()?.toLowerCase() || "jpg");
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported format ${ext}. Supported: JPG, JPEG, PNG, WEBP, HEIC` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Calculate SHA-256 file hash for duplicate detection
    const fileHash = calculateBufferHash(buffer);
    const existing = findPhotoByHash(eventId, fileHash);
    if (existing) {
      return NextResponse.json({
        success: true,
        isDuplicate: true,
        photo: existing,
        message: `Duplicate photo detected: "${file.name}" has already been uploaded as "${existing.filename}".`,
      });
    }

    const tempPhotoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const job = createPhotoJob(tempPhotoId, eventId);

    // 2. Process image & save to permanent application storage
    updatePhotoJob(job.id, { stage: "STORAGE", progress: 25 });
    const stored = await processAndStoreImageBuffer(
      buffer,
      file.name,
      eventId,
      tempPhotoId,
      file.type || "image/jpeg"
    );

    updatePhotoJob(job.id, { stage: "FACE_INDEXING", progress: 65 });

    // 3. Register in Admin Photo Vault
    const { photo } = createAdminPhoto({
      eventId,
      url: stored.url,
      thumbnailUrl: stored.thumbnailUrl,
      filename: file.name,
      fileHash: stored.fileHash,
      sizeBytes: stored.sizeBytes,
      sizeFormatted: stored.sizeFormatted,
      mimeType: stored.mimeType,
      ceremony,
      album,
      source,
      processingStatus: "COMPLETED",
      facesDetected: stored.facesDetected,
      facesIndexed: stored.facesIndexed,
      approvalStatus: "approved",
      approvedBy: "Kabir Marwaha (Chief Executive Officer)",
      approvedAt: new Date().toISOString(),
      uploaderEmail,
    });

    updatePhotoJob(job.id, { stage: "COMPLETED", status: "COMPLETED", progress: 100, completedAt: new Date().toISOString() });

    return NextResponse.json({
      success: true,
      isDuplicate: false,
      photo,
      facesIndexed: stored.facesIndexed,
      message: `Photo "${file.name}" uploaded successfully and indexed with ${stored.facesIndexed} facial embeddings.`,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server upload error";
    console.error("Admin upload error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/photos
 * Body: { id?: string, ids?: string[] }
 */
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ids } = body;

    if (id) {
      const deleted = deleteAdminPhoto(id);
      return NextResponse.json({ success: deleted, deletedCount: deleted ? 1 : 0 });
    }

    if (ids && Array.isArray(ids)) {
      const deletedCount = batchDeleteAdminPhotos(ids);
      return NextResponse.json({ success: true, deletedCount });
    }

    return NextResponse.json({ error: "No photo ID or IDs provided" }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to delete photos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/photos
 * Body: { action: "approve" | "assign_album", ids: string[], album?: string, ceremony?: string }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ids, album, ceremony } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Missing target photo IDs" }, { status: 400 });
    }

    if (action === "approve") {
      const approvedCount = batchApproveAdminPhotos(ids);
      return NextResponse.json({ success: true, approvedCount });
    }

    if (action === "assign_album" && album) {
      const count = batchAssignAlbum(ids, album, ceremony);
      return NextResponse.json({ success: true, updatedCount: count });
    }

    return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to update photos";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

