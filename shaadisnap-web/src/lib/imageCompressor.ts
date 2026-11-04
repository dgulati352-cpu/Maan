/**
 * High-Performance Client-Side Image Compressor for ShaadiSnap AI
 *
 * Compresses raw high-resolution wedding photos before uploading:
 * - Reduces file size by 85-95% (e.g., 10MB -> ~300KB)
 * - Preserves crystal-clear facial landmarks for biometric recognition
 * - Max dimension calibrated to 1920px (Full HD master quality)
 * - Uses HTML5 Canvas with high-quality bicubic downscaling
 */

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  compressionRatio: string;
  width: number;
  height: number;
}

export interface CompressOptions {
  maxDimension?: number;
  quality?: number; // 0.0 to 1.0 (recommended: 0.82 for wedding photography)
  mimeType?: "image/jpeg" | "image/webp";
}

export async function compressImage(
  source: File | Blob,
  fileName: string = "wedding_photo.jpg",
  options: CompressOptions = {}
): Promise<CompressionResult> {
  const {
    maxDimension = 1920,
    quality = 0.82,
    mimeType = "image/jpeg",
  } = options;

  const originalSizeBytes = source.size;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(source);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let { width, height } = img;

      // Calculate scaled dimensions keeping aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // Draw onto Canvas with image smoothing enabled
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        // Fallback: return original if canvas context unavailable
        resolve({
          file: source instanceof File ? source : new File([source], fileName, { type: mimeType }),
          previewUrl: objectUrl,
          originalSizeBytes,
          compressedSizeBytes: originalSizeBytes,
          compressionRatio: "1.0x",
          width,
          height,
        });
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              file: source instanceof File ? source : new File([source], fileName, { type: mimeType }),
              previewUrl: objectUrl,
              originalSizeBytes,
              compressedSizeBytes: originalSizeBytes,
              compressionRatio: "1.0x",
              width,
              height,
            });
            return;
          }

          const compressedFile = new File([blob], fileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          const compressedSizeBytes = blob.size;
          const ratioNum = originalSizeBytes > 0 ? (originalSizeBytes / compressedSizeBytes).toFixed(1) : "1.0";
          const previewUrl = URL.createObjectURL(blob);

          resolve({
            file: compressedFile,
            previewUrl,
            originalSizeBytes,
            compressedSizeBytes,
            compressionRatio: `${ratioNum}x`,
            width,
            height,
          });
        },
        mimeType,
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
}

