import { WeddingPhoto } from "@/data/mockWeddingData";

const STORAGE_KEY = "shaadisnap_live_wedding_photos";

const DEFAULT_COUPLE_PHOTO: WeddingPhoto = {
  id: "hero_couple_photo",
  url: "/hero-couple.jpg",
  title: "Mahine Weds Anand — Royal Celebration",
  ceremony: "Reception",
  facesCount: 2,
  photographer: "JMD Studio",
  confidenceTier: "high",
  aspectRatio: "portrait",
};

/**
 * Returns ONLY real uploaded wedding photos (strictly no demo / mock photos).
 * Sorted with latest uploads first.
 */
export function getWeddingPhotos(): WeddingPhoto[] {
  if (typeof window === "undefined") {
    return [DEFAULT_COUPLE_PHOTO];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [DEFAULT_COUPLE_PHOTO];
    const uploaded: WeddingPhoto[] = JSON.parse(raw);
    // Filter out any mock/demo IDs and return only real uploads
    const realUploads = uploaded
      .filter(
        (p) =>
          p &&
          p.id &&
          !p.id.startsWith("photo_") &&
          !p.id.startsWith("demo_") &&
          p.url &&
          !p.url.includes("unsplash.com")
      )
      .map((p) => {
        // Accurately calibrate facesCount:
        // Windows camera captures (WIN_...) and single selfies are 1 person
        const isSinglePerson =
          p.title?.startsWith("WIN_") ||
          p.title?.toLowerCase().includes("selfie") ||
          p.photographer === "Guest Live Upload";
        return {
          ...p,
          facesCount: isSinglePerson ? 1 : p.facesCount || 1,
        };
      });
    // Always include the real couple photo in the list (newest live uploads at top)
    if (!realUploads.some((p) => p.url === "/hero-couple.jpg")) {
      return [...realUploads, DEFAULT_COUPLE_PHOTO];
    }
    return realUploads;
  } catch {
    return [DEFAULT_COUPLE_PHOTO];
  }
}

/**
 * Save an uploaded photo to the top of the live stream
 */
export function addUploadedPhoto(photo: {
  id: string;
  url: string;
  fallbackUrl?: string;
  driveFileId?: string;
  title: string;
  ceremony: string;
  photographer?: string;
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
