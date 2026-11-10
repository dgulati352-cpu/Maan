import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface AdminPhotoRecord {
  id: string;
  eventId: string;
  url: string;
  thumbnailUrl: string;
  fallbackUrl?: string;
  filename: string;
  fileHash: string; // SHA-256 for duplicate detection
  sizeBytes: number;
  sizeFormatted: string;
  mimeType: string;
  width?: number;
  height?: number;
  ceremony: string;
  album: string;
  source: "computer" | "folder_drag" | "google_drive";
  driveFileId?: string;
  driveFolderId?: string;
  driveFolderName?: string;
  processingStatus: "PENDING" | "UPLOADING" | "IMPORTING" | "PROCESSING" | "COMPLETED" | "FAILED";
  facesDetected: number;
  facesIndexed: number;
  approvalStatus: "approved" | "pending_ceo_approval" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  uploaderEmail: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAlbumRecord {
  id: string;
  eventId: string;
  name: string;
  ceremony: string;
  description?: string;
  coverPhotoUrl?: string;
  photoCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPhotoJobRecord {
  id: string;
  photoId: string;
  eventId: string;
  stage: "HASHING" | "STORAGE" | "THUMBNAIL" | "FACE_DETECTION" | "FACE_INDEXING" | "COMPLETED" | "FAILED";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  progress: number; // 0 - 100%
  errorMessage?: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface AdminPhotoVaultData {
  photos: AdminPhotoRecord[];
  albums: AdminAlbumRecord[];
  jobs: AdminPhotoJobRecord[];
}

const DEFAULT_ALBUMS: AdminAlbumRecord[] = [
  {
    id: "album_mehendi",
    eventId: "marwaha-gulati-2026",
    name: "Mehendi Ceremony",
    ceremony: "Mehendi",
    description: "Bridal henna intricacies and celebration candids",
    photoCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "album_haldi",
    eventId: "marwaha-gulati-2026",
    name: "Haldi Sunshine",
    ceremony: "Haldi",
    description: "Turmeric rituals and family blessings",
    photoCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "album_sangeet",
    eventId: "marwaha-gulati-2026",
    name: "Sangeet Musical Night",
    ceremony: "Sangeet",
    description: "Dance floor celebrations and musical performances",
    photoCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "album_wedding",
    eventId: "marwaha-gulati-2026",
    name: "Varmala & Royal Phere",
    ceremony: "Phere",
    description: "Sacred pheras and main wedding ceremony",
    photoCount: 1,
    coverPhotoUrl: "/hero-couple.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "album_reception",
    eventId: "marwaha-gulati-2026",
    name: "Grand Reception Gala",
    ceremony: "Reception",
    description: "Evening banquet and VIP toasts",
    photoCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_COUPLE_PHOTO_RECORD: AdminPhotoRecord = {
  id: "hero_couple_photo",
  eventId: "marwaha-gulati-2026",
  url: "/hero-couple.jpg",
  thumbnailUrl: "/hero-couple.jpg",
  fallbackUrl: "/hero-couple.jpg",
  filename: "hero-couple.jpg",
  fileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  sizeBytes: 1845200,
  sizeFormatted: "1.8 MB",
  mimeType: "image/jpeg",
  width: 1920,
  height: 2560,
  ceremony: "Reception",
  album: "Grand Reception Gala",
  source: "computer",
  processingStatus: "COMPLETED",
  facesDetected: 2,
  facesIndexed: 2,
  approvalStatus: "approved",
  approvedBy: "Kabir Marwaha (Chief Executive Officer)",
  approvedAt: "2026-11-06T12:00:00Z",
  uploaderEmail: "admin@maan-ai.com",
  createdAt: "2026-11-06T12:00:00Z",
  updatedAt: "2026-11-06T12:00:00Z",
};

let memoryCache: AdminPhotoVaultData | null = null;

function getVaultFilePath(): string {
  const candidateDirs = [
    path.resolve(process.cwd(), "data"),
    path.resolve(process.cwd(), "..", "data"),
    path.resolve(process.cwd(), ".next"),
  ];

  for (const dir of candidateDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      return path.join(dir, "admin_photos_vault.json");
    } catch {
      // Continue to next directory candidate
    }
  }

  return path.join(process.cwd(), "admin_photos_vault.json");
}

function loadVault(): AdminPhotoVaultData {
  if (memoryCache) return memoryCache;

  const filePath = getVaultFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.photos)) {
        memoryCache = parsed;
        return memoryCache!;
      }
    }
  } catch (err) {
    console.warn("Could not read admin photo vault file, initializing defaults:", err);
  }

  memoryCache = {
    photos: [DEFAULT_COUPLE_PHOTO_RECORD],
    albums: [...DEFAULT_ALBUMS],
    jobs: [],
  };
  saveVault(memoryCache);
  return memoryCache;
}

