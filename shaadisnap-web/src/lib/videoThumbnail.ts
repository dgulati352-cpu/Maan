/**
 * Client-side video processing helper for ShaadiSnap / Maan Memories.
 * Extracts video frame thumbnail, duration, and metadata using native browser APIs.
 */

export interface VideoMetadata {
  thumbnailUrl: string;
  duration: number;
  durationFormatted: string;
  width: number;
  height: number;
  isLandscape: boolean;
}

export function formatVideoDuration(seconds: number): string {
  if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds)) {
    return "0:00";
  }
  const totalSec = Math.floor(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export function isVideoFile(fileOrUrl: File | string): boolean {
  if (typeof fileOrUrl === "string") {
    const clean = fileOrUrl.split("?")[0].toLowerCase();
    return /\.(mp4|mov|webm|m4v|3gp|mkv)$/i.test(clean);
  }
  if (!fileOrUrl) return false;
  if (fileOrUrl.type && fileOrUrl.type.startsWith("video/")) return true;
  const ext = "." + (fileOrUrl.name || "").split(".").pop()?.toLowerCase();
  return [".mp4", ".mov", ".webm", ".m4v", ".3gp", ".mkv"].includes(ext);
}

/**
 * Extracts a representative poster thumbnail and metadata from a video File.
 * Seeks to 0.75s (or 30% of length) to avoid pitch-black opening frames.
 */
export function generateVideoThumbnail(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve({
        thumbnailUrl: "",
        duration: 0,
        durationFormatted: "0:00",
        width: 0,
        height: 0,
        isLandscape: true,
      });
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.playsInline = true;
    video.muted = true;
    video.crossOrigin = "anonymous";

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    let hasResolved = false;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.removeAttribute("src");
      video.load();
    };

    const handleSuccess = () => {
      if (hasResolved) return;
      hasResolved = true;

      try {
        const canvas = document.createElement("canvas");
        const maxDim = 960;
        let width = video.videoWidth || 640;
        let height = video.videoHeight || 360;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = Math.max(width, 1);
        canvas.height = Math.max(height, 1);
        const ctx = canvas.getContext("2d");

        let thumb = "";
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumb = canvas.toDataURL("image/jpeg", 0.82);
        }

        const duration = video.duration || 0;
        cleanup();

        resolve({
          thumbnailUrl: thumb,
          duration,
          durationFormatted: formatVideoDuration(duration),
          width: video.videoWidth || 640,
          height: video.videoHeight || 360,
          isLandscape: (video.videoWidth || 640) >= (video.videoHeight || 360),
        });
      } catch {
        const duration = video.duration || 0;
        cleanup();
        resolve({
          thumbnailUrl: "",
          duration,
          durationFormatted: formatVideoDuration(duration),
          width: 640,
          height: 360,
          isLandscape: true,
        });
      }
    };

    video.onloadedmetadata = () => {
      const duration = video.duration || 0;
      // Seek to 0.75 second or halfway through short clips
      const targetTime = duration > 1.5 ? Math.min(1.0, duration * 0.25) : duration / 2;
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      handleSuccess();
    };

    video.onerror = () => {
      if (hasResolved) return;
      hasResolved = true;
      cleanup();
      resolve({
        thumbnailUrl: "",
        duration: 0,
        durationFormatted: "0:00",
        width: 0,
        height: 0,
        isLandscape: true,
      });
    };

    // Safety timeout: If browser stalls decoding video codec, resolve gracefully after 4 seconds
    setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        const duration = video.duration || 0;
        cleanup();
        resolve({
          thumbnailUrl: "",
          duration,
          durationFormatted: formatVideoDuration(duration),
          width: 0,
          height: 0,
          isLandscape: true,
        });
      }
    }, 4000);
  });
}
