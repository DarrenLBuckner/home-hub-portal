/**
 * Image compression utility for mobile uploads
 * Compresses large images client-side before uploading to Supabase storage
 * This significantly improves upload reliability on slow connections
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

const defaultOptions: CompressionOptions = {
  maxSizeMB: 0.5,           // 500KB max
  maxWidthOrHeight: 1920,   // Max dimension
  useWebWorker: true,       // Don't block UI thread
};

/**
 * Compress a single image file
 * @param file - The image file to compress
 * @param options - Optional compression settings
 * @returns The compressed file (or original if compression fails/not needed)
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const mergedOptions = { ...defaultOptions, ...options };

  // Skip compression for small files (already under 500KB)
  if (file.size < 500 * 1024) {
    console.log(`Image already small (${(file.size / 1024).toFixed(0)}KB), skipping compression`);
    return file;
  }

  // Skip compression for non-image files
  if (!file.type.startsWith('image/')) {
    console.log('Not an image file, skipping compression');
    return file;
  }

  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: mergedOptions.maxSizeMB!,
      maxWidthOrHeight: mergedOptions.maxWidthOrHeight!,
      useWebWorker: mergedOptions.useWebWorker!,
      initialQuality: 0.8,
    });

    const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
    const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
    console.log(`Image compressed: ${originalSizeMB}MB → ${compressedSizeMB}MB`);

    return compressedFile;
  } catch (error) {
    console.error('Image compression failed, using original:', error);
    return file; // Fallback to original if compression fails
  }
}

/**
 * Compress multiple image files
 * @param files - Array of image files to compress
 * @param options - Optional compression settings
 * @returns Array of compressed files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  return Promise.all(files.map(file => compressImage(file, options)));
}

/**
 * Get the estimated upload time for a file based on connection speed
 * @param fileSize - Size of the file in bytes
 * @param connectionSpeedMbps - Estimated connection speed in Mbps (default 1.5 for mobile)
 * @returns Estimated upload time in seconds
 */
export function estimateUploadTime(
  fileSize: number,
  connectionSpeedMbps: number = 1.5
): number {
  const fileSizeMb = fileSize / (1024 * 1024);
  const speedMBps = connectionSpeedMbps / 8; // Convert Mbps to MBps
  return Math.ceil(fileSizeMb / speedMBps);
}
