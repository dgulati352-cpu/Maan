import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * High-Performance Native Video Streaming Proxy for Google Drive MP4 / WebM / MOV videos.
 *
 * Solves Mobile Browser CORP & Content-Disposition Blocking:
 * - Direct Google Drive links send `Content-Disposition: attachment` & `Cross-Origin-Resource-Policy: same-site`,
 *   which mobile Chrome & Safari strictly block inside HTML5 <video> tags.
 * - This proxy streams upstream bytes with `Content-Disposition: inline`, `Accept-Ranges: bytes`,
 *   and `Cross-Origin-Resource-Policy: cross-origin`, allowing all mobile devices to play native HD video without blur or blocking.
 */
export async function GET(req: NextRequest) {
  return handleVideoStream(req, "GET");
}

export async function HEAD(req: NextRequest) {
  return handleVideoStream(req, "HEAD");
}

async function handleVideoStream(req: NextRequest, method: "GET" | "HEAD") {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("id") || searchParams.get("fileId");

  if (!fileId || typeof fileId !== "string" || fileId.length < 5) {
    return NextResponse.json({ error: "Missing or invalid video fileId" }, { status: 400 });
  }

  const upstreamUrl = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;

  const range = req.headers.get("range");
  const forwardHeaders: Record<string, string> = {
    "User-Agent":
      req.headers.get("user-agent") ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  };
  if (range) {
    forwardHeaders["Range"] = range;
  }

  try {
    const upstreamRes = await fetch(upstreamUrl, {
      method: method === "HEAD" ? "HEAD" : "GET",
      headers: forwardHeaders,
      redirect: "follow",
    });

    const responseHeaders = new Headers();
    responseHeaders.set("Content-Type", upstreamRes.headers.get("content-type") || "video/mp4");
    responseHeaders.set("Content-Disposition", "inline");
    responseHeaders.set("Accept-Ranges", "bytes");
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
    responseHeaders.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=86400");

    const contentRange = upstreamRes.headers.get("content-range");
    if (contentRange) {
      responseHeaders.set("Content-Range", contentRange);
    }
    const contentLength = upstreamRes.headers.get("content-length");
    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    if (method === "HEAD") {
      return new Response(null, {
        status: upstreamRes.status === 206 ? 206 : 200,
        headers: responseHeaders,
      });
    }

    return new Response(upstreamRes.body, {
      status: upstreamRes.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch {
    // Graceful fallback to 307 redirect if direct fetch fails
    return NextResponse.redirect(upstreamUrl, {
      status: 307,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}
