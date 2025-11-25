'use client';
import { useState, useEffect } from 'react';
import { useAdminData } from '@/hooks/useAdminData';

interface AnalyticsData {
  today_views: number;
  total_views_30d: number;
  top_pages: { path: string; count: number }[];
}

export default function VisitorAnalytics() {
  const { adminData, isAdmin } = useAdminData();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch if user is admin with proper permissions
    if (isAdmin && adminData && (adminData.admin_level === 'super_admin' || adminData.admin_level === 'admin_owner')) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [isAdmin, adminData]);

  // Only show to super admins and admin owners
  if (!isAdmin || !adminData || (adminData.admin_level !== 'super_admin' && adminData.admin_level !== 'admin_owner')) {
    return null;
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics?type=summary');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="text-sm text-gray-500">📊 Loading visitor analytics...</div>
    </div>
  );
  
  // Always show analytics, even if no data
  const safeAnalytics = analytics || {
    today_views: 0,
    total_views_30d: 0,
    top_pages: []
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="text-sm font-medium text-blue-800 mb-3">
        📊 Visitor Analytics (Last 30 Days)
      </h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <div className="text-xl font-bold text-blue-900">{safeAnalytics.today_views}</div>
          <div className="text-xs text-blue-700">Views Today</div>
        </div>
        <div className="bg-white p-3 rounded border">
          <div className="text-xl font-bold text-green-900">{safeAnalytics.total_views_30d}</div>
          <div className="text-xs text-green-700">Total Views</div>
        </div>
      </div>

      <div className="bg-white p-3 rounded border">
        <h4 className="text-xs font-medium text-gray-700 mb-2">Top Pages</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {safeAnalytics.top_pages && safeAnalytics.top_pages.length > 0 ? (
            safeAnalytics.top_pages.slice(0, 5).map((page, index) => (
              <div key={index} className="flex justify-between items-center text-xs">
                <span className="text-gray-600 truncate mr-2" title={page.path}>
                  {page.path === '/' ? 'Home' : page.path.replace('/', '')}
                </span>
                <span className="text-blue-600 font-medium">{page.count}</span>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500">No page visits yet</div>
          )}
        </div>
      </div>
    </div>
  );
}