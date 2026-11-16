import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * High-Performance Video Streaming Proxy for Google Drive MP4 / WebM / MOV videos.
 *
 * Supports:
 * - HTTP 206 Partial Content (Byte Range requests) for instant seeking and scrubbing
 * - Content-Disposition: inline (enables HTML5 <video> playback without download popups)
 * - 100% Original Uncompressed Bitrate & Resolution (no re-encoding, exact source quality)
 * - Automatic redirect following to Google's CDN usercontent endpoint
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id") || searchParams.get("fileId");

  if (!fileId || typeof fileId !== "string" || fileId.length < 5) {
    return NextResponse.json({ error: "Missing or invalid video fileId" }, { status: 400 });
  }

  const range = req.headers.get("range");
  const directStreamUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download`;

  const fetchHeaders: HeadersInit = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };

  if (range) {
    fetchHeaders["Range"] = range;
  }

  try {
    const upstreamRes = await fetch(directStreamUrl, {
      headers: fetchHeaders,
      redirect: "follow",
    });

    // If Google Drive returns 200 or 206, stream the bytes directly
    if (upstreamRes.ok || upstreamRes.status === 206) {
      const responseHeaders = new Headers();
      
      const upstreamContentType = upstreamRes.headers.get("content-type") || "video/mp4";
      responseHeaders.set("Content-Type", upstreamContentType.includes("text/html") ? "video/mp4" : upstreamContentType);
      responseHeaders.set("Accept-Ranges", "bytes");
      responseHeaders.set("Content-Disposition", "inline");
      responseHeaders.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=86400");
      responseHeaders.set("Access-Control-Allow-Origin", "*");

      const contentRange = upstreamRes.headers.get("content-range");
      if (contentRange) {
        responseHeaders.set("Content-Range", contentRange);
      }

      const contentLength = upstreamRes.headers.get("content-length");
      if (contentLength) {
        responseHeaders.set("Content-Length", contentLength);
      }

      return new Response(upstreamRes.body, {
        status: upstreamRes.status,
        statusText: upstreamRes.statusText,
        headers: responseHeaders,
      });
    }

    // Fallback: If direct stream returned unexpected status, fallback to Google Drive export redirect
    return NextResponse.redirect(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`, 307);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`Video stream error for ${fileId}:`, msg);
    return NextResponse.redirect(`https://drive.google.com/uc?export=download&id=${encodeURIComponent(fileId)}`, 307);
  }
}
