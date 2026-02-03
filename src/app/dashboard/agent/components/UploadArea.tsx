"use client";

import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { compressImage } from "@/lib/imageCompression";

export type LocalFile = {
  id: string;
  file: File;
  preview: string;
  isHero?: boolean;
  uploadStatus?: 'pending' | 'uploading' | 'complete' | 'error';
  uploadError?: string;
};

type UploadError = {
  isVisible: boolean;
  message: string;
  failedFiles: string[];
  failedFileIds: string[];
};

export default function UploadArea({ propertyId }: { propertyId: string }) {
  const supabase = createClientComponentClient();
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<UploadError>({
    isVisible: false,
    message: '',
    failedFiles: [],
    failedFileIds: []
  });
  const maxFiles = 12;
  const UPLOAD_TIMEOUT_MS = 30000; // 30 second timeout per image

  useEffect(() => {
    return () => files.forEach(f => URL.revokeObjectURL(f.preview));
  }, [files]);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles(prev => [
      ...prev,
      ...accepted.slice(0, Math.max(0, maxFiles - prev.length)).map(f => ({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
        uploadStatus: 'pending' as const
      })),
    ]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, isFocused, isDragReject } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    maxFiles,
    maxSize: 8 * 1024 * 1024, // 8MB per file
  });

  const borderClass = useMemo(() => {
    if (isDragReject) return "border-red-500";
    if (isDragActive || isFocused) return "border-cyan-500";
    return "border-dashed border-gray-300";
  }, [isDragActive, isFocused, isDragReject]);

  const markHero = (id: string) =>
    setFiles(prev => prev.map(f => ({ ...f, isHero: f.id === id })));

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    // Clear error if this was the only failed file
    setUploadError(prev => ({
      ...prev,
      failedFileIds: prev.failedFileIds.filter(fid => fid !== id),
      failedFiles: prev.failedFiles.filter((_, idx) => prev.failedFileIds[idx] !== id)
    }));
  };

  const move = (id: string, dir: "up" | "down") =>
    setFiles(prev => {
      const idx = prev.findIndex(f => f.id === id);
      if (idx < 0) return prev;
      const to = dir === "up" ? Math.max(0, idx - 1) : Math.min(prev.length - 1, idx + 1);
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(to, 0, item);
      return copy;
    });

  /**
   * Upload a single file with timeout protection and detailed error reporting
   */
  const uploadSingleFile = async (
    localFile: LocalFile,
    order: number,
    maxRetries: number = 3
  ): Promise<{ success: boolean; error?: string }> => {
    const bucket = "property_media";
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? "agent-id-placeholder";

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Mark file as uploading
        setFiles(prev => prev.map(f => f.id === localFile.id ? { ...f, uploadStatus: 'uploading' as const, uploadError: undefined } : f));

        // Compress image before uploading
        const compressedFile = await compressImage(localFile.file);

        const fileExt = localFile.file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${Date.now()}-${order}.${fileExt}`;

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);

        try {
          const { error } = await Promise.race([
            supabase.storage.from(bucket).upload(path, compressedFile, {
              cacheControl: "3600",
              upsert: false,
              contentType: compressedFile.type,
            }),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Upload timeout: exceeded ${UPLOAD_TIMEOUT_MS}ms`)), UPLOAD_TIMEOUT_MS)
            ) as Promise<any>
          ]);

          clearTimeout(timeoutId);

          if (error) {
            throw new Error(`Storage error: ${error.message}`);
          }

          // Insert metadata into property_media table (with timeout protection)
          const metadataController = new AbortController();
          const metadataTimeoutId = setTimeout(() => metadataController.abort(), 10000); // 10s for metadata

          try {
            const { error: metadataError } = await supabase
              .from("property_media")
              .insert({
                property_id: propertyId,
                url: path,
                type: "image",
                is_primary: localFile.isHero ?? false,
                position: order,
                file_size: compressedFile.size,
                mime_type: compressedFile.type,
              });

            clearTimeout(metadataTimeoutId);

            if (metadataError) {
              console.error(`❌ Metadata insertion failed for ${localFile.file.name}:`, metadataError);
              // Metadata failure is not fatal - image is in storage
              console.log(`⚠️ Image stored but metadata insertion failed. Continuing...`);
            }
          } catch (err) {
            clearTimeout(metadataTimeoutId);
            console.error(`❌ Metadata timeout/error:`, err);
            // Continue - image is stored, metadata can be reconciled later
          }

          // Mark as complete
          setFiles(prev => prev.map(f => f.id === localFile.id ? { ...f, uploadStatus: 'complete' as const, uploadError: undefined } : f));
          console.log(`✅ Successfully uploaded ${localFile.file.name}`);
          return { success: true };

        } catch (err) {
          clearTimeout(timeoutId);
          throw err;
        }

      } catch (error: any) {
        const isTimeout = error.message.includes('timeout') || error.name === 'AbortError';
        const errorMessage = isTimeout
          ? `⏱️ Timeout: ${localFile.file.name} took longer than 30 seconds`
          : `Upload failed: ${error.message}`;

        console.error(`❌ Attempt ${attempt}/${maxRetries} - ${errorMessage}`);

        if (attempt === maxRetries) {
          // Final attempt failed
          setFiles(prev => prev.map(f =>
            f.id === localFile.id
              ? { ...f, uploadStatus: 'error' as const, uploadError: isTimeout ? 'Network timeout - please check your connection' : error.message }
              : f
          ));
          return { success: false, error: errorMessage };
        }

        // Wait before retry
        const delay = Math.pow(2, attempt - 1) * 1000;
        console.log(`⏳ Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return { success: false, error: 'Unknown upload error' };
  };

  const uploadAll = async () => {
    setUploading(true);
    setUploadProgress(0);
    setUploadError({ isVisible: false, message: '', failedFiles: [], failedFileIds: [] });

    const failedFiles: string[] = [];
    const failedFileIds: string[] = [];
    let successCount = 0;

    for (const [order, f] of files.entries()) {
      const result = await uploadSingleFile(f, order);

      if (result.success) {
        successCount++;
        setUploadProgress(Math.round(((successCount) / files.length) * 100));
      } else {
        failedFiles.push(`${f.file.name}: ${result.error || 'Unknown error'}`);
        failedFileIds.push(f.id);
      }
    }

    setUploading(false);

    if (failedFiles.length > 0) {
      // Show detailed error with failed files
      setUploadError({
        isVisible: true,
        message: `${failedFiles.length}/${files.length} image(s) failed to upload. Please check your internet connection and try again.`,
        failedFiles,
        failedFileIds
      });
      console.error('Upload errors:', failedFiles);
    } else {
      // Success!
      console.log('✅ All images uploaded successfully');
      setUploadProgress(100);
      // Clear files after short delay so user sees 100%
      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
      }, 1000);
    }
  };

  const retryFailedUploads = async () => {
    const filesToRetry = files.filter(f => uploadError.failedFileIds.includes(f.id));
    
    if (filesToRetry.length === 0) {
      setUploadError({ isVisible: false, message: '', failedFiles: [], failedFileIds: [] });
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadError({ isVisible: false, message: '', failedFiles: [], failedFileIds: [] });

    const newFailedFiles: string[] = [];
    const newFailedFileIds: string[] = [];
    let successCount = 0;

    for (const [idx, f] of filesToRetry.entries()) {
      const fileIndex = files.findIndex(file => file.id === f.id);
      const result = await uploadSingleFile(f, fileIndex);

      if (result.success) {
        successCount++;
      } else {
        newFailedFiles.push(`${f.file.name}: ${result.error || 'Unknown error'}`);
        newFailedFileIds.push(f.id);
      }

      setUploadProgress(Math.round(((idx + 1) / filesToRetry.length) * 100));
    }

    setUploading(false);

    if (newFailedFiles.length > 0) {
      setUploadError({
        isVisible: true,
        message: `${newFailedFiles.length}/${filesToRetry.length} image(s) still failing. Please check your connection and try again.`,
        failedFiles: newFailedFiles,
        failedFileIds: newFailedFileIds
      });
    } else {
      console.log('✅ All failed images now uploaded successfully');
      setUploadProgress(100);
      setTimeout(() => {
        setFiles([]);
        setUploadProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`w-full p-6 rounded-2xl border-2 ${borderClass} text-center cursor-pointer transition bg-white hover:shadow-sm`}
      >
        <input {...getInputProps()} />
        <p className="text-sm md:text-base">
          {isDragActive ? "Drop to upload…" : "Drag & drop images here, or click to select"}
        </p>
        <p className="text-xs text-gray-500 mt-1">PNG/JPG, up to 8MB each, max {maxFiles} images</p>
      </div>

      {/* Error Modal */}
      {uploadError.isVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-red-600 mb-3">Upload Error</h3>
            <p className="text-gray-700 mb-4">{uploadError.message}</p>

            {uploadError.failedFiles.length > 0 && (
              <div className="bg-red-50 rounded p-3 mb-4 max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-red-700 mb-2">Failed files:</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {uploadError.failedFiles.map((file, idx) => (
                    <li key={idx}>• {file}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Remove failed files
                  uploadError.failedFileIds.forEach(id => removeFile(id));
                  setUploadError({ isVisible: false, message: '', failedFiles: [], failedFileIds: [] });
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              >
                Remove Failed
              </button>
              <button
                onClick={retryFailedUploads}
                disabled={uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Retrying...' : 'Retry Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map((f, idx) => (
            <div key={f.id} className="relative border rounded-xl overflow-hidden">
              <div className="relative">
                <img src={f.preview} alt={`preview-${idx}`} className="w-full h-32 object-cover" />

                {/* Status Overlay */}
                {f.uploadStatus && f.uploadStatus !== 'pending' && (
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    {f.uploadStatus === 'uploading' && (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
                        <p className="text-white text-xs">Uploading...</p>
                      </div>
                    )}
                    {f.uploadStatus === 'complete' && (
                      <div className="text-center">
                        <p className="text-white text-2xl">✅</p>
                      </div>
                    )}
                    {f.uploadStatus === 'error' && (
                      <div className="text-center">
                        <p className="text-white text-2xl">❌</p>
                        <p className="text-white text-xs mt-1 max-w-[100px]">{f.uploadError || 'Failed'}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="absolute top-1 left-1 flex gap-1">
                <button
                  onClick={() => markHero(f.id)}
                  disabled={uploading}
                  className={`px-2 py-1 text-xs rounded disabled:opacity-50 ${f.isHero ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-600'}`}
                >
                  {f.isHero ? 'Hero' : 'Hero'}
                </button>
                <button
                  onClick={() => removeFile(f.id)}
                  disabled={uploading}
                  className="px-2 py-1 text-xs rounded bg-red-100 text-red-600 disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              <div className="absolute bottom-1 right-1 flex gap-1">
                <button
                  onClick={() => move(f.id, 'up')}
                  disabled={uploading || idx === 0}
                  className="px-2 py-1 text-xs rounded bg-gray-100 disabled:opacity-50"
                >
                  ↑
                </button>
                <button
                  onClick={() => move(f.id, 'down')}
                  disabled={uploading || idx === files.length - 1}
                  className="px-2 py-1 text-xs rounded bg-gray-100 disabled:opacity-50"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-3">
          {uploading && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={uploadAll}
            disabled={uploading}
            className={`w-full px-6 py-3 rounded-lg transition font-medium ${
              uploading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {uploading ? `Uploading... ${uploadProgress}%` : `Upload All (${files.length})`}
          </button>

          <p className="text-xs text-gray-500 text-center">
            ⏱️ Each image has 30-second timeout • Check your internet connection if uploads fail
          </p>
        </div>
      )}
    </div>
  );
}
