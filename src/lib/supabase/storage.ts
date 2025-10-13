import { createClient } from './browser'

// Client-side storage functions for browser use
export const uploadToStorage = async (
  bucket: string,
  filePath: string,
  file: File
) => {
  const supabase = createClient()
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true,
    })
    
  return { data, error }
}

export const getPublicUrl = (bucket: string, path: string) => {
  const supabase = createClient()
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// Legacy function for backward compatibility - will eventually migrate existing code
export const uploadPropertyImage = async (file: File, userId: string) => {
  try {
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const filePath = `properties/${userId}/${fileName}`;
    
    const { data, error } = await uploadToStorage('property-images', filePath, file);
    
    if (error) throw error;
    
    const publicUrl = getPublicUrl('property-images', filePath);
    
    return {
      url: publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};