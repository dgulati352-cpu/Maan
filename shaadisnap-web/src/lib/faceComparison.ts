import { WeddingPhoto } from "@/data/mockWeddingData";
import { saveAiPhotoMetaBatch } from "@/lib/weddingPhotoStore";

/**
 * ShaadiSnap / Maan AI — Real Neural Face Recognition & Smart Wedding Photo Sorter
 *
 * Uses @vladmandic/face-api (TensorFlow.js WebGL/CPU) in the browser with:
 * - SSD MobileNet v1 + TinyFaceDetector fallback for multi-scale multi-face localization
 *   (solo portraits, couple shots, distant stage frames, and dense group photos)
 * - 68-point facial landmark alignment
 * - ResNet-34 128-dimensional biometric embeddings (calibrated Euclidean distance matching)
 * - Real visual ceremony classifier (HSV palette + lighting cues + filename signals)
 * - Laplacian sharpness & aesthetic scoring + multi-mode smart sorting
 */

type FaceApiModule = typeof import("@vladmandic/face-api");

export type PhotoSortMode =
  | "similarity"
  | "ai-smart"
  | "newest"
  | "oldest"
  | "ceremony"
  | "faces-desc";

export interface PhotoAiAnalysis {
  id: string;
  facesCount: number;
  shotType: "solo" | "couple" | "group" | "scenic";
  qualityScore: number;
  sharpnessScore: number;
  predictedCeremony: WeddingPhoto["ceremony"];
  descriptors: Float32Array[];
}

export interface SelfieSearchDiagnostics {
  matches: WeddingPhoto[];
  selfieFacesDetected: number;
  scannedCount: number;
  totalGalleryFaces: number;
  analyzedPhotos: WeddingPhoto[];
  errorReason?: string;
}

const LOCAL_MODEL_URI = "/models";
const CDN_MODEL_URI = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

const CEREMONY_ORDER: Record<string, number> = {
  Haldi: 1,
  Mehendi: 2,
  Sangeet: 3,
  Phere: 4,
  Reception: 5,
  All: 6,
};

let faceApiInstance: FaceApiModule | null = null;
let modelLoadPromise: Promise<FaceApiModule> | null = null;
const photoAnalysisCache = new Map<string, PhotoAiAnalysis>();

function buildPhotoCacheKey(photo: Pick<WeddingPhoto, "id" | "url" | "fallbackUrl">): string {
  return `${photo.id}::${photo.fallbackUrl || photo.url}`;
}

/**
 * Lazily loads @vladmandic/face-api models once per browser session.
 * Prefers same-origin /models static weights and falls back to jsDelivr CDN if needed.
 */
export async function ensureFaceModelsLoaded(): Promise<FaceApiModule> {
  if (typeof window === "undefined") {
    throw new Error("Neural face recognition models require a browser environment");
  }
  if (faceApiInstance) {
    return faceApiInstance;
  }
  if (modelLoadPromise) {
    return modelLoadPromise;
  }

  modelLoadPromise = (async () => {
    const faceapi = await import("@vladmandic/face-api");

    // Initialize best available TFJS backend cleanly without throwing if WebGL is restricted
    try {
      const tfRuntime = faceapi.tf as unknown as { ready?: () => Promise<void> };
      if (tfRuntime && typeof tfRuntime.ready === "function") {
        await tfRuntime.ready();
      }
    } catch {
      // Proceed with default runtime backend
    }

    const loadAllNets = async (baseUrl: string) => {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(baseUrl),
        faceapi.nets.tinyFaceDetector.loadFromUri(baseUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(baseUrl),
      ]);
    };

    try {
      await loadAllNets(LOCAL_MODEL_URI);
    } catch (localErr) {
      console.warn("Primary /models weight load failed, retrying CDN fallback:", localErr);
      await loadAllNets(CDN_MODEL_URI);
    }

    faceApiInstance = faceapi;
    return faceapi;
  })();

  try {
    return await modelLoadPromise;
  } catch (err) {
    modelLoadPromise = null;
    throw err;
  }
}

/**
 * Resolves a CORS-safe URL for Canvas and WebGL pixel extraction.
 */
