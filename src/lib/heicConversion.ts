/**
 * HEIC/HEIF to JPEG client-side conversion utility.
 * Uses heic2any which relies on browser APIs — all callers are 'use client' components.
 */

const HEIC_EXTENSIONS = ['.heic', '.heif'];
const HEIC_MIME_TYPES = ['image/heic', 'image/heif'];

/**
 * Detect whether a File is HEIC/HEIF by extension or MIME type.
 * Extension check is critical because some browsers report HEIC files
 * with empty MIME type or "application/octet-stream".
 */
export function isHeicFile(file: File): boolean {
  if (HEIC_MIME_TYPES.includes(file.type.toLowerCase())) {
    return true;
  }
  const name = file.name.toLowerCase();
  return HEIC_EXTENSIONS.some(ext => name.endsWith(ext));
}

function renameToJpeg(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex === -1) return fileName + '.jpg';
  return fileName.substring(0, dotIndex) + '.jpg';
}

/**
 * If the file is HEIC/HEIF, convert it to JPEG client-side.
 * Otherwise return the original file unchanged.
 * @throws Error if conversion fails — caller should catch and show user message
 */
export async function convertHeicIfNeeded(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  console.log(`🔄 Converting HEIC: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

  const heic2any = (await import('heic2any')).default;

  const blob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.88,
  });

  const resultBlob = Array.isArray(blob) ? blob[0] : blob;

  const jpegFile = new File(
    [resultBlob],
    renameToJpeg(file.name),
    { type: 'image/jpeg', lastModified: Date.now() }
  );

  console.log(`✅ HEIC converted: ${file.name} → ${jpegFile.name} (${(jpegFile.size / 1024 / 1024).toFixed(2)}MB)`);

  return jpegFile;
}

/**
 * Convert an array of files, converting any HEIC files to JPEG.
 * Failed conversions are collected as errors rather than throwing.
 */
export async function convertHeicFiles(files: File[]): Promise<{
  converted: File[];
  errors: { fileName: string; error: string }[];
}> {
  const converted: File[] = [];
  const errors: { fileName: string; error: string }[] = [];

  for (const file of files) {
    try {
      converted.push(await convertHeicIfNeeded(file));
    } catch (err) {
      errors.push({
        fileName: file.name,
        error: `Could not convert ${file.name}. Please convert it to JPEG or PNG and try again.`,
      });
    }
  }

  return { converted, errors };
}
