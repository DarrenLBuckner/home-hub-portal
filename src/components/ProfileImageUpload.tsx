'use client';

import { useState, useRef, useCallback } from 'react';
import { convertHeicIfNeeded, isHeicFile } from '@/lib/heicConversion';

interface ProfileImageUploadProps {
  currentImageUrl?: string;
  onImageSelect: (file: File | null) => void;
  onImageUrlChange: (url: string) => void;
  className?: string;
}

// Image compression utility
const compressImage = async (file: File, maxWidth = 800, maxHeight = 800, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

export default function ProfileImageUpload({
  currentImageUrl,
  onImageSelect,
  onImageUrlChange,
  className = ''
}: ProfileImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!acceptedTypes.includes(file.type) && !isHeicFile(file)) {
      return `File type not supported. Please use JPG, PNG, WebP, or HEIC`;
    }
    
    return null;
  };

  const uploadImageToStorage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'profile');
    
    const response = await fetch('/api/upload/profile-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }
    
    const { url } = await response.json();
    return url;
  };

  const handleFileSelect = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(error);
      return;
    }

    setIsCompressing(true);
    setIsUploading(true);
    
    try {
      // Convert HEIC to JPEG if needed (Canvas API cannot decode HEIC)
      let fileToProcess = file;
      try {
        fileToProcess = await convertHeicIfNeeded(file);
      } catch (heicError) {
        alert('Could not convert HEIC file. Please upload a JPEG or PNG instead.');
        setIsCompressing(false);
        setIsUploading(false);
        return;
      }

      // Compress the image before upload
      console.log('Original file size:', (fileToProcess.size / 1024 / 1024).toFixed(2) + 'MB');
      const compressedFile = await compressImage(fileToProcess);
      console.log('Compressed file size:', (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB');
      
      setIsCompressing(false);

      // Create preview from compressed file
      const newPreviewUrl = URL.createObjectURL(compressedFile);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(newPreviewUrl);
      setUploadedFile(compressedFile);

      // Upload compressed file to storage
      const uploadedUrl = await uploadImageToStorage(compressedFile);
      onImageUrlChange(uploadedUrl);
      onImageSelect(compressedFile);
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';
      alert(errorMessage);
      // Reset on error
      setPreviewUrl(null);
      setUploadedFile(null);
    } finally {
      setIsCompressing(false);
      setIsUploading(false);
    }
  }, [previewUrl, onImageSelect, onImageUrlChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
      e.target.value = ''; // Reset for re-upload
    }
  }, [handleFileSelect]);

  const removeImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setUploadedFile(null);
    onImageSelect(null);
    onImageUrlChange('');
  };

  const displayImageUrl = previewUrl || currentImageUrl;

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            onClick={() => setUploadMode('upload')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              uploadMode === 'upload'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            📷 Upload Photo
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('url')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              uploadMode === 'url'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-green-600'
            }`}
          >
            🔗 Use URL
          </button>
        </div>

        {uploadMode === 'upload' ? (
          /* File Upload Mode */
          <div className="space-y-3">
            {/* Current Image Preview */}
            {displayImageUrl && (
              <div className="flex items-center space-x-3">
                <img 
                  src={displayImageUrl} 
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">Current profile photo</p>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            )}

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                dragActive
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-green-400'
              } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                {isUploading ? (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <p className="text-sm text-gray-600">
                      {isCompressing ? 'Compressing image...' : 'Uploading...'}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl mb-2">📸</div>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      JPG, PNG, WebP or HEIC • Photos are automatically compressed for fast loading
                    </p>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Choose Photo
                    </button>
                  </>
                )}
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        ) : (
          /* URL Mode */
          <div className="space-y-3">
            {displayImageUrl && (
              <div className="flex items-center space-x-3">
                <img 
                  src={displayImageUrl} 
                  alt="Profile preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="text-red-600 text-sm hover:underline"
                >
                  Remove Photo
                </button>
              </div>
            )}

            <input
              type="url"
              value={currentImageUrl || ""}
              onChange={(e) => onImageUrlChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="https://example.com/your-photo.jpg"
            />
            <p className="text-sm text-gray-500">
              <span className="text-blue-600">💡 Tip:</span> Upload to Google Drive, Dropbox, or similar and use the direct link.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}