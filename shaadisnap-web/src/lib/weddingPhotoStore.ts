import { WeddingPhoto } from "@/data/mockWeddingData";

const STORAGE_KEY = "shaadisnap_live_wedding_photos";

/**
 * Returns ONLY real uploaded wedding photos (strictly no demo / mock photos).
 * Sorted with latest uploads first.
 */
export function getWeddingPhotos(): WeddingPhoto[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const uploaded: WeddingPhoto[] = JSON.parse(raw);
    // Filter out any mock/demo IDs and return only real uploads
    return uploaded.filter(
      (p) =>
        p &&
        p.id &&
        !p.id.startsWith("photo_") &&
        !p.id.startsWith("demo_") &&
        p.url &&
        !p.url.includes("unsplash.com")
    );
  } catch {
    return [];
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
      ? `https://lh3.googleusercontent.com/d/${photo.driveFileId}=w1200`
      : photo.url;

    const newPhoto: WeddingPhoto = {
      id: photo.id || `uploaded_${Date.now()}`,
      url: directCdnUrl,
      fallbackUrl: photo.fallbackUrl,
      driveFileId: photo.driveFileId,
      title: photo.title || "Wedding Memory",
      ceremony: (photo.ceremony as any) || "Sangeet",
      facesCount: Math.floor(Math.random() * 2) + 1,
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
 * Clear all photos if requested
 */
export function clearUploadedPhotos() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("shaadisnap_photos_updated"));
}
