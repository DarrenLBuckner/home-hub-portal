'use client';

import { useState, useRef } from 'react';
import { convertHeicFiles, isHeicFile } from '@/lib/heicConversion';

interface Step4PhotosProps {
  images: File[];
  setImages: (images: File[]) => void;
  existingImages?: string[];
  setExistingImages?: (images: string[]) => void;
  videoUrl?: string;
  onVideoUrlChange?: (url: string) => void;
  propertyId?: string;
}

export default function Step4Photos({ images, setImages, existingImages = [], setExistingImages, videoUrl, onVideoUrlChange, propertyId }: Step4PhotosProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ index: number; url: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/') || isHeicFile(file);
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    const totalCount = existingImages.length + images.length;
    if (validFiles.length + totalCount > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    // Convert any HEIC files to JPEG
    setIsConverting(true);
    const { converted, errors } = await convertHeicFiles(validFiles);
    setIsConverting(false);

    if (errors.length > 0) {
      alert(errors.map(e => e.error).join('\n'));
    }

    if (converted.length === 0) return;

    const newImages = [...images, ...converted];
    setImages(newImages);

    // Create preview URLs
    const newPreviewUrls = converted.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteExistingImage = (index: number) => {
    setDeleteConfirm({ index, url: existingImages[index] });
  };

  const confirmDeleteExistingImage = async () => {
    if (!deleteConfirm || !setExistingImages) return;
    const { index, url } = deleteConfirm;
    const isCoverPhoto = index === 0;

    if (propertyId) {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/properties/${propertyId}/delete-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: url }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'Failed to delete image');
          setIsDeleting(false);
          setDeleteConfirm(null);
          return;
        }
        setExistingImages(data.images);
        if (isCoverPhoto && data.images.length > 0) {
          showToast('Cover photo updated to next available photo.');
        }
      } catch {
        alert('Failed to delete image. Please try again.');
      } finally {
        setIsDeleting(false);
        setDeleteConfirm(null);
      }
    } else {
      setExistingImages(existingImages.filter((_, i) => i !== index));
      if (isCoverPhoto && existingImages.length > 1) {
        showToast('Cover photo updated to next available photo.');
      }
      setDeleteConfirm(null);
    }
  };

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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Property Photos</h2>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 mb-1">
              Drop photos here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Upload up to 10 high-quality photos (JPG, PNG, HEIC, max 10MB each)
            </p>
          </div>

          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Choose Files
          </button>
        </div>
      </div>

      {/* HEIC Converting Indicator */}
      {isConverting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <p className="text-blue-800 text-sm">Converting iPhone photos...</p>
          </div>
        </div>
      )}

      {/* Image Previews - existing saved photos + newly added */}
      {(existingImages.length + images.length) > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Photos ({existingImages.length + images.length}/10)</h3>
            <p className="text-sm text-gray-500">First photo will be the main image</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Existing saved images (URLs from draft/database) */}
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Delete button — visible on hover (desktop) or always (mobile) */}
                <button
                  onClick={() => handleDeleteExistingImage(index)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md z-10"
                  title="Remove photo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Main Photo
                  </div>
                )}

                <div className="absolute bottom-2 right-2 bg-gray-600 text-white text-xs px-2 py-1 rounded">
                  Saved
                </div>
              </div>
            ))}

            {/* Newly added images (File objects, not yet uploaded) */}
            {previewUrls.map((url, index) => (
              <div key={`new-${index}`} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`New Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Image Controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100">
                  {index > 0 && (
                    <button
                      onClick={() => moveImage(index, index - 1)}
                      className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100"
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
                      className="p-2 bg-white text-gray-700 rounded-full hover:bg-gray-100"
                      title="Move right"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  <button
                    onClick={() => removeImage(index)}
                    className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Main Image Badge - only if no existing images */}
                {existingImages.length === 0 && index === 0 && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Main Photo
                  </div>
                )}

                <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                  New
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Photo Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Take photos in good lighting, preferably natural daylight</li>
          <li>• Include exterior shots, main rooms, kitchen, and bathrooms</li>
          <li>• The first photo will be used as the main image in listings</li>
          <li>• Clean and declutter rooms before photographing</li>
          <li>• High-quality photos get more views and inquiries</li>
        </ul>
      </div>

      {/* Video Tour (Optional) */}
      {onVideoUrlChange && (
        <div className="border border-gray-200 rounded-lg p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video Tour (Optional)
          </label>
          <p className="text-sm text-gray-500 mb-3">
            Add a YouTube or Vimeo link to showcase your property.
            On your phone? <a href="https://studio.youtube.com/channel/UC/videos/upload" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Upload to YouTube</a> first, then paste the link here.
          </p>
          <input
            type="url"
            value={videoUrl || ''}
            onChange={(e) => onVideoUrlChange(e.target.value)}
            onBlur={(e) => {
              const url = e.target.value.trim();
              if (url && !url.match(/youtube\.com|youtu\.be|vimeo\.com/i)) {
                setVideoError('Please enter a YouTube or Vimeo URL');
              } else {
                setVideoError('');
              }
            }}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            className={`w-full border rounded-lg px-4 py-3 text-base ${
              videoError ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {videoError && (
            <p className="text-sm text-red-600 mt-1">{videoError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Paste a YouTube or Vimeo URL. Video will display on your listing.
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove this photo?</h3>
            {existingImages.length + images.length <= 1 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
                <p className="text-sm text-yellow-800">
                  This is the only photo. Your listing will show no image if you remove it.
                </p>
              </div>
            )}
            {deleteConfirm.index === 0 && existingImages.length > 1 && (
              <p className="text-sm text-gray-600 mb-3">
                This is the cover photo. The next photo will become the new cover.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteExistingImage}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg z-50 text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}