function saveVault(data: AdminPhotoVaultData): void {
  memoryCache = data;
  try {
    const filePath = getVaultFilePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn("Could not persist admin photo vault to disk:", err);
  }
}

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function calculateBufferHash(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

export function listAdminPhotos(eventId: string = "marwaha-gulati-2026"): AdminPhotoRecord[] {
  const vault = loadVault();
  return vault.photos
    .filter((p) => p.eventId === eventId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function findPhotoByHash(eventId: string, hash: string): AdminPhotoRecord | undefined {
  const vault = loadVault();
  return vault.photos.find((p) => p.eventId === eventId && p.fileHash === hash);
}

export function findPhotoByDriveId(eventId: string, driveFileId: string): AdminPhotoRecord | undefined {
  const vault = loadVault();
  return vault.photos.find((p) => p.eventId === eventId && p.driveFileId === driveFileId);
}

export function createAdminPhoto(data: Omit<AdminPhotoRecord, "id" | "createdAt" | "updatedAt">): {
  photo: AdminPhotoRecord;
  isDuplicate: boolean;
} {
  const vault = loadVault();

  // Deduplication check by SHA-256 hash
  const existingByHash = vault.photos.find(
    (p) => p.eventId === data.eventId && p.fileHash === data.fileHash
  );
  if (existingByHash) {
    return { photo: existingByHash, isDuplicate: true };
  }

  // Deduplication check by Google Drive file ID
  if (data.driveFileId) {
    const existingByDrive = vault.photos.find(
      (p) => p.eventId === data.eventId && p.driveFileId === data.driveFileId
    );
    if (existingByDrive) {
      return { photo: existingByDrive, isDuplicate: true };
    }
  }

  const now = new Date().toISOString();
  const newPhoto: AdminPhotoRecord = {
    ...data,
    id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  };

  vault.photos.unshift(newPhoto);

  // Update album photoCount
  const targetAlbum = vault.albums.find(
    (a) => a.eventId === data.eventId && (a.name === data.album || a.ceremony === data.ceremony)
  );
  if (targetAlbum) {
    targetAlbum.photoCount = vault.photos.filter((p) => p.album === targetAlbum.name).length;
    targetAlbum.updatedAt = now;
  }

  saveVault(vault);
  return { photo: newPhoto, isDuplicate: false };
}

export function updateAdminPhoto(
  id: string,
  updates: Partial<Omit<AdminPhotoRecord, "id" | "createdAt">>
): AdminPhotoRecord | null {
  const vault = loadVault();
  const idx = vault.photos.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  vault.photos[idx] = {
    ...vault.photos[idx],
    ...updates,
    updatedAt: now,
  };

  saveVault(vault);
  return vault.photos[idx];
}

export function deleteAdminPhoto(id: string): boolean {
  if (id === "hero_couple_photo") {
    // Preserve default couple photo
    return false;
  }
  const vault = loadVault();
  const beforeLen = vault.photos.length;
  vault.photos = vault.photos.filter((p) => p.id !== id);
  if (vault.photos.length !== beforeLen) {
    saveVault(vault);
    return true;
  }
  return false;
}

export function batchDeleteAdminPhotos(ids: string[]): number {
  const safeIds = ids.filter((id) => id !== "hero_couple_photo");
  if (safeIds.length === 0) return 0;

  const vault = loadVault();
  const beforeLen = vault.photos.length;
  const toDeleteSet = new Set(safeIds);
  vault.photos = vault.photos.filter((p) => !toDeleteSet.has(p.id));
  const deleted = beforeLen - vault.photos.length;
  if (deleted > 0) {
    saveVault(vault);
  }
  return deleted;
}

export function batchApproveAdminPhotos(ids: string[]): number {
  const vault = loadVault();
  const now = new Date().toISOString();
  let count = 0;

  vault.photos = vault.photos.map((p) => {
    if (ids.includes(p.id)) {
      count++;
      return {
        ...p,
        approvalStatus: "approved",
        approvedBy: "Kabir Marwaha (Chief Executive Officer)",
        approvedAt: now,
        updatedAt: now,
      };
    }
    return p;
  });

  if (count > 0) {
    saveVault(vault);
  }
  return count;
}

export function batchAssignAlbum(ids: string[], albumName: string, ceremonyName?: string): number {
  const vault = loadVault();
  const now = new Date().toISOString();
  let count = 0;

  vault.photos = vault.photos.map((p) => {
    if (ids.includes(p.id)) {
      count++;
      return {
        ...p,
        album: albumName,
        ceremony: ceremonyName || p.ceremony,
        updatedAt: now,
      };
    }
    return p;
  });

  // Re-calculate album counts
  vault.albums = vault.albums.map((a) => ({
    ...a,
    photoCount: vault.photos.filter((p) => p.album === a.name).length,
    updatedAt: now,
  }));

  if (count > 0) {
    saveVault(vault);
  }
  return count;
}

export function listAdminAlbums(eventId: string = "marwaha-gulati-2026"): AdminAlbumRecord[] {
  const vault = loadVault();
  return vault.albums
    .filter((a) => a.eventId === eventId)
    .map((a) => ({
      ...a,
      photoCount: vault.photos.filter((p) => p.album === a.name).length,
    }));
}

export function createAdminAlbum(eventId: string, name: string, ceremony: string, description?: string): AdminAlbumRecord {
  const vault = loadVault();
  const now = new Date().toISOString();
  const existing = vault.albums.find((a) => a.eventId === eventId && a.name.toLowerCase() === name.toLowerCase());
  if (existing) return existing;

  const newAlbum: AdminAlbumRecord = {
    id: `album_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    eventId,
    name,
    ceremony,
    description: description || `Album for ${ceremony} celebrations`,
    photoCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  vault.albums.push(newAlbum);
  saveVault(vault);
  return newAlbum;
}

export function getAdminPhotoAnalytics(eventId: string = "marwaha-gulati-2026") {
  const vault = loadVault();
  const eventPhotos = vault.photos.filter((p) => p.eventId === eventId);
  const total = eventPhotos.length;

  const uploadedFromComputer = eventPhotos.filter((p) => p.source === "computer" || p.source === "folder_drag").length;
  const importedFromDrive = eventPhotos.filter((p) => p.source === "google_drive").length;
  const completed = eventPhotos.filter((p) => p.processingStatus === "COMPLETED").length;
  const pending = eventPhotos.filter((p) => p.processingStatus === "PENDING" || p.processingStatus === "UPLOADING" || p.processingStatus === "IMPORTING").length;
  const failed = eventPhotos.filter((p) => p.processingStatus === "FAILED").length;
  const processing = eventPhotos.filter((p) => p.processingStatus === "PROCESSING").length;

  const totalFacesIndexed = eventPhotos.reduce((acc, p) => acc + (p.facesIndexed || 0), 0);
  const totalStorageBytes = eventPhotos.reduce((acc, p) => acc + (p.sizeBytes || 0), 0);

  const processingProgress = total === 0 ? 100 : Math.round((completed / total) * 100);

  return {
    eventId,
    totalPhotos: total,
    successfullyUploaded: uploadedFromComputer,
    importedFromGoogleDrive: importedFromDrive,
    completedPhotos: completed,
    pendingUploads: pending,
    failedUploads: failed,
    processingPhotos: processing,
    indexedFaces: totalFacesIndexed,
    storageConsumedBytes: totalStorageBytes,
    storageConsumedFormatted: formatBytes(totalStorageBytes),
    aiProcessingProgressPercent: processingProgress,
    approvedCount: eventPhotos.filter((p) => p.approvalStatus === "approved").length,
    pendingCeoApprovalCount: eventPhotos.filter((p) => p.approvalStatus === "pending_ceo_approval").length,
  };
}

// Processing Jobs Management
export function createPhotoJob(photoId: string, eventId: string = "marwaha-gulati-2026"): AdminPhotoJobRecord {
  const vault = loadVault();
  const now = new Date().toISOString();
  const job: AdminPhotoJobRecord = {
    id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    photoId,
    eventId,
    stage: "HASHING",
    status: "PROCESSING",
    progress: 10,
    attempts: 1,
    createdAt: now,
    updatedAt: now,
  };
  vault.jobs.unshift(job);
  saveVault(vault);
  return job;
}

export function updatePhotoJob(
  id: string,
  updates: Partial<Omit<AdminPhotoJobRecord, "id" | "createdAt">>
): AdminPhotoJobRecord | null {
  const vault = loadVault();
  const idx = vault.jobs.findIndex((j) => j.id === id);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  vault.jobs[idx] = {
    ...vault.jobs[idx],
    ...updates,
    updatedAt: now,
  };
  saveVault(vault);
  return vault.jobs[idx];
}

export function listPhotoJobs(eventId: string = "marwaha-gulati-2026", limit: number = 50): AdminPhotoJobRecord[] {
  const vault = loadVault();
  return vault.jobs.filter((j) => j.eventId === eventId).slice(0, limit);
}

