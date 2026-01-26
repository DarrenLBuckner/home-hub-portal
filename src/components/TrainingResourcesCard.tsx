"use client";
import React, { useState, useEffect } from 'react';

interface TrainingResource {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  category: string;
  language: string;
  is_featured: boolean;
  display_order: number;
  download_count: number;
}

interface TrainingResourcesCardProps {
  userType: 'agent' | 'landlord' | 'fsbo' | 'owner';
  countryCode?: string;
}

const CATEGORY_ICONS: { [key: string]: string } = {
  guide: '📖',
  checklist: '✅',
  template: '📋',
  legal: '⚖️',
  marketing: '📣',
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function TrainingResourcesCard({ userType, countryCode = 'GY' }: TrainingResourcesCardProps) {
  const [resources, setResources] = useState<TrainingResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch(
          `/api/training-resources?user_type=${userType}&country=${countryCode}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }

        const data = await response.json();
        setResources(data.resources || []);
      } catch (err) {
        console.error('Error fetching training resources:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [userType, countryCode]);

  const handleDownload = async (resource: TrainingResource) => {
    // Track download (fire and forget)
    fetch(`/api/training-resources/download/${resource.id}`, { method: 'POST' }).catch(() => {});

    // Open file in new tab for download
    window.open(resource.file_url, '_blank');
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-teal-500">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-44 mb-4"></div>
          <div className="space-y-3">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - show coming soon instead
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-teal-500">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          Training Resources
        </h3>
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm sm:text-base">
            Downloadable resources coming soon.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            We're preparing helpful documents for you.
          </p>
        </div>
      </div>
    );
  }

  // No resources - Coming Soon state
  if (resources.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-teal-500">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          Training Resources
        </h3>
        <div className="text-center py-4">
          <div className="text-3xl mb-2">📄</div>
          <p className="text-gray-600 text-sm sm:text-base">
            Downloadable resources coming soon.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            We're preparing helpful documents for you.
          </p>
        </div>
      </div>
    );
  }

  // Separate featured and regular resources
  const featuredResources = resources.filter(r => r.is_featured);
  const regularResources = resources.filter(r => !r.is_featured);

  // Has resources - display list
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-teal-500">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span>📄</span> Training Resources
      </h3>

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <div className="mb-4">
          {featuredResources.map((resource) => (
            <button
              key={resource.id}
              onClick={() => handleDownload(resource)}
              className="w-full flex items-start gap-3 p-3 rounded-lg bg-teal-50 hover:bg-teal-100 transition-colors group mb-2 text-left"
            >
              <span className="text-teal-600 flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 3.5L18.5 8H14V3.5zM6 20V4h7v5a1 1 0 0 0 1 1h5v10H6z"/>
                  <path d="M12 14l-4 4h3v3h2v-3h3l-4-4z"/>
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-800 text-sm sm:text-base group-hover:text-teal-700 font-medium line-clamp-1">
                    {resource.title}
                  </span>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                    Featured
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{CATEGORY_ICONS[resource.category] || '📄'} {resource.category}</span>
                  <span>•</span>
                  <span>{formatFileSize(resource.file_size)}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Regular Resources */}
      <div className="space-y-2">
        {regularResources.map((resource) => (
          <button
            key={resource.id}
            onClick={() => handleDownload(resource)}
            className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-teal-50 transition-colors group text-left min-h-[44px]"
          >
            <span className="text-teal-600 group-hover:text-teal-700 flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 3.5L18.5 8H14V3.5zM6 20V4h7v5a1 1 0 0 0 1 1h5v10H6z"/>
                <path d="M12 14l-4 4h3v3h2v-3h3l-4-4z"/>
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-gray-800 text-sm sm:text-base group-hover:text-teal-700 font-medium line-clamp-1">
                {resource.title}
              </span>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{CATEGORY_ICONS[resource.category] || '📄'} {resource.category}</span>
                <span>•</span>
                <span>{formatFileSize(resource.file_size)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-gray-500 text-xs sm:text-sm mt-4 pt-3 border-t border-gray-100">
        Click to download. More resources added regularly.
      </p>
    </div>
  );
}
