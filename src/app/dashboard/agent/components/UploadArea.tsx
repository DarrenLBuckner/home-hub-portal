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
};

export default function UploadArea({ propertyId }: { propertyId: string }) {
  const supabase = createClientComponentClient();
  const [files, setFiles] = useState<LocalFile[]>([]);
  const maxFiles = 12;

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

  const removeFile = (id: string) =>
    setFiles(prev => prev.filter(f => f.id !== id));

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

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadAll = async () => {
    const bucket = "property_media";
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id ?? "agent-id-placeholder";

    setUploading(true);
    setUploadProgress(0);

    for (const [order, f] of files.entries()) {
      // Compress image before uploading (for mobile users on slow connections)
      const compressedFile = await compressImage(f.file);

      const fileExt = f.file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/${Date.now()}-${order}.${fileExt}`;

      const { error } = await supabase.storage.from(bucket).upload(path, compressedFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: compressedFile.type,
      });
      if (error) {
        setUploading(false);
        alert(`Upload failed for ${f.file.name}: ${error.message}`);
        return;
      }

      // Insert metadata into property_media table
      await supabase.from("property_media").insert({
        property_id: propertyId,
        url: path,
        type: "image",
        is_primary: f.isHero ?? false,
        position: order,
        file_size: compressedFile.size,
        mime_type: compressedFile.type,
      });

      // Update progress
      setUploadProgress(Math.round(((order + 1) / files.length) * 100));
    }

    setUploading(false);
    alert("Upload complete.");
    setFiles([]);
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

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {files.map((f, idx) => (
            <div key={f.id} className="relative border rounded-xl overflow-hidden">
              <img src={f.preview} alt={`preview-${idx}`} className="w-full h-32 object-cover" />
              <div className="absolute top-1 left-1 flex gap-1">
                <button onClick={() => markHero(f.id)} className={`px-2 py-1 text-xs rounded ${f.isHero ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-600'}`}>{f.isHero ? 'Hero' : 'Set Hero'}</button>
                <button onClick={() => removeFile(f.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-600">Remove</button>
              </div>
              <div className="absolute bottom-1 right-1 flex gap-1">
                <button onClick={() => move(f.id, 'up')} className="px-2 py-1 text-xs rounded bg-gray-100">↑</button>
                <button onClick={() => move(f.id, 'down')} className="px-2 py-1 text-xs rounded bg-gray-100">↓</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {uploading && uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          <button
            onClick={uploadAll}
            disabled={uploading}
            className={`px-6 py-2 rounded-lg transition ${
              uploading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {uploading ? `Uploading... ${uploadProgress}%` : 'Upload All'}
          </button>
        </div>
      )}
    </div>
  );
}
