'use client'

import React from 'react'

interface VideoEmbedProps {
  videoUrl: string
  title?: string
  className?: string
}

/**
 * VideoEmbed Component for Portal Home Hub
 * 
 * Handles YouTube and Vimeo video embedding with:
 * - User retention features (no autoplay/related videos)
 * - Responsive design
 * - Real estate optimized settings
 */
export default function VideoEmbed({ videoUrl, title = "Property Video", className = "" }: VideoEmbedProps) {
  if (!videoUrl) return null

  const getEmbedUrl = (url: string): string | null => {
    try {
      // YouTube URL patterns
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
      const youtubeMatch = url.match(youtubeRegex)
      
      if (youtubeMatch) {
        const videoId = youtubeMatch[1]
        // Optimized parameters for real estate videos:
        // - autoplay=0: Don't automatically play (keeps users on site)
        // - rel=0: Don't show related videos (prevents navigation away)
        // - modestbranding=1: Minimize YouTube branding
        // - playsinline=1: Better mobile experience
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1&playsinline=1`
      }

      // Vimeo URL patterns
      const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)([0-9]+)/
      const vimeoMatch = url.match(vimeoRegex)
      
      if (vimeoMatch) {
        const videoId = vimeoMatch[1]
        // Vimeo embed parameters for real estate:
        // - autoplay=0: Don't automatically play
        // - title=0: Hide title overlay
        // - byline=0: Hide author byline
        // - portrait=0: Hide author portrait
        return `https://player.vimeo.com/video/${videoId}?autoplay=0&title=0&byline=0&portrait=0`
      }

      return null
    } catch (error) {
      console.error('Error parsing video URL:', error)
      return null
    }
  }

  const embedUrl = getEmbedUrl(videoUrl)
  
  if (!embedUrl) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <p className="text-yellow-800 text-sm">
          <strong>⚠️ Invalid video URL.</strong> Please use a valid YouTube or Vimeo link.
        </p>
        <p className="text-yellow-700 text-xs mt-1">
          Examples: https://www.youtube.com/watch?v=... or https://vimeo.com/...
        </p>
      </div>
    )
  }

  return (
    <div className={`video-embed-container ${className}`}>
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="relative">
          {/* 16:9 Aspect Ratio Container */}
          <div className="relative w-full h-0 pb-[56.25%] bg-gray-100">
            <iframe
              src={embedUrl}
              title={title}
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </div>
        
        {/* Video Info Footer */}
        <div className="p-3 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="text-purple-500">🎥</span>
              <span>Property Video Tour</span>
            </div>
            <div className="text-xs text-gray-500">
              {videoUrl.includes('youtube.com') && '📺 YouTube'}
              {videoUrl.includes('vimeo.com') && '🎬 Vimeo'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Utility function to validate video URLs
 * Can be used in forms for real-time validation
 */
export function isValidVideoUrl(url: string): boolean {
  if (!url) return false
  
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)([0-9]+)/
  
  return youtubeRegex.test(url) || vimeoRegex.test(url)
}

/**
 * Extract video platform and ID from URL
 * Useful for analytics or additional processing
 */
export function getVideoInfo(url: string): { platform: 'youtube' | 'vimeo' | null, id: string | null } {
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const youtubeMatch = url.match(youtubeRegex)
  
  if (youtubeMatch) {
    return { platform: 'youtube', id: youtubeMatch[1] }
  }

  const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)([0-9]+)/
  const vimeoMatch = url.match(vimeoRegex)
  
  if (vimeoMatch) {
    return { platform: 'vimeo', id: vimeoMatch[1] }
  }

  return { platform: null, id: null }
}