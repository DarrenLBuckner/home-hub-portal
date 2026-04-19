'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminData } from '@/hooks/useAdminData';
import DashboardHeader from '@/components/admin/DashboardHeader';
import ServiceProvidersQueueClient from './ServiceProvidersQueueClient';

export default function ServiceProvidersPage() {
  const router = useRouter();
  const { isAdmin, isLoading } = useAdminData();

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      router.push('/admin-login');
    }
  }, [isLoading, isAdmin, router]);

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Service Providers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review, approve, and verify business directory submissions.
          </p>
        </div>
        <ServiceProvidersQueueClient />
      </div>
    </div>
  );
}
