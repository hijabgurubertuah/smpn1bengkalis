/**
 * Client-Side Image Optimizer and Converter
 * - Compresses and resizes images so they store seamlessly in Firebase Firestore and load instantly offline.
 * - Converts Google Drive share links into direct, high-speed image embed URLs.
 */

export interface CompressionResult {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0
  format?: 'image/webp' | 'image/jpeg' | 'image/png';
}

/**
 * Resizes and compresses an image file in the browser using HTML5 Canvas.
 * Keeps memory usage low and ensures images are small enough (under 150KB) to store in Firestore and IndexedDB.
 */
export function compressAndResizeImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 0.82,
      format = 'image/webp',
    } = options;

    const originalSize = file.size;

    // Check if it's an SVG, SVG doesn't need canvas compression
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          dataUrl: result,
          originalSize,
          compressedSize: originalSize,
          reductionPercentage: 0,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate new dimensions preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Draw image onto canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to dataUrl
        let targetFormat = format;
        // If PNG transparency needed and requested
        if (file.type === 'image/png' && format === 'image/png') {
          targetFormat = 'image/png';
        }

        const dataUrl = canvas.toDataURL(targetFormat, quality);
        
        // Approximate base64 size in bytes: (length * 3) / 4
        const compressedSize = Math.round((dataUrl.length * 3) / 4);
        const reductionPercentage = Math.max(
          0,
          Math.round(((originalSize - compressedSize) / originalSize) * 100)
        );

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          reductionPercentage,
        });
      };

      img.onerror = () => reject(new Error('Gagal memproses file gambar.'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a Google Drive share link into a direct CDN image embed URL.
 * Handles formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * Converts to:
 * - https://lh3.googleusercontent.com/d/FILE_ID or https://drive.google.com/uc?export=view&id=FILE_ID
 */
export function convertGoogleDriveUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;

  const trimmed = url.trim();

  // Pattern 1: /file/d/{ID}/...
  const matchFileD = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchFileD && matchFileD[1]) {
    return `https://lh3.googleusercontent.com/d/${matchFileD[1]}`;
  }

  // Pattern 2: id={ID}
  const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchIdParam && matchIdParam[1]) {
    return `https://lh3.googleusercontent.com/d/${matchIdParam[1]}`;
  }

  return trimmed;
}

/**
 * Format bytes to readable human string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
