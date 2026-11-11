import { WeddingPhoto } from "@/data/mockWeddingData";
import { getStoredGoogleUser } from "@/lib/googleAuth";

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

  // Always purge tiny dummy test upload stubs, removed demo photos, expired blob URLs, and legacy mock IDs
  const dummyStubIds = new Set([
    "1ocgwqzh1sgacaarbfy60m0d5nborw-gc",
    "1bitz5kw4ohgvp-2eqlcmoeokotdzdtbx",
    "1ocnfkbk84jkjaq8fhappz6yk4gk7wlgi",
    "1-vzek1f3gipeuqhhrk8qk945wsvglbdp",
    "1rdzubtc4oyxzvq4k_-dwx_o7rkdkhym-",
    "1wlyogljg_uuxhobw1wit0hv-lfkkyar_",
    "1bnhczyg3bx8zbwgbrtpfc4ijn5hperju",
  ]);

  if (
    dummyStubIds.has(id) ||
    url.startsWith("blob:") ||
    id.includes("beach_couple") ||
    url.includes("beach-couple") ||
    title.includes("live-test-dhairya") ||
    title.includes("test_dhairya") ||
    title.includes("smoke-test") ||
    title.includes("test-real") ||
    title.includes("sunset walk") ||
    /^photo_\d+$/i.test(photo.id) ||
    id.startsWith("mock_") ||
    url.includes("unsplash.com") ||
    fallback.includes("unsplash.com")
  ) {
    return true;
  }

  // Genuine live uploads backed by Google Drive / uploader metadata are preserved
  if (
    photo.photographer === "Guest Live Upload" ||
    photo.driveFileId ||
    photo.uploaderEmail ||
    photo.driveFolderId
  ) {
    return false;
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

  // Purge legacy local-only test mock data
  if (
    id.startsWith("candid_test_") ||
    id.startsWith("guest_test_") ||
    id.includes("1794306") ||
    id.includes("master_test") ||
    url.includes("candid_guest") ||
    url.includes("master_test") ||
    fallback.includes("candid_guest") ||
    fallback.includes("master_test") ||
    title.includes("candid_guest") ||
    title.includes("master_test") ||
    title.startsWith("win_20261107") ||
    title.includes("selfie_test")
  ) {
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
      (photo.approvalStatus === "approved" ||
        photo.photographer === "Guest Live Upload" ||
        Boolean(photo.driveFileId) ||
        (!photo.approvalStatus && photo.id === "hero_couple_photo"))
  );
}

/**
 * Fetches all live shared photos across devices (Google Drive folder + approved vault),
 * merged with any recent optimistic local uploads so every device sees every photo immediately.
 */
