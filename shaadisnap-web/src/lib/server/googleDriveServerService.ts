import { google, drive_v3 } from "googleapis";
import { processAndStoreImageBuffer } from "./storageService";
import {
  createAdminPhoto,
  createPhotoJob,
  updatePhotoJob,
  findPhotoByHash,
  findPhotoByDriveId,
  AdminPhotoRecord,
} from "./adminPhotoManager";

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  "shaadisnap-drive-client-id-2026.apps.googleusercontent.com";

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";

export interface GoogleDriveItemInfo {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes?: number;
  thumbnailLink?: string;
  isFolder: boolean;
  folderId?: string;
  folderName?: string;
}

export interface FolderScanResult {
  folderId: string;
  folderName: string;
  files: GoogleDriveItemInfo[];
  totalSizeBytes: number;
  nextPageToken?: string;
}

export function createDriveClient(accessToken?: string): drive_v3.Drive {
  if (accessToken) {
    const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
    auth.setCredentials({ access_token: accessToken });
    return google.drive({ version: "v3", auth });
  }

  // Fallback: use googleapis default or service account if available
  return google.drive({ version: "v3" });
}

/**
 * Recursively or paginated scan of a Google Drive folder for image files
 */
export async function scanDriveFolder(
  folderId: string,
  accessToken: string,
  pageToken?: string,
  pageSize: number = 100
): Promise<FolderScanResult> {
  const drive = createDriveClient(accessToken);

  // 1. Get Folder metadata
  let folderName = "Google Drive Folder";
  try {
    const meta = await drive.files.get({
      fileId: folderId,
      fields: "id, name, mimeType",
    });
    if (meta.data.name) {
      folderName = meta.data.name;
    }
  } catch (err) {
    console.warn(`Could not fetch metadata for folder ${folderId}:`, err);
  }

  // 2. Query images inside folder with pagination
  const query = `'${folderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType = 'application/vnd.google-apps.folder')`;
  
  const response = await drive.files.list({
    q: query,
    pageSize,
    pageToken: pageToken || undefined,
    fields: "nextPageToken, files(id, name, mimeType, size, thumbnailLink, createdTime)",
    orderBy: "name",
  });

  const rawFiles = response.data.files || [];
  let totalSizeBytes = 0;

  const files: GoogleDriveItemInfo[] = rawFiles.map((f) => {
    const isFolder = f.mimeType === "application/vnd.google-apps.folder";
    const size = f.size ? parseInt(f.size, 10) : 0;
    if (!isFolder) {
      totalSizeBytes += size;
    }

    return {
      id: f.id || "",
      name: f.name || "Untitled_Photo.jpg",
      mimeType: f.mimeType || "image/jpeg",
      sizeBytes: size,
      thumbnailLink: f.thumbnailLink || (f.id ? `https://drive.google.com/thumbnail?id=${f.id}&sz=w400` : undefined),
      isFolder,
      folderId,
      folderName,
    };
  });

  return {
    folderId,
    folderName,
    files,
    totalSizeBytes,
    nextPageToken: response.data.nextPageToken || undefined,
  };
}

/**
 * Downloads a photo from Google Drive with retry logic and exponential backoff
 */
export async function downloadDriveFileBuffer(
  fileId: string,
  accessToken: string,
  maxRetries: number = 3
): Promise<{ buffer: Buffer; mimeType: string }> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < maxRetries) {
    attempt++;
    try {
      // Use drive.files.get with alt=media
      const drive = createDriveClient(accessToken);
      const res = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "arraybuffer" }
      );

      const buffer = Buffer.from(res.data as ArrayBuffer);
      const mimeType = (res.headers["content-type"] as string) || "image/jpeg";
      return { buffer, mimeType };
    } catch (err: unknown) {
      lastError = err;
      console.warn(`[Drive Download Attempt ${attempt} failed for ${fileId}]:`, err);
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delayMs = Math.pow(2, attempt) * 500 + Math.random() * 200;
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }

  throw new Error(`Failed to download Google Drive file ${fileId} after ${maxRetries} attempts: ${lastError}`);
}

