"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

export default function AdminSettings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAdminAccess() {
      console.log('🔍 ADMIN SETTINGS: Checking admin access...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('❌ No authenticated user, redirecting to admin login');
        window.location.href = '/admin-login';
        return;
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, admin_level, first_name, last_name, email')
        .eq('id', authUser.id)
        .single();

      console.log('Admin settings profile check:', { profile, profileError });

      if (profileError || !profile || !['admin'].includes(profile.user_type) || !['super', 'owner'].includes(profile.admin_level)) {
        console.log('Not authorized as admin. User type:', profile?.user_type);
        alert('Access denied. Admin privileges required.');
        router.push('/');
        return;
      }

      setUser({ 
        ...authUser, 
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        role: profile.user_type 
      });

      setLoading(false);
    }

    checkAdminAccess();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between lg:border-t lg:border-gray-200">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <div>
                  <div className="flex items-center">
                    <h1 className="ml-3 text-2xl font-bold leading-7 text-gray-900 sm:truncate">
                      Admin Settings
                    </h1>
                  </div>
                  <dl className="mt-6 flex flex-col sm:ml-3 sm:mt-1 sm:flex-row sm:flex-wrap">
                    <dt className="sr-only">Account status</dt>
                    <dd className="flex items-center text-sm text-gray-500 font-medium capitalize sm:mr-6">
                      <div className="w-1.5 h-1.5 flex-shrink-0 mr-1.5 bg-green-400 rounded-full"></div>
                      {user?.role} Dashboard
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              <Link
                href="/admin-dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-10">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <h3 className="mt-2 text-sm font-medium text-gray-900">Admin Settings</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure system settings and preferences.
                </p>
                <div className="mt-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="col-span-1">
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">S</span>
                              </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  System Configuration
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                  <Link href="/admin-dashboard/system-settings" className="text-blue-600 hover:text-blue-500">
                                    Configure →
                                  </Link>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">U</span>
                              </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  User Management
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                  <Link href="/admin-dashboard/user-management" className="text-blue-600 hover:text-blue-500">
                                    Manage →
                                  </Link>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">P</span>
                              </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  Payment Settings
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                  <Link href="/admin-payments" className="text-blue-600 hover:text-blue-500">
                                    Configure →
                                  </Link>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}