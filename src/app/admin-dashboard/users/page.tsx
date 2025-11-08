"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { getCountryAwareAdminPermissions, AdminPermissions, getCountryFilter } from '@/lib/auth/adminPermissions';
import AdminUserManagement from '@/components/AdminUserManagement';

export default function AdminUsers() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAdminAccess() {
      console.log('🔍 ADMIN USERS: Checking admin access...');
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

      console.log('Admin users profile check:', { profile, profileError });

      // Check permissions using the country-aware system
      const userPermissions = await getCountryAwareAdminPermissions(
        profile?.user_type || '', 
        profile?.email || '',
        profile?.admin_level || null,
        authUser.id,
        supabase
      );
      
      if (profileError || !profile || !userPermissions.canViewUsers) {
        console.log('Not authorized to view users. User type:', profile?.user_type);
        alert('Access denied. Admin privileges required to view users.');
        router.push('/');
        return;
      }

      setPermissions(userPermissions);

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

  // Load users when permissions are available
  useEffect(() => {
    if (permissions && user) {
      loadUsers();
    }
  }, [permissions, user]);

  // Load users when permissions are available
  useEffect(() => {
    if (permissions && user) {
      loadUsers();
    }
  }, [permissions, user]);

  const loadUsers = async () => {
    try {
      if (!permissions) {
        console.log('No permissions available yet');
        return;
      }

      // Get country filter based on admin permissions
      const countryFilter = getCountryFilter(permissions);
      console.log('Country filter for users:', countryFilter);

      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply country filtering if not super admin
      if (!countryFilter.all && countryFilter.countryId) {
        query = query.eq('country_id', countryFilter.countryId);
      }

      const { data: profiles, error } = await query;

      if (error) throw error;
      console.log('Loaded users:', profiles?.length || 0, 'with country filter:', countryFilter);
      setUsers(profiles || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
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
                      User Management
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
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Country access indicator */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                🌍 <strong>Data Scope:</strong> {permissions?.canViewAllCountries 
                  ? 'Viewing users from ALL countries (Super Admin access)' 
                  : `Viewing users from ${permissions?.assignedCountryName || 'your assigned country'} only`}
              </p>
            </div>

            {/* Role-based access notification */}
            {!permissions?.canEditUsers && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm">
                  ⚠️ <strong>View-Only Access:</strong> You can view users but cannot edit or delete them. 
                  Only Super Admin and Country Owner Admin can modify user accounts.
                </p>
              </div>
            )}

            {/* Admin access message */}
            {permissions?.canEditUsers && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm">
                  ✅ <strong>{permissions?.canViewAllCountries ? 'Super Admin Access' : 'Country Admin Access'}:</strong> 
                  {permissions?.canViewAllCountries 
                    ? ' You have full access to view, edit, and manage all user accounts globally.'
                    : ` You can view, edit, and manage user accounts in your assigned country (${permissions?.assignedCountryName || 'your country'}).`
                  }
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {/* Enhanced User Management Component */}
            <AdminUserManagement
              adminUserId={user?.id || ''}
              permissions={{
                canViewAllCountries: permissions?.canViewAllCountries || false,
                countryFilter: permissions?.countryFilter || null,
                canManageUsers: permissions?.canEditUsers || false
              }}
            />
            
            <div className="bg-white shadow overflow-hidden sm:rounded-md" style={{ display: 'none' }}>
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  All Users ({users.length})
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Manage user accounts and permissions.
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {users.map((profile) => (
                  <li key={profile.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {profile.first_name?.charAt(0) || 'U'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <div className="text-sm font-medium text-gray-900">
                                {profile.first_name} {profile.last_name}
                              </div>
                              <div className="ml-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  profile.admin_level === 'super' ? 'bg-red-100 text-red-800' :
                                  profile.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                                  profile.user_type === 'landlord' ? 'bg-blue-100 text-blue-800' :
                                  profile.user_type === 'agent' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {profile.user_type}
                                </span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {profile.email}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="text-sm text-gray-500">
                            Status: {profile.subscription_status || 'inactive'}
                          </div>
                          <div className="ml-4">
                            {permissions?.canEditUsers ? (
                              <Link
                                href={`/admin-dashboard/user-management`}
                                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                                title="Super Admin: Manage User"
                              >
                                Manage
                              </Link>
                            ) : (
                              <span className="text-gray-400 text-sm" title="View Only Access">
                                View Only
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {users.length === 0 && !error && (
                <div className="px-4 py-8 text-center">
                  <p className="text-gray-500">No users found.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}