// Direct Supabase Storage upload utility
// Bypasses API payload limits by uploading directly from browser to Supabase
import { createClient } from '@/supabase';

export interface UploadedImage {
  url: string;
  path: string;
  name: string;
}

/**
 * Upload images directly to Supabase Storage
 * Handles compression automatically via the ImageUploader component
 * @param images - Array of compressed File objects from the browser
 * @param userId - User ID for organizing uploads
 * @returns Array of uploaded image URLs
 */
export async function uploadImagesToSupabase(
  images: File[],
  userId: string
): Promise<UploadedImage[]> {
  const supabase = createClient();
  const uploadedImages: UploadedImage[] = [];
  
  console.log(`📤 Uploading ${images.length} images directly to Supabase Storage...`);

  // Upload images in parallel for speed
  const uploadPromises = images.map(async (file, index) => {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${timestamp}-${randomStr}-${index}.${fileExt}`;

      console.log(`⬆️ Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error(`❌ Failed to upload ${file.name}:`, error);
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
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
      console.error(`❌ Error uploading ${file.name}:`, error);
      throw error;
    }
  });

  // Wait for all uploads to complete
  const results = await Promise.all(uploadPromises);
  uploadedImages.push(...results);

  console.log(`✅ All ${uploadedImages.length} images uploaded successfully!`);
  return uploadedImages;
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
