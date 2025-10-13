"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboardRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    // Force mobile-first experience
    // Following Fortune 500 pattern: mobile-first approach
    // Inspired by Airbnb, Zillow mobile strategies
    router.replace('/admin-dashboard/mobile');
  }, [router]);

  // Loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-sm mx-auto">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading mobile-optimized dashboard...</p>
        <p className="text-sm text-gray-500 mt-2">Redirecting to enhanced mobile experience</p>
      </div>
    </div>
  );
}