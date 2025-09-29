'use client';

import { useState, useRef, useCallback } from 'react';

interface EnhancedImageUploadProps {
  images: File[];
  setImages: (images: File[]) => void;
  maxImages?: number;
  maxSizePerImage?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
}

export default function EnhancedImageUpload({
  images,
  setImages,
  maxImages = 10,
  maxSizePerImage = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  className = ''
}: EnhancedImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // Generate preview URLs when images change
  useState(() => {
    const newPreviewUrls = images.map(file => URL.createObjectURL(file));
    
    // Clean up old URLs to prevent memory leaks
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    
    setPreviewUrls(newPreviewUrls);
    
    return () => {
      newPreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  });

  const validateFile = (file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `File type not supported. Please use: ${acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`;
    }
    
    if (file.size > maxSizePerImage * 1024 * 1024) {
      return `File too large. Maximum size: ${maxSizePerImage}MB`;
    }
    
    return null;
  };

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else if (validFiles.length + images.length < maxImages) {
        validFiles.push(file);
      } else {
        errors.push(`Maximum ${maxImages} images allowed`);
      }
    });

    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    if (validFiles.length > 0) {
      const newImages = [...images, ...validFiles];
      setImages(newImages);
    }
  }, [images, setImages, maxImages, maxSizePerImage, acceptedTypes]);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      // Reset the input value to allow selecting the same file again if needed
      e.target.value = '';
    }
  }, [handleFiles]);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviewUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to prevent memory leaks
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    
    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const newPreviewUrls = [...previewUrls];
    
    const movedImage = newImages.splice(fromIndex, 1)[0];
    const movedPreview = newPreviewUrls.splice(fromIndex, 1)[0];
    
    newImages.splice(toIndex, 0, movedImage);
    newPreviewUrls.splice(toIndex, 0, movedPreview);
    
    setImages(newImages);
    setPreviewUrls(newPreviewUrls);
  };

  const canUploadMore = images.length < maxImages;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Enhanced Upload Area */}
      {canUploadMore && (
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer group ${
            dragActive 
              ? 'border-blue-500 bg-blue-50 scale-105' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          <div className="space-y-4">
            {/* Upload Icon */}
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-colors ${
              dragActive ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-blue-50'
            }`}>
              <svg 
                className={`w-10 h-10 transition-colors ${
                  dragActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-blue-500'
                }`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            </div>
            
            {/* Main Text */}
            <div>
              <p className={`text-lg font-semibold mb-2 transition-colors ${
                dragActive ? 'text-blue-700' : 'text-gray-900'
              }`}>
                {dragActive 
                  ? 'Drop images here to upload' 
                  : 'Drop images here or click to upload property photos'
                }
              </p>
              <p className="text-sm text-gray-600">
                Upload up to {maxImages} high-quality photos • {acceptedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')} • Max {maxSizePerImage}MB each
              </p>
            </div>
            
            {/* Upload Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Use setTimeout to ensure proper event handling
                setTimeout(() => {
                  inputRef.current?.click();
                }, 10);
              }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Choose Files
            </button>
          </div>

          {/* Global South Optimization Note */}
          <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p className="flex items-center justify-center">
              <span className="mr-1">🌍</span>
              Optimized for mobile upload • Low bandwidth friendly
            </p>
          </div>
        </div>
      )}

      {/* Image Previews with Enhanced Controls */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Uploaded Photos ({images.length}/{maxImages})
            </h3>
            <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-blue-700 font-medium">First photo</span> will be the main image
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Image Container */}
                <div className="aspect-square bg-gray-100 overflow-hidden">
                  <img
                    src={url}
                    alt={`Property photo ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                
                {/* Image Controls Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                  {index > 0 && (
                    <button
                      onClick={() => moveImage(index, index - 1)}
                      className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 shadow-lg transition-all duration-200 hover:scale-110"
                      title="Move left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  
                  {index < images.length - 1 && (
                    <button
                      onClick={() => moveImage(index, index + 1)}
                      className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100 shadow-lg transition-all duration-200 hover:scale-110"
                      title="Move right"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  <button
                    onClick={() => removeImage(index)}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all duration-200 hover:scale-110"
                    title="Remove photo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Main Image Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                    Main Photo
                  </div>
                )}

                {/* Image Size Info */}
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {(images[index].size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            ))}
          </div>

          {/* Additional Upload Button */}
          {canUploadMore && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setTimeout(() => {
                  inputRef.current?.click();
                }, 10);
              }}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center justify-center space-x-2 text-gray-600 group-hover:text-blue-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-medium">Add More Photos ({maxImages - images.length} remaining)</span>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Enhanced Photo Tips */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
          <span className="text-xl mr-2">📸</span>
          Professional Photo Tips
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Use natural daylight for best results
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Clean and declutter rooms before photographing
            </li>
            <li className="flex items-start">
              <span className="text-green-500 mr-2">✓</span>
              Include exterior, main rooms, kitchen & bathrooms
            </li>
          </ul>
          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">💡</span>
              First photo becomes your main listing image
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">💡</span>
              High-quality photos get 40% more inquiries
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">💡</span>
              Mobile-optimized for Caribbean/Global South users
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}