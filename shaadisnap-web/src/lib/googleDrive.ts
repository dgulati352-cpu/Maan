/**
 * Google Drive Image Utilities for ShaadiSnap
 * 
 * Allows users to keep wedding photos in their Google Drive while
 * rendering high-resolution, fast previews directly inside the website
 * without redirecting to Google Drive.
 */

export interface GoogleDriveItem {
  id: string;
  fileId: string;
  originalInput: string;
  directUrl: string;
  fallbackUrl: string;
  isValid: boolean;
  name?: string;
  isFolder?: boolean;
}

/**
 * Extracts a Google Drive File ID from various link formats or raw ID.
 * Examples supported:
 * - https://drive.google.com/file/d/1ABCXYZ_12345/view?usp=sharing
 * - https://drive.google.com/open?id=1ABCXYZ_12345
 * - https://drive.google.com/uc?id=1ABCXYZ_12345
 * - https://lh3.googleusercontent.com/d/1ABCXYZ_12345
 * - https://drive.google.com/thumbnail?id=1ABCXYZ_12345
 * - 1ABCXYZ_12345 (raw alphanumeric ID)
 */
export function extractGoogleDriveId(input: string): { id: string | null; isFolder: boolean } {
  if (!input || typeof input !== "string") {
    return { id: null, isFolder: false };
  }

  const trimmed = input.trim();

  // Check for Folder URL: /drive/folders/ID or id=...
  const folderMatch = trimmed.match(/\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return { id: folderMatch[1], isFolder: true };
  }

  // Check for standard File URL: /file/d/ID/view
  const fileDMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) {
    return { id: fileDMatch[1], isFolder: false };
  }

  // Check for /d/ID (e.g. googleusercontent)
  const lh3Match = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (lh3Match && lh3Match[1]) {
    return { id: lh3Match[1], isFolder: false };
  }

  // Check query parameter: id=ID
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch && queryMatch[1]) {
    return { id: queryMatch[1], isFolder: false };
  }

  // Check if string itself looks like a standard Google Drive ID (25-45 characters alphanumeric with - or _)
  if (/^[a-zA-Z0-9_-]{20,50}$/.test(trimmed)) {
    return { id: trimmed, isFolder: false };
  }

  return { id: null, isFolder: false };
}

/**
 * Converts a Google Drive link or ID to a high-speed direct preview image URL
 * @param urlOrId Google Drive URL or File ID
 * @param width Requested width in pixels (e.g. 1200 for HD preview)
 */
export function formatGoogleDriveImage(urlOrId: string, width = 1200): string {
  if (!urlOrId) return "";

  // If already a standard direct URL (like unsplash or external cdn)
  if (urlOrId.startsWith("http") && !urlOrId.includes("drive.google.com") && !urlOrId.includes("googleusercontent.com")) {
    return urlOrId;
  }

  const { id } = extractGoogleDriveId(urlOrId);
  if (!id) return urlOrId;

  // Google thumbnail endpoint provides fast webp/jpeg CDN delivery
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
}

/**
 * Secondary fallback direct CDN link format
 */
export function formatGoogleContentImage(urlOrId: string, width = 1200): string {
  const { id } = extractGoogleDriveId(urlOrId);
  if (!id) return urlOrId;
  return `https://lh3.googleusercontent.com/d/${id}=w${width}`;
}

/**
 * Parses multi-line or comma-separated user inputs into structured Google Drive items
 */
export function parseGoogleDriveInputs(rawText: string): GoogleDriveItem[] {
  if (!rawText) return [];

  // Split by newlines, commas, or semicolons
  const lines = rawText
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  return lines.map((line, index) => {
    const { id, isFolder } = extractGoogleDriveId(line);
    const isValid = !!id;
    const fileId = id || "";

    return {
      id: `gdrive_${Date.now()}_${index}`,
      fileId,
      originalInput: line,
      directUrl: isValid ? formatGoogleDriveImage(fileId, 1200) : "",
      fallbackUrl: isValid ? formatGoogleContentImage(fileId, 1200) : "",
      isValid,
      isFolder,
      name: isFolder ? `Google Drive Folder (${fileId.slice(0, 8)}...)` : `Wedding_Photo_GDrive_${index + 1}.jpg`,
    };
  });
}