export async function fetchSharedGalleryPhotos(options?: {
  ceremony?: string;
  search?: string;
}): Promise<WeddingPhoto[]> {
  const fallbackLocal = getApprovedWeddingPhotos();
  if (typeof window === "undefined") {
    return fallbackLocal;
  }

  try {
    const params = new URLSearchParams({ limit: "100" });
    if (options?.ceremony && options.ceremony !== "All") {
      params.set("ceremony", options.ceremony);
    }
    if (options?.search) {
      params.set("search", options.search);
    }

    const res = await fetch(`/api/gallery/photos?${params.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return fallbackLocal;
    }

    const data = (await res.json()) as { photos?: Partial<WeddingPhoto>[] };
    if (!Array.isArray(data.photos)) {
      return fallbackLocal;
    }

    const serverPhotos: WeddingPhoto[] = data.photos
      .filter((p): p is WeddingPhoto => Boolean(p && p.id && p.url && !isLegacyMockPhoto(p)))
      .map((p) => ({
        ...p,
        facesCount: p.facesCount || 1,
        photographer: p.photographer || "Guest Live Upload",
        approvalStatus: "approved" as const,
      }));

    // Preserve brand-new optimistic local uploads (within 2 minutes) before Drive list propagation
    const now = Date.now();
    const recentOptimistic = getWeddingPhotos().filter((lp) => {
      if (isLegacyMockPhoto(lp)) return false;
      if (lp.id === "hero_couple_photo") return false;
      if (serverPhotos.some((sp) => sp.id === lp.id || (lp.driveFileId && sp.driveFileId === lp.driveFileId))) {
        return false;
      }
      const uploadedMs = lp.uploadedAt ? new Date(lp.uploadedAt).getTime() : 0;
      return uploadedMs > 0 && now - uploadedMs < 120_000;
    });

    const merged = [...recentOptimistic, ...serverPhotos];

    // Ensure DEFAULT_COUPLE_PHOTO is always included unless filtered out by ceremony/search
    const isUnfiltered =
      (!options?.ceremony || options.ceremony === "All") && !options?.search;
    if (isUnfiltered && !merged.some((p) => p.id === "hero_couple_photo")) {
      merged.push(DEFAULT_COUPLE_PHOTO);
    }

    return merged;
  } catch {
    return fallbackLocal;
  }
}

/**
 * Save an uploaded photo to the top of the live stream
 * Dynamically binds upload to the active user's email ID and Google Drive folder.
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
  uploaderEmail?: string;
  driveFolderId?: string;
}) {
  if (typeof window === "undefined") return;
  try {
    const current = getWeddingPhotos().filter((p) => !isLegacyMockPhoto(p));
    const activeUser = getStoredGoogleUser();
    const effectiveEmail = (photo.uploaderEmail || activeUser?.email || "guest@maan-ai.com").trim().toLowerCase();
    const effectiveFolder = photo.driveFolderId || activeUser?.driveFolderId;

    // Use direct high-speed Google Usercontent CDN link if Drive ID is available
    const directCdnUrl = photo.driveFileId
      ? `https://lh3.googleusercontent.com/d/${photo.driveFileId}=w1600`
      : photo.url;

    // Use persistent Drive thumbnail URL across reloads instead of ephemeral blob: URLs
    const persistentFallbackUrl = photo.driveFileId
      ? `https://drive.google.com/thumbnail?id=${photo.driveFileId}&sz=w1200`
      : photo.fallbackUrl?.startsWith("blob:")
      ? undefined
      : photo.fallbackUrl;

    const newPhoto: WeddingPhoto = {
      id: photo.id || `uploaded_${Date.now()}`,
      url: directCdnUrl,
      fallbackUrl: persistentFallbackUrl,
      driveFileId: photo.driveFileId,
      title: photo.title || "Wedding Memory",
      ceremony: (photo.ceremony as WeddingPhoto["ceremony"]) || "Sangeet",
      facesCount: 1,
      photographer: photo.photographer || "Guest Live Upload",
      similarity: 0.96,
      confidenceTier: "high",
      aspectRatio: "portrait",
      approvalStatus: photo.approvalStatus || "approved",
      uploadedAt: new Date().toISOString(),
      uploaderEmail: effectiveEmail,
      driveFolderId: effectiveFolder,
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
 * Removes session-uploaded photos from local gallery storage upon user logout.
 * Keeps photos permanently preserved in Google Drive / backend while isolating guest privacy locally.
 */
export function clearUserSessionPhotos(targetEmail?: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const uploaded: WeddingPhoto[] = JSON.parse(raw);

    const emailToClear = targetEmail?.trim().toLowerCase();

    const filtered = uploaded.filter((p) => {
      // The authentic hero couple portrait is always preserved
      if (p.id === "hero_couple_photo") return true;

      // If specific email provided, remove photos uploaded by that email
      if (emailToClear && p.uploaderEmail) {
        return p.uploaderEmail.toLowerCase() !== emailToClear;
      }

      // If generic logout with no email, remove all guest uploads so local view is clean
      return p.photographer !== "Guest Live Upload" && !p.uploaderEmail;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event("shaadisnap_photos_updated"));
  } catch (err) {
    console.error("Failed to clear session photos on logout:", err);
  }
}

/**
 * Returns photos scoped to the currently authenticated user session.
 * - Authenticated guests see: Approved wedding photos + their own uploads (matching active email)
 * - CEO / CTO / Organizers see: All photos across the event for master moderation
 * - Unauthenticated / Logged-out guests see: ONLY official approved wedding photos (zero private guest uploads)
 */
export function getPhotosForCurrentUser(): WeddingPhoto[] {
  const allPhotos = getWeddingPhotos();
  const currentUser = getStoredGoogleUser();

  if (!currentUser || !currentUser.email) {
    // Unauthenticated guest: return approved wedding photos PLUS any photos uploaded in this browser
    return allPhotos.filter((p) => {
      if (p.id === "hero_couple_photo") return true;
      if (p.approvalStatus === "approved") return true;
      if (p.photographer === "Guest Live Upload" || p.uploaderEmail === "guest@maan-ai.com" || p.driveFileId) return true;
      return false;
    });
  }

  const userEmail = currentUser.email.toLowerCase();

  // Leadership / Organizers: full event visibility for master moderation
  const isOrganizer =
    currentUser.scopes?.includes("admin") ||
    currentUser.scopes?.includes("organizer") ||
    userEmail.includes("admin") ||
    userEmail.includes("marwaha") ||
    userEmail.includes("gulati") ||
    userEmail.includes("kabir") ||
    userEmail.includes("dhairya") ||
    userEmail.includes("simran");

  if (isOrganizer) {
    return allPhotos;
  }

  // Authenticated guest: approved wedding photos + photos uploaded by this guest email
  return allPhotos.filter((p) => {
    if (p.id === "hero_couple_photo") return true;
    if (p.approvalStatus === "approved") return true;
    if (p.uploaderEmail && p.uploaderEmail.toLowerCase() === userEmail) return true;
    return false;
  });
}

// Auto-register session logout listener in browser environment
if (typeof window !== "undefined") {
  window.addEventListener("shaadisnap_user_logout", (e: Event) => {
    const custom = e as CustomEvent<{ email?: string }>;
    clearUserSessionPhotos(custom.detail?.email);
  });
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

const STORAGE_KEY_SEARCH_COUNT = "shaadisnap_actual_search_count";

/**
 * Records an authentic guest search event (from live camera or guest pass)
 */
export function recordActualSearch(guestIdentifier?: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SEARCH_COUNT);
    const count = (parseInt(raw || "0", 10) || 0) + 1;
    localStorage.setItem(STORAGE_KEY_SEARCH_COUNT, count.toString());
    window.dispatchEvent(
      new CustomEvent("shaadisnap_search_performed", { detail: { count, guestIdentifier } })
    );
    window.dispatchEvent(new Event("shaadisnap_stats_updated"));
    return count;
  } catch {
    return 1;
  }
}

/**
 * Retrieves the actual count of authentic guest searches performed
 */
export function getActualSearchCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SEARCH_COUNT);
    return parseInt(raw || "0", 10) || 0;
  } catch {
    return 0;
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
