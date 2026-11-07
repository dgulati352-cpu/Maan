import { WeddingPhoto } from "@/data/mockWeddingData";

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

// Base curated celebration photos for Marwaha & Gulati wedding (strictly authentic couple photo)
const BASE_APPROVED_PHOTOS: WeddingPhoto[] = [
  DEFAULT_COUPLE_PHOTO,
];

/**
 * Detects legacy mock or stock photos from prior localStorage cache.
 * Protects the store from rehydrating stale mock data (photo_01-photo_08, Unsplash stock photos, etc.).
 */
export function isLegacyMockPhoto(photo: Partial<WeddingPhoto> | null | undefined): boolean {
  if (!photo || !photo.id || !photo.url) return true;

  // The authentic couple portrait is always preserved
  if (photo.id === "hero_couple_photo") return false;

  const id = photo.id.toLowerCase();
  const url = photo.url.toLowerCase();
  const fallback = (photo.fallbackUrl || "").toLowerCase();
  const title = (photo.title || "").toLowerCase();

  // Legacy mock IDs (photo_01 to photo_08, mock_*)
  if (/^photo_\d+$/i.test(photo.id) || id.startsWith("mock_")) {
    return true;
  }

  // Any Unsplash or stock image URLs
  if (url.includes("unsplash.com") || fallback.includes("unsplash.com")) {
    return true;
  }

  // Legacy mock photo titles
  const legacyTitles = [
    "regal royal portrait",
    "the golden vows",
    "bridal mehendi & henna intricacies",
    "reception grand entrance",
    "sangeet dance floor candids",
    "bridesmaids laughter at haldi",
    "baraat celebration & dhol beats",
    "evening cocktail toasts",
  ];
  if (legacyTitles.some((t) => title.includes(t))) {
    return true;
  }

  return false;
}

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
      .filter((p) => p && p.id && p.url && !isLegacyMockPhoto(p))
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

    // Clean up localStorage cache if legacy mock photos were detected and pruned
    if (uploaded.length !== realUploads.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(realUploads));
    }

    // Merge uploaded photos with base celebration photos (strictly DEFAULT_COUPLE_PHOTO)
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
 * Photos awaiting CEO review stay private until approved. Strictly excludes any legacy mock photos.
 */
export function getApprovedWeddingPhotos(): WeddingPhoto[] {
  const allPhotos = getWeddingPhotos();
  return allPhotos.filter(
    (photo) =>
      !isLegacyMockPhoto(photo) &&
      (photo.approvalStatus === "approved" || (!photo.approvalStatus && photo.id === "hero_couple_photo"))
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
    const current = getWeddingPhotos().filter((p) => !isLegacyMockPhoto(p));

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
    const current = getWeddingPhotos().filter((p) => !isLegacyMockPhoto(p));
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
    const current = getWeddingPhotos().filter((p) => !isLegacyMockPhoto(p));
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
    const current = getWeddingPhotos().filter((p) => !isLegacyMockPhoto(p));
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
    const current = getWeddingPhotos().filter((p) => !isLegacyMockPhoto(p));
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
