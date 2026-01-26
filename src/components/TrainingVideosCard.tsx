"use client";
import React, { useState, useEffect } from 'react';

interface TrainingVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  display_order: number;
}

interface TrainingVideosCardProps {
  userType: 'agent' | 'landlord' | 'fsbo' | 'owner';
  countryCode?: string;
}

export default function TrainingVideosCard({ userType, countryCode = 'GY' }: TrainingVideosCardProps) {
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await fetch(
          `/api/training-videos?user_type=${userType}&country=${countryCode}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }

        const data = await response.json();
        setVideos(data.videos || []);
      } catch (err) {
        console.error('Error fetching training videos:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [userType, countryCode]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="space-y-3">
            <div className="h-10 bg-gray-100 rounded"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - show coming soon instead
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          Training Resources
        </h3>
        <div className="text-center py-4">
          <p className="text-gray-600 text-sm sm:text-base">
            Video tutorials coming soon.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            We're creating helpful guides for you.
          </p>
        </div>
      </div>
    );
  }

  // No videos - Coming Soon state
  if (videos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
          Training Resources
        </h3>
        <div className="text-center py-4">
          <div className="text-3xl mb-2">🕐</div>
          <p className="text-gray-600 text-sm sm:text-base">
            Video tutorials coming soon.
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            We're creating helpful guides for you.
          </p>
        </div>
      </div>
    );
  }

  // Has videos - display list
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500">
      <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        Training Videos
      </h3>

      <div className="space-y-2">
        {videos.map((video) => (
          <a
            key={video.id}
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors group min-h-[44px]"
          >
            <span className="text-green-600 group-hover:text-green-700 flex-shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="text-gray-800 text-sm sm:text-base group-hover:text-green-700 font-medium line-clamp-2">
              {video.title}
            </span>
          </a>
        ))}
      </div>

      <p className="text-gray-500 text-xs sm:text-sm mt-4 pt-3 border-t border-gray-100">
        More tutorials added regularly.
      </p>
    </div>
  );
}
