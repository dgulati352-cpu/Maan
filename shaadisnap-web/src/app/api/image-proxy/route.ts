import { NextRequest, NextResponse } from "next/server";
import { verifySignedPhotoUrl } from "@/lib/server/storageService";
import { listAdminPhotos } from "@/lib/server/adminPhotoManager";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const photoId = searchParams.get("photoId");
    const expires = searchParams.get("expires");
    const sig = searchParams.get("sig");
    const targetUrl = searchParams.get("url");

    // 1. Signed token photo resolution (Private Storage)
    if (photoId && expires && sig) {
      const isValid = verifySignedPhotoUrl(photoId, expires, sig);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid or expired signed URL token" }, { status: 403 });
      }

      const photos = listAdminPhotos();
      const photo = photos.find((p) => p.id === photoId);
      if (!photo) {
        return NextResponse.json({ error: "Photo not found" }, { status: 404 });
      }

      // Serve from local uploads or proxy
      if (photo.url.startsWith("/uploads/")) {
        const localPath = path.resolve(process.cwd(), "public", photo.url.replace(/^\//, ""));
        try {
          const buffer = await fs.readFile(localPath);
          return new NextResponse(buffer, {
            status: 200,
            headers: {
              "Content-Type": photo.mimeType || "image/jpeg",
              "Cache-Control": "private, max-age=3600",
            },
          });
        } catch {
          // If local file not found, fall back to targetUrl
        }
      }
    }

    // 2. Target URL proxy
    if (!targetUrl) {
      return NextResponse.json({ error: "Missing 'url' or valid signed photo parameters" }, { status: 400 });
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
    }

    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "ShaadiSnap-ImageProxy/1.0",
        Accept: "image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream error fetching image: ${response.statusText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to proxy image";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
