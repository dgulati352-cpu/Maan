import { WeddingPhoto, MOCK_WEDDING_PHOTOS } from "@/data/mockWeddingData";

const STORAGE_KEY = "shaadisnap_live_wedding_photos";
const STORAGE_KEY_GUEST_LINK = "shaadisnap_ceo_guest_link_approved";

const DEFAULT_COUPLE_PHOTO: WeddingPhoto = {
  id: "hero_couple_photo",
  url: "/hero-couple.jpg",
  title: "Marwaha & Gulati Wedding — Celebration at Deventure Shimla Hills Resort, Solan (HP)",
  ceremony: "Reception",
  facesCount: 2,
  photographer: "JMD Studio",
  confidenceTier: "high",
  aspectRatio: "portrait",
  approvalStatus: "approved",
  approvedBy: "Kabir Marwaha (Chief Executive Officer)",
  approvedAt: "2026-11-06T12:00:00Z",
};

// Base curated celebration photos for Marwaha & Gulati wedding
const BASE_APPROVED_PHOTOS: WeddingPhoto[] = [
  DEFAULT_COUPLE_PHOTO,
  ...MOCK_WEDDING_PHOTOS.map((p) => ({
    ...p,
    approvalStatus: "approved" as const,
    approvedBy: "Kabir Marwaha (Chief Executive Officer)",
    approvedAt: "2026-11-06T12:00:00Z",
  })),
];

/**
 * Returns all uploaded wedding photos for moderation / administrative oversight.
 * Sorted with latest uploads first.
 */
export function getWeddingPhotos(): WeddingPhoto[] {
  if (typeof window === "undefined") {
    return BASE_APPROVED_PHOTOS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const uploaded: WeddingPhoto[] = raw ? JSON.parse(raw) : [];

    const realUploads: WeddingPhoto[] = uploaded
      .filter((p) => p && p.id && p.url)
      .map((p): WeddingPhoto => {
        // Accurately calibrate facesCount:
        // Windows camera captures (WIN_...) and single selfies are 1 person
        const isSinglePerson =
          p.title?.startsWith("WIN_") ||
          p.title?.toLowerCase().includes("selfie") ||
          p.photographer === "Guest Live Upload";
        return {
          ...p,
          facesCount: isSinglePerson ? 1 : p.facesCount || 1,
          approvalStatus: (p.approvalStatus || (p.id === "hero_couple_photo" ? "approved" : "pending_ceo_approval")) as "approved" | "pending_ceo_approval" | "rejected",
        };
      });

    // Merge uploaded photos with base celebration photos
    const combined: WeddingPhoto[] = [...realUploads];
    for (const base of BASE_APPROVED_PHOTOS) {
      if (!combined.some((p) => p.id === base.id || p.url === base.url)) {
        combined.push(base);
      }
    }
    return combined;
  } catch {
    return BASE_APPROVED_PHOTOS;
  }
}

/**
 * Returns ONLY CEO-approved wedding photos for public display in guest galleries.
 * Photos awaiting CEO review stay private until approved.
 */
export function getApprovedWeddingPhotos(): WeddingPhoto[] {
  const allPhotos = getWeddingPhotos();
  return allPhotos.filter(
    (photo) => photo.approvalStatus === "approved" || (!photo.approvalStatus && photo.id === "hero_couple_photo")
  );
}

/**
 * Save an uploaded photo to the top of the live stream (defaults to pending_ceo_approval)
 */
export function addUploadedPhoto(photo: {
  id: string;
  url: string;
  fallbackUrl?: string;
  driveFileId?: string;
  title: string;
  ceremony: string;
  photographer?: string;
  approvalStatus?: "pending_ceo_approval" | "approved" | "rejected";
}) {
  if (typeof window === "undefined") return;
  try {
    const current = getWeddingPhotos();

    // Use direct high-speed Google Usercontent CDN link if Drive ID is available
    const directCdnUrl = photo.driveFileId
      ? `https://lh3.googleusercontent.com/d/${photo.driveFileId}=s0`
      : photo.url;

    const newPhoto: WeddingPhoto = {
      id: photo.id || `uploaded_${Date.now()}`,
      url: directCdnUrl,
      fallbackUrl: photo.fallbackUrl,
      driveFileId: photo.driveFileId,
      title: photo.title || "Wedding Memory",
      ceremony: (photo.ceremony as WeddingPhoto["ceremony"]) || "Sangeet",
      facesCount: 1,
      photographer: photo.photographer || "Guest Live Upload",
      similarity: 0.96,
      confidenceTier: "high",
      aspectRatio: "portrait",
      approvalStatus: photo.approvalStatus || "pending_ceo_approval",
      uploadedAt: new Date().toISOString(),
    };

    // Filter out duplicate IDs if any, and insert newest at the top
    const updated = [newPhoto, ...current.filter((p) => p.id !== newPhoto.id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch real-time event across components
    window.dispatchEvent(new Event("shaadisnap_photos_updated"));
  } catch (err) {
    console.error("Failed to save uploaded photo:", err);
  }
}

/**
 * Authorize/Approve a specific photo by ID
 */
export function approvePhoto(
  id: string,
  approver: string = "Kabir Marwaha (Chief Executive Officer)"
) {
  if (typeof window === "undefined") return;
  try {
    const current = getWeddingPhotos();
    const updated = current.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          approvalStatus: "approved" as const,
          approvedBy: approver,
          approvedAt: new Date().toISOString(),
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("shaadisnap_photos_updated"));
  } catch (err) {
    console.error("Failed to approve photo:", err);
  }
}

/**
 * 1-Click Batch approve multiple photos by IDs
 */
export function batchApprovePhotos(
  ids: string[],
  approver: string = "Kabir Marwaha (Chief Executive Officer)"
) {
  if (typeof window === "undefined" || ids.length === 0) return;
  try {
    const current = getWeddingPhotos();
    const idSet = new Set(ids);
    const now = new Date().toISOString();
    const updated = current.map((p) => {
      if (idSet.has(p.id)) {
        return {
          ...p,
          approvalStatus: "approved" as const,
          approvedBy: approver,
          approvedAt: now,
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("shaadisnap_photos_updated"));
  } catch (err) {
    console.error("Failed to batch approve photos:", err);
  }
}

/**
 * Reject or retract approval for a photo
 */
export function rejectPhoto(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getWeddingPhotos();
    const updated = current.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          approvalStatus: "rejected" as const,
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("shaadisnap_photos_updated"));
  } catch (err) {
    console.error("Failed to reject photo:", err);
  }
}

/**
 * Guest Facial Access Link Approval Controls (Admin/CEO Gating)
 */
export function getGuestLinkApprovalStatus(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY_GUEST_LINK);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

export function setGuestLinkApprovalStatus(approved: boolean): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_GUEST_LINK, approved ? "true" : "false");
    window.dispatchEvent(new Event("shaadisnap_guest_link_status_updated"));
  } catch (err) {
    console.error("Failed to set guest link approval status:", err);
  }
}

/**
 * Delete a specific photo by ID
 */
export function deleteUploadedPhoto(id: string) {
  if (typeof window === "undefined") return;
  try {
    const current = getWeddingPhotos();
    const updated = current.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("shaadisnap_photos_updated"));
  } catch (err) {
    console.error("Failed to delete photo:", err);
  }
}

/**
 * Clear all photos if requested
 */
export function clearUploadedPhotos() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("shaadisnap_photos_updated"));
}
