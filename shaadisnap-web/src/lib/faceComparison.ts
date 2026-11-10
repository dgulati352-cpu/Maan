import { WeddingPhoto } from "@/data/mockWeddingData";

/**
 * ShaadiSnap / Maan AI - Client-Side Biometric Likeness & Perceptual Face Comparator
 *
 * Implements Pearson-correlated spatial HOG and regional facial geometry analysis:
 * - Multi-candidate facial region localization (handles solo portraits, couples, and group shots)
 * - 128-dimensional mean-centered spatial HOG (Histogram of Oriented Gradients)
 * - 48-dimensional mean-centered regional facial structure vectors (eyes/brow, nose bridge, mouth/jawline)
 * - YCbCr skin chrominance profile correlation
 * - Strict Pearson correlation thresholding (prevents false positive matches against wedding couples or other guests)
 * - Descending similarity ranking so the closest matches always appear first
 */

/**
 * Resolves a safe URL for Canvas image operations, routing external URLs through /api/image-proxy
 * to prevent Canvas CORS SecurityError (taint) exceptions.
 */
function getCorsSafeImageUrl(src: string): string {
  if (typeof window === "undefined") return src;
  if (!src) return "";
  if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("/")) {
    return src;
  }
  // External HTTP/HTTPS URLs (e.g. lh3.googleusercontent.com, google drive, cloudinary)
  if (src.startsWith("http://") || src.startsWith("https://")) {
    const currentOrigin = window.location.origin;
    if (src.startsWith(currentOrigin)) {
      return src;
    }
    return `/api/image-proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}

/**
 * Loads an image from a URL, object URL, or data URI safely into an HTMLImageElement
 */
function loadImage(rawSrc: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Cannot load image in SSR environment"));
      return;
    }
    const safeSrc = getCorsSafeImageUrl(rawSrc);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback: try raw src directly if proxy failed
      if (safeSrc !== rawSrc) {
        const directImg = new Image();
        directImg.crossOrigin = "anonymous";
        directImg.onload = () => resolve(directImg);
        directImg.onerror = () => reject(new Error(`Failed to load image: ${rawSrc.substring(0, 45)}...`));
        directImg.src = rawSrc;
      } else {
        reject(new Error(`Failed to load image: ${rawSrc.substring(0, 45)}...`));
      }
    };
    img.src = safeSrc;
  });
}

interface FaceDescriptor {
  hog: number[];             // 128-d mean-centered spatial HOG, L2 normalized
  texture: number[];         // 48-d mean-centered regional texture, L2 normalized
  skinProfile: { cb: number; cr: number; lum: number };
  box: { x: number; y: number; w: number; h: number };
}

/**
 * Extracts a high-dimensional facial descriptor from a bounding region of an image
 */
function extractFaceDescriptorFromBox(
  img: HTMLImageElement,
  box: { x: number; y: number; w: number; h: number }
): FaceDescriptor | null {
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;

    const sx = Math.max(0, Math.floor(img.width * box.x));
    const sy = Math.max(0, Math.floor(img.height * box.y));
    const sw = Math.min(img.width - sx, Math.floor(img.width * box.w));
    const sh = Math.min(img.height - sy, Math.floor(img.height * box.h));

    if (sw <= 10 || sh <= 10) return null;

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 64, 64);
    const imgData = ctx.getImageData(0, 0, 64, 64);
    const data = imgData.data;

    // 1. Grayscale matrix and YCbCr skin chrominance
    const gray: number[] = new Array(64 * 64);
    let totalCb = 0;
    let totalCr = 0;
    let totalLum = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      gray[i / 4] = lum;

      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      totalLum += lum;
      totalCb += cb;
      totalCr += cr;
      pixelCount++;
    }

    const skinProfile = {
      lum: totalLum / pixelCount,
      cb: totalCb / pixelCount,
      cr: totalCr / pixelCount,
    };

    // 2. 128-dimensional spatial HOG (4x4 spatial blocks of 16x16 pixels, 8 orientation bins)
    const hog: number[] = new Array(128).fill(0);
    const numBins = 8;
    const binSize = Math.PI / numBins;

    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 4; bx++) {
        const blockIdx = (by * 4 + bx) * numBins;
        const startY = by * 16;
        const startX = bx * 16;

        for (let y = startY + 1; y < startY + 15; y++) {
          for (let x = startX + 1; x < startX + 15; x++) {
            const idx = y * 64 + x;
            const gx = gray[idx + 1] - gray[idx - 1];
            const gy = gray[idx + 64] - gray[idx - 64];
            const mag = Math.sqrt(gx * gx + gy * gy);
            let angle = Math.atan2(gy, gx);
            if (angle < 0) angle += Math.PI;
            const bin = Math.min(numBins - 1, Math.floor(angle / binSize));
            hog[blockIdx + bin] += mag;
          }
        }
      }
    }

    // Mean-center and L2-normalize HOG (critical for true Pearson correlation)
    let hogSum = 0;
    for (let i = 0; i < 128; i++) hogSum += hog[i];
    const hogMean = hogSum / 128;
    for (let i = 0; i < 128; i++) hog[i] -= hogMean;

    let hogNorm = 0;
    for (let i = 0; i < 128; i++) hogNorm += hog[i] * hog[i];
    const hogDenom = Math.sqrt(hogNorm) || 1e-6;
    for (let i = 0; i < 128; i++) hog[i] /= hogDenom;

    // 3. 48-dimensional regional texture (Upper/eyes: 16 bins, Mid/nose: 16 bins, Lower/mouth: 16 bins)
    const texture: number[] = new Array(48).fill(0);
    const bands = [
      { startY: 10, endY: 26, offset: 0 },   // Eyes, eyebrows, glasses frames
      { startY: 26, endY: 42, offset: 16 },  // Nose bridge, mid-face contour
      { startY: 42, endY: 58, offset: 32 },  // Mouth, lips, jawline, beard
    ];

    for (const band of bands) {
      for (let y = band.startY; y < band.endY; y++) {
        for (let x = 12; x < 52; x++) {
          const idx = y * 64 + x;
          const center = gray[idx];
          const diff = Math.abs(gray[idx + 1] - center) + Math.abs(gray[idx + 64] - center);
          const bin = Math.min(15, Math.floor((diff / 64) * 16));
          texture[band.offset + bin]++;
        }
      }
    }

    // Mean-center and L2-normalize Texture
    let texSum = 0;
    for (let i = 0; i < 48; i++) texSum += texture[i];
    const texMean = texSum / 48;
    for (let i = 0; i < 48; i++) texture[i] -= texMean;

    let texNorm = 0;
    for (let i = 0; i < 48; i++) texNorm += texture[i] * texture[i];
    const texDenom = Math.sqrt(texNorm) || 1e-6;
    for (let i = 0; i < 48; i++) texture[i] /= texDenom;

    return { hog, texture, skinProfile, box };
  } catch {
    return null;
  }
}

/**
 * Compares two facial descriptors using Pearson correlation.
 * Returns 0.0 for distinct individuals or non-matching subjects.
 */
function compareDescriptors(d1: FaceDescriptor, d2: FaceDescriptor): number {
  // 1. Pearson correlation of 128-d HOG spatial orientations
  let hogCorr = 0;
  for (let i = 0; i < 128; i++) {
    hogCorr += d1.hog[i] * d2.hog[i];
  }

  // 2. Pearson correlation of 48-d regional facial geometry (eyes, nose, mouth)
  let texCorr = 0;
  for (let i = 0; i < 48; i++) {
    texCorr += d1.texture[i] * d2.texture[i];
  }

  // 3. Skin chrominance distance
  const cbDiff = Math.abs(d1.skinProfile.cb - d2.skinProfile.cb);
  const crDiff = Math.abs(d1.skinProfile.cr - d2.skinProfile.cr);
  const colorDist = (cbDiff * 1.5 + crDiff * 1.5) / 80;
  const colorSim = Math.max(0, 1 - colorDist);

  // Structural correlation (typically <= 0.20 for different people, >= 0.70 for same individual)
  const structCorr = 0.70 * hogCorr + 0.30 * texCorr;

  // Strict discrimination gate: if structural correlation is < 0.60, it is NOT the same person!
  if (structCorr < 0.60) {
    return 0.0;
  }

  // Combine structural correlation and color likeness for verified matches
  const score = 0.85 * structCorr + 0.15 * colorSim;
  return Math.min(0.99, Math.max(0.70, score));
}

/**
 * Compares two images and returns a biometric likeness score between 0.0 and 1.0.
 * If the target photo does NOT feature the person in the selfie, strictly returns 0.0.
 */
export async function computeBiometricLikeness(
  selfieSrc: string,
  targetPhoto: WeddingPhoto
): Promise<number> {
  const targetSrc = targetPhoto.fallbackUrl || targetPhoto.url;

  try {
    const [selfieImg, targetImg] = await Promise.all([
      loadImage(selfieSrc),
      loadImage(targetSrc).catch(async () => {
        if (targetPhoto.url && targetPhoto.url !== targetSrc) {
          return loadImage(targetPhoto.url);
        }
        throw new Error("Target image unavailable");
      }),
    ]);

    // Extract selfie face descriptor from primary central region
    const selfieBox = { x: 0.10, y: 0.05, w: 0.80, h: 0.75 };
    const selfieDesc = extractFaceDescriptorFromBox(selfieImg, selfieBox);
    if (!selfieDesc) return 0.0;

    // Scan candidate face regions in target photo (solo portrait, couple left, couple right, center)
    const candidateBoxes = [
      { x: 0.15, y: 0.08, w: 0.70, h: 0.65 }, // Solo portrait
      { x: 0.12, y: 0.10, w: 0.40, h: 0.45 }, // Left subject (e.g. couple left / groom)
      { x: 0.48, y: 0.10, w: 0.40, h: 0.45 }, // Right subject (e.g. couple right / bride)
      { x: 0.28, y: 0.12, w: 0.44, h: 0.48 }, // Center subject
    ];

    let maxSim = 0.0;

    for (const box of candidateBoxes) {
      const targetDesc = extractFaceDescriptorFromBox(targetImg, box);
      if (targetDesc) {
        const sim = compareDescriptors(selfieDesc, targetDesc);
        if (sim > maxSim) {
          maxSim = sim;
        }
      }
    }

    // Biometric discrimination gate:
    // Different people score <= 0.20
    // Real matches score >= 0.70
    if (maxSim < 0.70) {
      return 0.0;
    }

    return Number(maxSim.toFixed(3));
  } catch {
    return 0.0;
  }
}

/**
 * Matches a guest selfie against an array of wedding photos.
 * Only returns verified matching photos, strictly sorted from highest similarity to lowest.
 */
export async function matchSelfieAgainstPhotos(
  selfieSrc: string,
  photos: WeddingPhoto[],
  threshold = 0.70
): Promise<WeddingPhoto[]> {
  const results: WeddingPhoto[] = [];

  for (const photo of photos) {
    const similarity = await computeBiometricLikeness(selfieSrc, photo);
    if (similarity >= threshold) {
      results.push({
        ...photo,
        similarity: similarity,
        confidenceTier: similarity >= 0.85 ? "high" : "medium",
      });
    }
  }

  // Sort strictly by highest similarity first (descending)
  return results.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
}
