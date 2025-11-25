'use client';
import { useEffect } from 'react';

interface PageTrackerProps {
  path?: string;
}

export default function PageTracker({ path }: PageTrackerProps) {
  useEffect(() => {
    // Only track in production
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Don't track admin pages, API routes, or internal pages
    if (path?.includes('/admin') || 
        path?.includes('/dashboard') ||
        path?.includes('/api/')) {
      return;
    }

    const trackPageView = async () => {
      try {
        await fetch('/api/admin/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            page_path: path || window.location.pathname,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null
          })
        });
      } catch (error) {
        // Silently fail - don't break the page
      }
    };

    // Small delay to avoid blocking page load
    const timeoutId = setTimeout(trackPageView, 200);
    
    return () => clearTimeout(timeoutId);
  }, [path]);

  return null; // This component renders nothing
}