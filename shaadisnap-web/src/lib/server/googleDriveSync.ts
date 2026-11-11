/**
 * Server-side Google Drive live folder sync helper.
 * Reads image files directly from the official wedding Google Drive folder
 * so photos uploaded from any device appear across all devices in real time.
 */

export interface DriveSyncedPhoto {
  id: string;
  driveFileId: string;
  filename: string;
  title: string;
  ceremony: "Phere" | "Sangeet" | "Mehendi" | "Haldi" | "Reception";
  url: string;
  thumbnailUrl: string;
  fallbackUrl: string;
  facesCount: number;
  sizeBytes: number;
  createdAt: string;
  createdAtMs: number;
  photographer: string;
  approvalStatus: "approved";
  uploaderEmail?: string;
  driveFolderId: string;
}

const DEFAULT_DRIVE_FOLDER_ID = (
  process.env.GOOGLE_DRIVE_FOLDER_ID || "1G53zacxOMhcxh7EDhnL37oRgN3awVJsy"
).trim();

const GOOGLE_APPS_SCRIPT_URL = (
  process.env.GOOGLE_APPS_SCRIPT_URL ||
  "https://script.google.com/macros/s/AKfycbznLjQwqQJOFnmJKhGdSCNe69vnbGd2rSsoeF1A1WnEl5zJH2dt7M_qa54FluIbIVGnmg/exec"
).trim();

// Warm-instance deleted IDs so deleted Drive items never flicker back during propagation
const serverDeletedDriveIds = new Set<string>();

export function markDriveFileDeleted(fileId: string): void {
  if (fileId) {
    serverDeletedDriveIds.add(fileId.trim().toLowerCase());
  }
}

export function isDriveFileDeleted(fileId: string): boolean {
  return Boolean(fileId && serverDeletedDriveIds.has(fileId.trim().toLowerCase()));
}

const VALID_CEREMONIES = new Set<DriveSyncedPhoto["ceremony"]>([
  "Phere",
  "Sangeet",
  "Mehendi",
  "Haldi",
  "Reception",
]);

const DUMMY_STUB_IDS = new Set([
  "1ocgwqzh1sgacaarbfy60m0d5nborw-gc",
  "1bitz5kw4ohgvp-2eqlcmoeokotdzdtbx",
  "1ocnfkbk84jkjaq8fhappz6yk4gk7wlgi",
  "1-vzek1f3gipeuqhhrk8qk945wsvglbdp",
  "1rdzubtc4oyxzvq4k_-dwx_o7rkdkhym-",
  "1wlyogljg_uuxhobw1wit0hv-lfkkyar_",
  "1bnhczyg3bx8zbwgbrtpfc4ijn5hperju",
]);

function isDummyTestUpload(
  name: string,
  sizeBytes?: number,
  fileId?: string
): boolean {
  if (fileId && DUMMY_STUB_IDS.has(fileId.toLowerCase())) {
    return true;
  }
  if (typeof sizeBytes === "number" && sizeBytes > 0 && sizeBytes < 500) {
    return true;
  }
  const lower = (name || "").toLowerCase();
  return (
    lower.includes("live-test-dhairya") ||
    lower.includes("test_dhairya") ||
    lower.includes("smoke-test") ||
    lower.includes("test-real") ||
    lower.includes("test_destination") ||
    lower.includes("test_invalid")
  );
}

function parseDriveFilename(
  filename: string,
  createdTime?: string
): {
  title: string;
  ceremony: DriveSyncedPhoto["ceremony"];
  createdAtMs: number;
} {
  const safeName = (filename || "Wedding Memory.jpg").trim();
  const match = safeName.match(/^(Phere|Sangeet|Mehendi|Haldi|Reception)_(\d{10,14})_(.+)$/i);

  let ceremony: DriveSyncedPhoto["ceremony"] = "Sangeet";
  let title = safeName;
  let parsedTs = createdTime ? new Date(createdTime).getTime() : 0;

  if (match) {
    const rawCeremony =
      match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    if (VALID_CEREMONIES.has(rawCeremony as DriveSyncedPhoto["ceremony"])) {
      ceremony = rawCeremony as DriveSyncedPhoto["ceremony"];
    }
    const rawNumeric = Number(match[2]);
    if (!Number.isNaN(rawNumeric) && rawNumeric > 1_000_000_000) {
      const normalizedMs = rawNumeric < 1_000_000_000_000 ? rawNumeric * 1000 : rawNumeric;
      if (!parsedTs || Number.isNaN(parsedTs)) {
        parsedTs = normalizedMs;
      }
    }
    title = match[3] || safeName;
  }

  if (!parsedTs || Number.isNaN(parsedTs)) {
    parsedTs = Date.now();
  }

  return { title, ceremony, createdAtMs: parsedTs };
}

