'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    // Only track in production or if explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_ANALYTICS) {
      return;
    }

    // Don't track admin pages, API routes, or internal pages
    if (pathname?.includes('/api/') || 
        pathname?.includes('/admin') || 
        pathname?.includes('/_next') ||
        pathname?.includes('/dashboard')) {
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
            page_path: pathname,
            user_agent: navigator.userAgent,
            referrer: document.referrer || null
          })
        });
      } catch (error) {
        // Silently fail - don't break the page if analytics fails
        console.debug('Page tracking failed:', error);
      }
    };

    // Small delay to avoid blocking page load
    const timeoutId = setTimeout(trackPageView, 100);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);
}