export function getCorsSafeImageUrl(src: string): string {
  if (typeof window === "undefined") return src;
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/")) {
    return src;
  }
  if (src.startsWith("http://") || src.startsWith("https://")) {
    if (src.startsWith(window.location.origin)) {
      return src;
    }
    return `/api/image-proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}

function loadSingleImage(src: string, timeoutMs = 15000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Cannot load image during SSR"));
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";

    const timer = window.setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      reject(new Error(`Timed out loading image: ${src.substring(0, 60)}`));
    }, timeoutMs);

    img.onload = () => {
      window.clearTimeout(timer);
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        resolve(img);
      } else {
        reject(new Error(`Loaded image has empty dimensions: ${src.substring(0, 60)}`));
      }
    };

    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error(`Failed to load image: ${src.substring(0, 60)}`));
    };

    img.src = src;
  });
}

async function loadImageFromCandidates(candidates: string[]): Promise<HTMLImageElement> {
  const unique = Array.from(new Set(candidates.filter(Boolean)));
  let lastErr: unknown;

  for (const raw of unique) {
    const safe = getCorsSafeImageUrl(raw);
    try {
      return await loadSingleImage(safe);
    } catch (err) {
      lastErr = err;
      if (safe !== raw) {
        try {
          return await loadSingleImage(raw);
        } catch (directErr) {
          lastErr = directErr;
        }
      }
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("Failed to load image");
}

function drawNormalizedCanvas(img: HTMLImageElement, maxDim = 1024): HTMLCanvasElement {
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;
  const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const width = Math.max(32, Math.round(srcW * scale));
  const height = Math.max(32, Math.round(srcH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (ctx) {
    ctx.drawImage(img, 0, 0, width, height);
  }
  return canvas;
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  let h = 0;
  if (d !== 0) {
    if (max === rn) {
      h = ((gn - bn) / d) % 6;
    } else if (max === gn) {
      h = (bn - rn) / d + 2;
    } else {
      h = (rn - gn) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  return { h, s, v };
}

function predictCeremonyFromTitleAndVisuals(
  title: string | undefined,
  existingCeremony: WeddingPhoto["ceremony"] | undefined,
  yellowRatio: number,
  greenRatio: number,
  redWarmRatio: number,
  partyNeonRatio: number,
  meanLum: number,
  meanSat: number
): WeddingPhoto["ceremony"] {
  const lower = (title || "").toLowerCase();
  if (lower.includes("haldi") || lower.includes("turmeric")) return "Haldi";
  if (lower.includes("mehendi") || lower.includes("mehndi") || lower.includes("henna")) return "Mehendi";
  if (lower.includes("phere") || lower.includes("mandap") || lower.includes("jaimala") || lower.includes("vows")) return "Phere";
  if (lower.includes("reception") || lower.includes("cocktail") || lower.includes("gala")) return "Reception";
  if (lower.includes("sangeet") || lower.includes("dance") || lower.includes("dj")) return "Sangeet";

  // Visual wedding color & lighting classification
  if (yellowRatio >= 0.14 && meanLum >= 100) {
    return "Haldi";
  }
  if (greenRatio >= 0.14 && meanLum >= 90) {
    return "Mehendi";
  }
  if (redWarmRatio >= 0.16 && meanLum >= 85) {
    return "Phere";
  }
  if (meanLum < 108 && partyNeonRatio >= 0.10) {
    return "Sangeet";
  }
  if (meanLum < 125 && meanSat < 0.34) {
    return "Reception";
  }
  if (existingCeremony && existingCeremony !== "All") {
    return existingCeremony;
  }
  return meanLum >= 120 ? "Reception" : "Sangeet";
}

/**
 * Extracts real visual sharpness (Laplacian variance), lighting quality,
 * and predicted wedding ceremony from a Canvas element.
 */
function analyzeCanvasVisualMetrics(
  sourceCanvas: HTMLCanvasElement,
  facesCount: number,
  title?: string,
  existingCeremony?: WeddingPhoto["ceremony"]
): {
  sharpnessScore: number;
  qualityScore: number;
  predictedCeremony: WeddingPhoto["ceremony"];
} {
  const sampleSize = 96;
  const thumb = document.createElement("canvas");
  thumb.width = sampleSize;
  thumb.height = sampleSize;
  const ctx = thumb.getContext("2d", { willReadFrequently: true });
  if (!ctx) {
    return {
      sharpnessScore: 80,
      qualityScore: Math.min(99, 72 + facesCount * 6),
      predictedCeremony: existingCeremony && existingCeremony !== "All" ? existingCeremony : "Sangeet",
    };
  }

  ctx.drawImage(sourceCanvas, 0, 0, sampleSize, sampleSize);
  const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

  const gray = new Float32Array(sampleSize * sampleSize);
  let sumLum = 0;
  let sumSat = 0;
  let yellowCount = 0;
  let greenCount = 0;
  let redWarmCount = 0;
  let partyNeonCount = 0;
  const totalPixels = sampleSize * sampleSize;

  for (let i = 0; i < totalPixels; i++) {
    const p = i * 4;
    const r = imgData[p];
    const g = imgData[p + 1];
    const b = imgData[p + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = lum;
    sumLum += lum;

    const { h, s, v } = rgbToHsv(r, g, b);
    sumSat += s;

    if (s > 0.36 && v > 0.38) {
      if (h >= 34 && h <= 64) yellowCount++;
      else if (h >= 75 && h <= 160) greenCount++;
      else if (h >= 336 || h <= 22) redWarmCount++;
      else if (h >= 210 && h <= 335 && s > 0.42) partyNeonCount++;
    }
  }

  // Laplacian variance for focus/sharpness
  let lapSum = 0;
  let lapSqSum = 0;
  let edgeSamples = 0;
  for (let y = 1; y < sampleSize - 1; y++) {
    for (let x = 1; x < sampleSize - 1; x++) {
      const idx = y * sampleSize + x;
      const lap =
        gray[idx - sampleSize] +
        gray[idx + sampleSize] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx];
      lapSum += lap;
      lapSqSum += lap * lap;
      edgeSamples++;
    }
  }

  const lapMean = edgeSamples > 0 ? lapSum / edgeSamples : 0;
  const lapVar = edgeSamples > 0 ? lapSqSum / edgeSamples - lapMean * lapMean : 0;
  const normalizedSharpness = Math.round(Math.min(99, Math.max(45, 45 + Math.sqrt(Math.max(0, lapVar)) * 1.4)));

  const meanLum = sumLum / totalPixels;
  const meanSat = sumSat / totalPixels;
  const exposurePenalty = meanLum < 45 ? 18 : meanLum > 225 ? 12 : 0;
  const faceBonus = facesCount >= 2 ? 18 : facesCount === 1 ? 12 : 0;
  const qualityScore = Math.round(
    Math.min(99, Math.max(40, normalizedSharpness * 0.72 + 12 + faceBonus - exposurePenalty))
  );

  const predictedCeremony = predictCeremonyFromTitleAndVisuals(
    title,
    existingCeremony,
    yellowCount / totalPixels,
    greenCount / totalPixels,
    redWarmCount / totalPixels,
    partyNeonCount / totalPixels,
    meanLum,
    meanSat
  );

  return {
    sharpnessScore: normalizedSharpness,
    qualityScore,
    predictedCeremony,
  };
}

interface DetectedFaceWithScore {
  descriptor: Float32Array;
  box: { x: number; y: number; width: number; height: number };
  score: number;
}

async function detectAllNeuralFacesOnCanvas(
  faceapi: FaceApiModule,
  canvas: HTMLCanvasElement
): Promise<DetectedFaceWithScore[]> {
  // Primary high-accuracy SSD MobileNet v1 pass
  let detections = await faceapi
    .detectAllFaces(
      canvas,
      new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25, maxResults: 30 })
    )
    .withFaceLandmarks()
    .withFaceDescriptors();

  // Fallback pass 1: TinyFaceDetector catches extreme contrast / webcam / stylized lighting
  if (detections.length === 0) {
    detections = await faceapi
      .detectAllFaces(
        canvas,
        new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.22 })
      )
      .withFaceLandmarks()
      .withFaceDescriptors();
  }

  // Fallback pass 2: Upper-center 2x zoom crop rescues full-body distant wedding stage portraits
  if (detections.length === 0 && canvas.width >= 300 && canvas.height >= 300) {
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = Math.round(canvas.width * 0.72 * 1.5);
    cropCanvas.height = Math.round(canvas.height * 0.58 * 1.5);
    const ctx = cropCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(
        canvas,
        canvas.width * 0.14,
        canvas.height * 0.04,
        canvas.width * 0.72,
        canvas.height * 0.58,
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      );
      const cropDetections = await faceapi
        .detectAllFaces(
          cropCanvas,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.22, maxResults: 20 })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();
      if (cropDetections.length > 0) {
        detections = cropDetections;
      }
    }
  }

  return detections.map((d) => ({
    descriptor: d.descriptor,
    box: {
      x: d.detection.box.x,
      y: d.detection.box.y,
      width: d.detection.box.width,
      height: d.detection.box.height,
    },
    score: d.detection.score,
  }));
}

function selectPrimarySelfieFace(
  faces: DetectedFaceWithScore[],
  canvasW: number,
  canvasH: number
): DetectedFaceWithScore | null {
  if (faces.length === 0) return null;
  if (faces.length === 1) return faces[0];

  const cxImg = canvasW / 2;
  const cyImg = canvasH / 2;

  return faces.reduce((best, curr) => {
    const currArea = curr.box.width * curr.box.height;
    const bestArea = best.box.width * best.box.height;
    const currCenterDist = Math.hypot(
      curr.box.x + curr.box.width / 2 - cxImg,
      curr.box.y + curr.box.height / 2 - cyImg
    );
    const bestCenterDist = Math.hypot(
      best.box.x + best.box.width / 2 - cxImg,
      best.box.y + best.box.height / 2 - cyImg
    );
    const currRank = currArea - currCenterDist * 20;
    const bestRank = bestArea - bestCenterDist * 20;
    return currRank > bestRank ? curr : best;
  }, faces[0]);
}

/**
 * Converts ResNet-34 Euclidean distance into calibrated biometric similarity [0.0, 0.99].
 * Calibrated so standard verification boundary dist = 0.60 maps cleanly to τ = 0.70:
 * - dist = 0.00 -> 0.99
 * - dist = 0.30 -> 0.85
 * - dist = 0.45 -> 0.77
 * - dist = 0.60 -> 0.70 (Balanced threshold τ = 0.70)
 * - dist = 0.64 -> 0.62 (Broad recall threshold)
 * - dist > 0.76 -> 0.00
 */
export function distanceToSimilarityScore(euclideanDist: number): number {
  if (!Number.isFinite(euclideanDist) || euclideanDist < 0) return 0.0;
  if (euclideanDist > 0.76) return 0.0;

  if (euclideanDist <= 0.60) {
    const score = 0.70 + ((0.60 - euclideanDist) / 0.60) * 0.29;
    return Number(Math.min(0.99, score).toFixed(3));
  }

  const tailScore = 0.70 - ((euclideanDist - 0.60) / 0.16) * 0.35;
  return Number(Math.max(0.0, tailScore).toFixed(3));
}

function classifyShotType(facesCount: number): PhotoAiAnalysis["shotType"] {
  if (facesCount === 0) return "scenic";
  if (facesCount === 1) return "solo";
  if (facesCount === 2) return "couple";
  return "group";
}

/**
 * Runs neural face detection + visual quality/ceremony analysis on a gallery photo (cached).
 */
export async function analyzeWeddingPhotoWithAI(
  photo: WeddingPhoto
): Promise<PhotoAiAnalysis> {
  const cacheKey = buildPhotoCacheKey(photo);
  const cached = photoAnalysisCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const faceapi = await ensureFaceModelsLoaded();
  const img = await loadImageFromCandidates([
    photo.fallbackUrl || "",
    photo.url,
  ]);
  const canvas = drawNormalizedCanvas(img, 1024);
  const faces = await detectAllNeuralFacesOnCanvas(faceapi, canvas);
  const visuals = analyzeCanvasVisualMetrics(
    canvas,
    faces.length,
    photo.title,
    photo.ceremony
  );

  const analysis: PhotoAiAnalysis = {
    id: photo.id,
    facesCount: faces.length,
    shotType: classifyShotType(faces.length),
    qualityScore: visuals.qualityScore,
    sharpnessScore: visuals.sharpnessScore,
    predictedCeremony: visuals.predictedCeremony,
    descriptors: faces.map((f) => f.descriptor),
  };

  photoAnalysisCache.set(cacheKey, analysis);
  return analysis;
}

/**
 * Analyzes a local browser image File before upload (face count, sharpness, predicted ceremony).
 */
export async function analyzeLocalImageFile(
  file: File,
  fallbackCeremony: WeddingPhoto["ceremony"] = "Sangeet"
): Promise<{
  facesDetected: number;
  sharpness: number;
  qualityScore: number;
  shotType: PhotoAiAnalysis["shotType"];
  predictedCeremony: WeddingPhoto["ceremony"];
}> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadSingleImage(objectUrl, 10000);
    const canvas = drawNormalizedCanvas(img, 960);

    let facesDetected = 0;
    try {
      const faceapi = await ensureFaceModelsLoaded();
      const faces = await detectAllNeuralFacesOnCanvas(faceapi, canvas);
      facesDetected = faces.length;
    } catch {
      facesDetected = 0;
    }

    const visuals = analyzeCanvasVisualMetrics(
      canvas,
      facesDetected,
      file.name,
      fallbackCeremony
    );

    return {
      facesDetected,
      sharpness: visuals.sharpnessScore,
      qualityScore: visuals.qualityScore,
      shotType: classifyShotType(facesDetected),
      predictedCeremony: visuals.predictedCeremony,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Compares a selfie image against a single target wedding photo using ResNet-34 face descriptors.
 * Returns 0.0 when no verified face matches above threshold.
 */
export async function computeBiometricLikeness(
  selfieSrc: string,
  targetPhoto: WeddingPhoto
): Promise<number> {
  try {
    const faceapi = await ensureFaceModelsLoaded();
    const selfieImg = await loadImageFromCandidates([selfieSrc]);
    const selfieCanvas = drawNormalizedCanvas(selfieImg, 960);
    const selfieFaces = await detectAllNeuralFacesOnCanvas(faceapi, selfieCanvas);
    const primarySelfie = selectPrimarySelfieFace(
      selfieFaces,
      selfieCanvas.width,
      selfieCanvas.height
    );
    if (!primarySelfie) return 0.0;

    const analysis = await analyzeWeddingPhotoWithAI(targetPhoto);
    if (analysis.descriptors.length === 0) return 0.0;

    let bestScore = 0.0;
    for (const targetDesc of analysis.descriptors) {
      const dist = faceapi.euclideanDistance(primarySelfie.descriptor, targetDesc);
      const score = distanceToSimilarityScore(dist);
      if (score > bestScore) {
        bestScore = score;
      }
    }

    return bestScore >= 0.62 ? bestScore : 0.0;
  } catch {
    return 0.0;
  }
}

/**
 * Sorts an array of WeddingPhoto records deterministically using AI metrics & metadata.
 */
export function sortWeddingPhotos(
  photos: WeddingPhoto[],
  sortMode: PhotoSortMode
): WeddingPhoto[] {
  const list = [...photos];
  const getTime = (p: WeddingPhoto) =>
    p.uploadedAt ? new Date(p.uploadedAt).getTime() || 0 : 0;

  switch (sortMode) {
    case "similarity":
      return list.sort((a, b) => {
        const simDiff = (b.similarity || 0) - (a.similarity || 0);
        if (Math.abs(simDiff) > 0.001) return simDiff;
        return (b.qualityScore || 0) - (a.qualityScore || 0);
      });

    case "ai-smart":
      return list.sort((a, b) => {
        const scoreA =
          (a.qualityScore ?? 72) * 0.7 +
          Math.min(20, (a.facesCount || 0) * 6);
        const scoreB =
          (b.qualityScore ?? 72) * 0.7 +
          Math.min(20, (b.facesCount || 0) * 6);
        if (Math.abs(scoreB - scoreA) > 0.5) return scoreB - scoreA;
        return getTime(b) - getTime(a);
      });

    case "newest":
      return list.sort((a, b) => getTime(b) - getTime(a));

    case "oldest":
      return list.sort((a, b) => getTime(a) - getTime(b));

    case "ceremony":
      return list.sort((a, b) => {
        const orderA = CEREMONY_ORDER[a.ceremony] ?? 99;
        const orderB = CEREMONY_ORDER[b.ceremony] ?? 99;
        if (orderA !== orderB) return orderA - orderB;
        return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
      });

    case "faces-desc":
      return list.sort((a, b) => {
        const faceDiff = (b.facesCount || 0) - (a.facesCount || 0);
        if (faceDiff !== 0) return faceDiff;
        return (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
      });

    default:
      return list;
  }
}

/**
 * Matches a guest selfie against wedding photos with full diagnostic telemetry,
 * batched neural inference, AI face counting, and descending similarity sorting.
 */
export async function matchSelfieAgainstPhotosWithDiagnostics(
  selfieSrc: string,
  photos: WeddingPhoto[],
  threshold = 0.70,
  onProgress?: (scanned: number, total: number, statusText: string) => void
): Promise<SelfieSearchDiagnostics> {
  if (!selfieSrc || photos.length === 0) {
    return {
      matches: [],
      selfieFacesDetected: 0,
      scannedCount: 0,
      totalGalleryFaces: 0,
      analyzedPhotos: photos,
    };
  }

  onProgress?.(0, photos.length, "Loading ResNet-34 & SSD MobileNet neural models...");
  const faceapi = await ensureFaceModelsLoaded();

  onProgress?.(0, photos.length, "Detecting facial landmarks in your selfie...");
  const selfieImg = await loadImageFromCandidates([selfieSrc]);
  const selfieCanvas = drawNormalizedCanvas(selfieImg, 960);
  const selfieFaces = await detectAllNeuralFacesOnCanvas(faceapi, selfieCanvas);
  const primarySelfie = selectPrimarySelfieFace(
    selfieFaces,
    selfieCanvas.width,
    selfieCanvas.height
  );

  if (!primarySelfie) {
    return {
      matches: [],
      selfieFacesDetected: 0,
      scannedCount: 0,
      totalGalleryFaces: 0,
      analyzedPhotos: photos,
      errorReason:
        "No clear face could be detected in your selfie. Please center your face in bright lighting and retake or upload another photo.",
    };
  }

  const analyzedPhotos: WeddingPhoto[] = [...photos];
  const matched: WeddingPhoto[] = [];
  const metaUpdates: Array<{
    id: string;
    driveFileId?: string;
    facesCount?: number;
    shotType?: "solo" | "couple" | "group" | "scenic";
    qualityScore?: number;
  }> = [];

  let totalGalleryFaces = 0;
  let completed = 0;
  const concurrency = 3;

  for (let i = 0; i < photos.length; i += concurrency) {
    const batch = photos.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (photo, offset) => {
        const idx = i + offset;
        try {
          const analysis = await analyzeWeddingPhotoWithAI(photo);
          totalGalleryFaces += analysis.facesCount;

          const enrichedPhoto: WeddingPhoto = {
            ...photo,
            facesCount: analysis.facesCount,
            shotType: analysis.shotType,
            qualityScore: analysis.qualityScore,
          };
          analyzedPhotos[idx] = enrichedPhoto;
          metaUpdates.push({
            id: photo.id,
            driveFileId: photo.driveFileId,
            facesCount: analysis.facesCount,
            shotType: analysis.shotType,
            qualityScore: analysis.qualityScore,
          });

          let bestScore = 0.0;
          for (const targetDesc of analysis.descriptors) {
            const dist = faceapi.euclideanDistance(primarySelfie.descriptor, targetDesc);
            const score = distanceToSimilarityScore(dist);
            if (score > bestScore) {
              bestScore = score;
            }
          }

          if (bestScore >= threshold) {
            matched.push({
              ...enrichedPhoto,
              similarity: bestScore,
              confidenceTier: bestScore >= 0.78 ? "high" : "medium",
            });
          }
        } catch (err) {
          console.warn(`AI scan skipped ${photo.title}:`, err);
        } finally {
          completed++;
          onProgress?.(
            completed,
            photos.length,
            `AI scanned ${completed}/${photos.length} photos (${matched.length} match${matched.length === 1 ? "" : "es"} found)...`
          );
        }
      })
    );
  }

  if (metaUpdates.length > 0) {
    saveAiPhotoMetaBatch(metaUpdates);
  }

  return {
    matches: sortWeddingPhotos(matched, "similarity"),
    selfieFacesDetected: selfieFaces.length,
    scannedCount: completed,
    totalGalleryFaces,
    analyzedPhotos,
  };
}

/**
 * Matches a guest selfie against an array of wedding photos.
 * Only returns verified matching photos, strictly sorted from highest similarity to lowest.
 */
export async function matchSelfieAgainstPhotos(
  selfieSrc: string,
  photos: WeddingPhoto[],
  threshold = 0.70,
  onProgress?: (scanned: number, total: number, statusText: string) => void
): Promise<WeddingPhoto[]> {
  const diagnostics = await matchSelfieAgainstPhotosWithDiagnostics(
    selfieSrc,
    photos,
    threshold,
    onProgress
  );
  return diagnostics.matches;
}

/**
 * Runs AI Smart Auto-Sort across all gallery photos:
 * - Detects real faces per photo (Solo / Couple / Group)
 * - Classifies untagged photos into Wedding Ceremonies (Haldi, Mehendi, Sangeet, Phere, Reception)
 * - Scores sharpness & visual quality
 * - Persists AI metadata and returns sorted photos
 */
export async function aiAnalyzeAndSortPhotos(
  photos: WeddingPhoto[],
  options?: {
    sortMode?: PhotoSortMode;
    autoTagCeremonies?: boolean;
    onProgress?: (done: number, total: number, statusText: string) => void;
  }
): Promise<WeddingPhoto[]> {
  const sortMode = options?.sortMode ?? "ai-smart";
  const autoTagCeremonies = options?.autoTagCeremonies ?? true;

  if (photos.length === 0) return [];

  options?.onProgress?.(0, photos.length, "Initializing AI visual & face analyzer...");
  await ensureFaceModelsLoaded();

  const updated: WeddingPhoto[] = [...photos];
  const metaUpdates: Array<{
    id: string;
    driveFileId?: string;
    facesCount?: number;
    shotType?: "solo" | "couple" | "group" | "scenic";
    qualityScore?: number;
    ceremony?: WeddingPhoto["ceremony"];
    aiSorted?: boolean;
  }> = [];

  let done = 0;
  const concurrency = 3;

  for (let i = 0; i < photos.length; i += concurrency) {
    const batch = photos.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (photo, offset) => {
        const idx = i + offset;
        try {
          const analysis = await analyzeWeddingPhotoWithAI(photo);
          const nextCeremony = autoTagCeremonies
            ? analysis.predictedCeremony
            : photo.ceremony;

          const enriched: WeddingPhoto = {
            ...photo,
            facesCount: analysis.facesCount,
            shotType: analysis.shotType,
            qualityScore: analysis.qualityScore,
            ceremony: nextCeremony,
            aiSorted: true,
          };
          updated[idx] = enriched;

          metaUpdates.push({
            id: photo.id,
            driveFileId: photo.driveFileId,
            facesCount: analysis.facesCount,
            shotType: analysis.shotType,
            qualityScore: analysis.qualityScore,
            ceremony: nextCeremony,
            aiSorted: true,
          });
        } catch (err) {
          console.warn(`AI sort skipped ${photo.title}:`, err);
        } finally {
          done++;
          options?.onProgress?.(
            done,
            photos.length,
            `AI categorizing & sorting ${done}/${photos.length} photos...`
          );
        }
      })
    );
  }

  if (metaUpdates.length > 0) {
    saveAiPhotoMetaBatch(metaUpdates);
  }

  return sortWeddingPhotos(updated, sortMode);
}