export interface DriveImportItem {
  fileId: string;
  filename: string;
  sizeBytes?: number;
  ceremony: string;
  album: string;
  folderId?: string;
  folderName?: string;
}

export interface DriveImportProgressResult {
  fileId: string;
  filename: string;
  status: "COMPLETED" | "SKIPPED_DUPLICATE" | "FAILED";
  photo?: AdminPhotoRecord;
  error?: string;
}

/**
 * Imports a single Google Drive file into permanent application storage,
 * performs duplicate detection, creates DB records, and triggers face indexing.
 */
export async function importSingleDrivePhoto(
  item: DriveImportItem,
  accessToken: string,
  eventId: string = "marwaha-gulati-2026",
  uploaderEmail: string = "admin@maan-ai.com"
): Promise<DriveImportProgressResult> {
  // 1. Check if already imported by driveFileId
  const existingByDrive = findPhotoByDriveId(eventId, item.fileId);
  if (existingByDrive) {
    return {
      fileId: item.fileId,
      filename: item.filename,
      status: "SKIPPED_DUPLICATE",
      photo: existingByDrive,
    };
  }

  // 2. Download from Drive
  let downloadResult: { buffer: Buffer; mimeType: string };
  try {
    downloadResult = await downloadDriveFileBuffer(item.fileId, accessToken);
  } catch (dlErr: unknown) {
    const errorMsg = dlErr instanceof Error ? dlErr.message : "Download failed";
    return {
      fileId: item.fileId,
      filename: item.filename,
      status: "FAILED",
      error: errorMsg,
    };
  }

  const { buffer, mimeType } = downloadResult;

  // 3. Process & store permanently, extracting hash & indexing faces
  const tempPhotoId = `gdrive_${item.fileId}_${Date.now()}`;
  const job = createPhotoJob(tempPhotoId, eventId);

  try {
    updatePhotoJob(job.id, { stage: "STORAGE", progress: 30 });
    const stored = await processAndStoreImageBuffer(
      buffer,
      item.filename,
      eventId,
      tempPhotoId,
      mimeType
    );

    updatePhotoJob(job.id, { stage: "FACE_INDEXING", progress: 70 });

    // 4. Create admin photo record in vault
    const { photo, isDuplicate } = createAdminPhoto({
      eventId,
      url: stored.url,
      thumbnailUrl: stored.thumbnailUrl,
      filename: item.filename,
      fileHash: stored.fileHash,
      sizeBytes: stored.sizeBytes,
      sizeFormatted: stored.sizeFormatted,
      mimeType: stored.mimeType,
      ceremony: item.ceremony || "Reception",
      album: item.album || "Google Drive Imports",
      source: "google_drive",
      driveFileId: item.fileId,
      driveFolderId: item.folderId,
      driveFolderName: item.folderName,
      processingStatus: "COMPLETED",
      facesDetected: stored.facesDetected,
      facesIndexed: stored.facesIndexed,
      approvalStatus: "approved",
      approvedBy: "Kabir Marwaha (Chief Executive Officer)",
      approvedAt: new Date().toISOString(),
      uploaderEmail,
    });

    updatePhotoJob(job.id, { stage: "COMPLETED", status: "COMPLETED", progress: 100, completedAt: new Date().toISOString() });

    return {
      fileId: item.fileId,
      filename: item.filename,
      status: isDuplicate ? "SKIPPED_DUPLICATE" : "COMPLETED",
      photo,
    };
  } catch (procErr: unknown) {
    const msg = procErr instanceof Error ? procErr.message : "Processing error";
    updatePhotoJob(job.id, { stage: "FAILED", status: "FAILED", errorMessage: msg });
    return {
      fileId: item.fileId,
      filename: item.filename,
      status: "FAILED",
      error: msg,
    };
  }
}

