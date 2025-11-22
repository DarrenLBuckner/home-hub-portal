'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/hooks/useAdminData';
import DualContextPropertyManager from '@/components/DualContextPropertyManager';
import DashboardHeader from '@/components/admin/DashboardHeader';

export default function AdminPropertiesPage() {
  const router = useRouter();
  const { adminData, permissions, isAdmin, isLoading: adminLoading, error: adminError } = useAdminData();

  useEffect(() => {
    if (adminLoading) return;
    
    if (adminError) {
      console.error('❌ Admin data error:', adminError);
      alert('Error loading admin data. Please try again.');
      router.push('/admin-login');
      return;
    }
    
    if (!isAdmin) {
      console.log('❌ Not authorized to view admin dashboard.');
      alert('Access denied. Admin privileges required.');
      router.push('/admin-login');
      return;
    }
  }, [adminLoading, adminError, isAdmin, router]);

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center max-w-sm mx-auto">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading property management...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Standardized Header with Back Button */}
      <DashboardHeader
        title="All Properties Management"
        description="Comprehensive property management, approval, and oversight dashboard"
        icon="🏠"
        adminInfo={`Welcome, ${adminData?.email} • ${adminData?.admin_level || 'Admin'} • Full Property Access`}
      />
      
      <div className="py-6">
        <DualContextPropertyManager
          userId={adminData?.id || ''}
          userType="admin"
          adminLevel={adminData?.admin_level}
          countryId={adminData?.country_id || undefined}
          permissions={permissions ? {
            canApproveProperties: permissions.canApproveProperties,
            canRejectProperties: permissions.canRejectProperties,
            canViewAllCountries: permissions.canViewAllCountries,
            countryFilter: permissions.countryFilter
          } : undefined}
        />
      </div>
    </div>
  );
}