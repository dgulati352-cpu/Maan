import { formatGoogleDriveImage } from "@/lib/googleDrive";

export interface WeddingPhoto {
  id: string;
  url: string;
  fallbackUrl?: string;
  driveFileId?: string;
  title: string;
  ceremony: "All" | "Mehendi" | "Haldi" | "Sangeet" | "Phere" | "Reception";
  facesCount: number;
  photographer: string;
  similarity?: number;
  confidenceTier?: "high" | "medium";
  aspectRatio?: "portrait" | "landscape" | "square";
  approvalStatus?: "pending_ceo_approval" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  uploadedAt?: string;
  uploaderEmail?: string;
  driveFolderId?: string;
}

export interface DemoSelfie {
  id: string;
  name: string;
  role: string;
  avatarUrl: string;
  matchedPhotoIds: string[];
}

export const WEDDING_EVENT = {
  id: "marwaha-gulati-2026",
  couple: "Marwaha's and Gulati's",
  date: "November 12-13, 2026",
  venue: "Deventure Shimla Hills Resort, Solan (HP)",
  totalPhotos: 1,
  photographer: "Royal Wedding Photography",
  accessCode: "MARWAHA-GULATI-2026",
  // Direct Google Drive Folder for the wedding album:
  googleDriveFolderUrl: "https://drive.google.com/drive/folders/1G53zacxOMhcxh7EDhnL37oRgN3awVJsy",
  googleDriveFolderId: "1G53zacxOMhcxh7EDhnL37oRgN3awVJsy",
};

/**
 * Direct Google Drive Photo resolver
 * Pass any Google Drive share link, file ID, or direct image URL.
 * Automatically converts to high-speed Google CDN display link!
 */
export function drivePhotoUrl(driveLinkOrId: string, fallbackUrl: string): string {
  if (!driveLinkOrId) return fallbackUrl;
  return formatGoogleDriveImage(driveLinkOrId, 1200);
}

export const MOCK_WEDDING_PHOTOS: WeddingPhoto[] = [];

export const DEMO_SELFIES: DemoSelfie[] = [];

