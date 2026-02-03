// Direct Supabase Storage upload utility
// Bypasses API payload limits by uploading directly from browser to Supabase
import { createClient } from '@/supabase';

export interface UploadedImage {
  url: string;
  path: string;
  name: string;
}

export interface UploadResult {
  success: boolean;
  images: UploadedImage[];
  failedImages: { name: string; error: string }[];
  totalAttempted: number;
  totalSuccessful: number;
}

/**
 * Upload a single image with retry logic and timeout
 * @param supabase - Supabase client
 * @param file - File to upload
 * @param userId - User ID for organizing uploads
 * @param index - Image index
 * @param maxRetries - Maximum retry attempts (default 3)
 * @param timeoutMs - Timeout per upload attempt in milliseconds (default 30000 = 30s)
 * @returns Uploaded image info or throws error after all retries fail
 */
async function uploadSingleImageWithRetry(
  supabase: ReturnType<typeof createClient>,
  file: File,
  userId: string,
  index: number,
  maxRetries: number = 3,
  timeoutMs: number = 30000 // 30 second timeout per image
): Promise<UploadedImage> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${timestamp}-${randomStr}-${index}.${fileExt}`;

      if (attempt > 1) {
        console.log(`🔄 Retry ${attempt}/${maxRetries} for ${file.name}...`);
      } else {
        console.log(`⬆️ Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
      }

      // Upload to Supabase Storage with timeout protection
      const { data, error } = await Promise.race([
        supabase.storage
          .from('property-images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Upload timeout: exceeded ${timeoutMs}ms`)), timeoutMs)
        ) as Promise<any>
      ]);

      clearTimeout(timeoutId);

      if (error) {
        throw new Error(`Storage error: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(data.path);

      console.log(`✅ Uploaded ${file.name} → ${publicUrlData.publicUrl}`);

      return {
        url: publicUrlData.publicUrl,
        path: data.path,
        name: file.name,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error instanceof Error ? error : new Error(String(error));

      // Distinguish timeout errors from other errors
      const isTimeout = lastError.message.includes('timeout') || lastError.name === 'AbortError';
      const errorType = isTimeout ? '⏱️ TIMEOUT' : '❌';

      console.error(`${errorType} Attempt ${attempt}/${maxRetries} failed for ${file.name}:`, lastError.message);

      // Wait before retry (exponential backoff: 1s, 2s, 4s)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Provide specific error message for timeouts
  const isTimeout = lastError?.message.includes('timeout') || lastError?.name === 'AbortError';
  const errorMessage = isTimeout
    ? `Upload timeout: ${file.name} took longer than 30 seconds. This usually indicates a poor internet connection. Please check your connection and try again.`
    : `Failed to upload ${file.name} after ${maxRetries} attempts: ${lastError?.message}`;

  throw new Error(errorMessage);
}

/**
 * Upload images directly to Supabase Storage with retry logic and proper error handling
 * Uses Promise.allSettled to handle partial failures gracefully
 * @param images - Array of compressed File objects from the browser
 * @param userId - User ID for organizing uploads
 * @returns Array of uploaded image URLs
 * @throws Error if ANY image fails to upload (all-or-nothing for data consistency)
 */
export async function uploadImagesToSupabase(
  images: File[],
  userId: string
): Promise<UploadedImage[]> {
  const supabase = createClient();

  console.log(`📤 Uploading ${images.length} images directly to Supabase Storage...`);

  // Upload images in parallel with retry logic using Promise.allSettled
  // This allows us to capture ALL results (success and failure) before deciding what to do
  const uploadPromises = images.map((file, index) =>
    uploadSingleImageWithRetry(supabase, file, userId, index, 3)
  );

  const results = await Promise.allSettled(uploadPromises);

  // Separate successful and failed uploads
  const successfulUploads: UploadedImage[] = [];
  const failedUploads: { name: string; error: string; index: number }[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successfulUploads.push(result.value);
    } else {
      failedUploads.push({
        name: images[index].name,
        error: result.reason?.message || 'Unknown error',
        index
      });
    }
  });

  // Log summary
  console.log(`📊 Upload summary: ${successfulUploads.length}/${images.length} successful`);

  // If ANY upload failed, clean up successful uploads and throw error
  // This ensures all-or-nothing behavior for data consistency
  if (failedUploads.length > 0) {
    console.error(`❌ ${failedUploads.length} image(s) failed to upload:`);
    failedUploads.forEach(f => console.error(`   - ${f.name}: ${f.error}`));

    // Clean up successful uploads to avoid orphaned files
    if (successfulUploads.length > 0) {
      console.log(`🧹 Cleaning up ${successfulUploads.length} orphaned uploads...`);
      try {
        const pathsToDelete = successfulUploads.map(img => img.path);
        await supabase.storage
          .from('property-images')
          .remove(pathsToDelete);
        console.log(`✅ Cleaned up orphaned uploads`);
      } catch (cleanupError) {
        console.error(`⚠️ Failed to clean up orphaned uploads:`, cleanupError);
        // Continue with error - cleanup failure is non-critical
      }
    }

    // Throw error with details about which images failed
    const failedNames = failedUploads.map(f => f.name).join(', ');
    throw new Error(
      `Failed to upload ${failedUploads.length} image(s): ${failedNames}. ` +
      `Please check your internet connection and try again.`
    );
  }

  console.log(`✅ All ${successfulUploads.length} images uploaded successfully!`);
  return successfulUploads;
}

/**
 * Upload images with detailed result (non-throwing version)
 * Returns detailed status instead of throwing on partial failure
 * Useful for cases where you want to handle partial success
 */
export async function uploadImagesToSupabaseWithStatus(
  images: File[],
  userId: string
): Promise<UploadResult> {
  const supabase = createClient();

  console.log(`📤 Uploading ${images.length} images directly to Supabase Storage...`);

  const uploadPromises = images.map((file, index) =>
    uploadSingleImageWithRetry(supabase, file, userId, index, 3)
  );

  const results = await Promise.allSettled(uploadPromises);

  const successfulUploads: UploadedImage[] = [];
  const failedUploads: { name: string; error: string }[] = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      successfulUploads.push(result.value);
    } else {
      failedUploads.push({
        name: images[index].name,
        error: result.reason?.message || 'Unknown error'
      });
    }
  });

  return {
    success: failedUploads.length === 0,
    images: successfulUploads,
    failedImages: failedUploads,
    totalAttempted: images.length,
    totalSuccessful: successfulUploads.length
  };
}

/**
 * Delete images from Supabase Storage
 * @param imagePaths - Array of storage paths to delete
 */
export async function deleteImagesFromSupabase(imagePaths: string[]): Promise<void> {
  if (imagePaths.length === 0) return;

  const supabase = createClient();
  console.log(`🗑️ Deleting ${imagePaths.length} images from Supabase Storage...`);

  const { error } = await supabase.storage
    .from('property-images')
    .remove(imagePaths);

  if (error) {
    console.error('❌ Failed to delete images:', error);
    throw new Error(`Failed to delete images: ${error.message}`);
  }

  console.log(`✅ Deleted ${imagePaths.length} images successfully`);
}