function buildDrivePhotoRecord(
  fileId: string,
  name: string,
  folderId: string,
  sizeBytes: number,
  createdTime?: string
): DriveSyncedPhoto {
  const { title, ceremony, createdAtMs } = parseDriveFilename(name, createdTime);
  const cdnUrl = `https://lh3.googleusercontent.com/d/${fileId}=w1600`;
  const thumbUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;

  return {
    id: fileId,
    driveFileId: fileId,
    filename: title,
    title,
    ceremony,
    url: cdnUrl,
    thumbnailUrl: thumbUrl,
    fallbackUrl: thumbUrl,
    facesCount: 1,
    sizeBytes: sizeBytes || 0,
    createdAt: new Date(createdAtMs).toISOString(),
    createdAtMs,
    photographer: "Guest Live Upload",
    approvalStatus: "approved",
    driveFolderId: folderId,
  };
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

async function fetchViaDriveApiV3(folderId: string): Promise<DriveSyncedPhoto[] | null> {
  const apiKey = (
    process.env.GOOGLE_API_KEY_SECONDARY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY ||
    ""
  ).trim();

  if (!apiKey) return null;

  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent(
    "nextPageToken,files(id,name,mimeType,createdTime,size,thumbnailLink)"
  );
  const rawReferer = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://maan-gulati.vercel.app"
  ).trim();
  const referer = rawReferer.endsWith("/") ? rawReferer : `${rawReferer}/`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const results: DriveSyncedPhoto[] = [];
    let pageToken = "";

    for (let page = 0; page < 5; page++) {
      const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=createdTime%20desc&pageSize=100${pageParam}&key=${encodeURIComponent(
        apiKey
      )}`;

      const res = await fetch(url, {
        headers: {
          Referer: referer,
        },
        cache: "no-store",
        signal: controller.signal,
      });

      if (!res.ok) return results.length > 0 ? results : null;
      const data = (await res.json()) as {
        nextPageToken?: string;
        files?: Array<{
          id?: string;
          name?: string;
          mimeType?: string;
          createdTime?: string;
          size?: string;
        }>;
      };

      if (!Array.isArray(data.files)) {
        return results.length > 0 ? results : null;
      }

      for (const file of data.files) {
        if (!file.id || !file.name) continue;
        if (!file.mimeType?.startsWith("image/")) continue;
        const sizeBytes = Number(file.size || 0);
        if (isDummyTestUpload(file.name, sizeBytes, file.id)) continue;

        results.push(
          buildDrivePhotoRecord(
            file.id,
            file.name,
            folderId,
            sizeBytes,
            file.createdTime
          )
        );
      }

      if (!data.nextPageToken) break;
      pageToken = data.nextPageToken;
    }

    return results;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchViaEmbeddedFolderView(
  folderId: string
): Promise<DriveSyncedPhoto[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(
      `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(
        folderId
      )}#grid`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        },
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!res.ok) return [];
    const html = await res.text();

    const entries = html.split('<div class="flip-entry"');
    const results: DriveSyncedPhoto[] = [];

    for (let i = 1; i < entries.length; i++) {
      const chunk = entries[i];
      // Only include image entries (they use flip-entry-thumb; scripts/docs use flip-entry-icon)
      if (!chunk.includes("flip-entry-thumb")) continue;

      const idMatch = chunk.match(/id="entry-([^"]+)"/);
      const titleMatch = chunk.match(/<div class="flip-entry-title">([\s\S]*?)<\/div>/);
      if (!idMatch || !titleMatch) continue;

      const fileId = idMatch[1].trim();
      const rawTitle = decodeHtmlEntities(titleMatch[1].trim());
      if (!fileId || !rawTitle || isDummyTestUpload(rawTitle, 0, fileId)) continue;

      results.push(buildDrivePhotoRecord(fileId, rawTitle, folderId, 0));
    }

    // Sort newest first by parsed timestamp
    results.sort((a, b) => b.createdAtMs - a.createdAtMs);
    return results;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches all live photos currently stored in the wedding Google Drive folder.
 * Uses Drive API v3 when available and falls back to public folder view.
 */
export async function fetchLiveDriveFolderPhotos(
  folderId: string = DEFAULT_DRIVE_FOLDER_ID
): Promise<DriveSyncedPhoto[]> {
  const apiPhotos = await fetchViaDriveApiV3(folderId);
  const raw = apiPhotos !== null ? apiPhotos : await fetchViaEmbeddedFolderView(folderId);
  return raw.filter((p) => !isDriveFileDeleted(p.id) && !isDriveFileDeleted(p.driveFileId));
}

/**
 * Marks a Google Drive photo deleted locally and forwards trash action to Apps Script.
 */
export async function trashDriveFile(fileId: string): Promise<{ driveTrashed: boolean }> {
  markDriveFileDeleted(fileId);
  if (!fileId || !GOOGLE_APPS_SCRIPT_URL) {
    return { driveTrashed: false };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "delete",
        fileId,
        driveFolderId: DEFAULT_DRIVE_FOLDER_ID,
      }),
      redirect: "follow",
      signal: controller.signal,
    });
    const data = (await res.json().catch(() => ({}))) as { status?: string; deleted?: boolean };
    return { driveTrashed: data.status === "success" || Boolean(data.deleted) };
  } catch {
    return { driveTrashed: false };
  } finally {
    clearTimeout(timeout);
  }
}
