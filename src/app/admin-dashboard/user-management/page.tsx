"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  admin_level?: string;
  created_at: string;
  updated_at: string;
}

export default function UserManagement() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSuperAdminAccess() {
      console.log('🔍 USER MANAGEMENT: Checking super admin access...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('❌ No authenticated user, redirecting to admin login');
        window.location.href = '/admin-login';
        return;
      }

      // Check if user is super_admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, admin_level, first_name, last_name, email')
        .eq('id', authUser.id)
        .single();

      console.log('User management profile check:', { profile, profileError });

      if (profileError || !profile || profile.user_type !== 'super_admin') {
        console.log('Not authorized as super admin. User type:', profile?.user_type);
        alert('Access denied. Super Admin privileges required.');
        router.push('/admin-dashboard');
        return;
      }

      setUser({ 
        ...authUser, 
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        role: profile.user_type 
      });

      await loadUsers();
      setLoading(false);
    }

    checkSuperAdminAccess();
  }, []);

  async function loadUsers() {
    try {
      console.log('Loading users data...');
      
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error loading users:', usersError);
        setError(`Failed to load users: ${usersError.message}`);
        return;
      }

      console.log('Loaded users:', usersData?.length || 0);
      setUsers(usersData || []);

    } catch (err: any) {
      console.error('Failed to load users data:', err);
      setError(`Failed to load users data: ${err?.message || 'Unknown error'}`);
      setUsers([]);
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          user_type: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user role:', error);
        alert(`Failed to update user role: ${error.message}`);
        return;
      }

      // Reload users to reflect changes
      await loadUsers();
      console.log(`User ${userId} role updated to ${newRole}`);
      
    } catch (err: any) {
      console.error('Failed to update user role:', err);
      alert(`Failed to update user role: ${err?.message || 'Unknown error'}`);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading user management...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="text-red-600 mb-4">⚠️ Error</div>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={loadUsers}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Super Admin</div>
                <div className="font-medium">{user?.name}</div>
              </div>
              <Link href="/admin-dashboard">
                <button className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors">
                  Dashboard
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Warning Notice */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            ⚠️ <strong>Super Admin Only:</strong> Changing user roles can affect system security. 
            Use caution when granting admin privileges.
          </p>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                System Users ({users.length})
              </h2>
              <button 
                onClick={loadUsers}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No users found</h3>
              <p className="text-gray-500">User profiles will appear here when they register.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((userData) => (
                    <tr key={userData.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {userData.first_name} {userData.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {userData.id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {userData.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          userData.user_type === 'super_admin' 
                            ? 'bg-red-100 text-red-800'
                            : userData.user_type === 'admin'
                            ? 'bg-blue-100 text-blue-800'
                            : userData.user_type === 'agent'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userData.user_type || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userData.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {userData.id !== user?.id ? (
                          <select
                            value={userData.user_type || 'user'}
                            onChange={(e) => updateUserRole(userData.id, e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="user">User</option>
                            <option value="agent">Agent</option>
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                          </select>
                        ) : (
                          <span className="text-gray-500 text-sm">Current User</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Role Descriptions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-4">👤 User Role Descriptions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800 text-sm">
            <div>
              <strong>User:</strong> Basic access, can list properties
            </div>
            <div>
              <strong>Agent:</strong> Can manage own listings and clients
            </div>
            <div>
              <strong>Admin:</strong> Can review properties, view-only payments
            </div>
            <div>
              <strong>Super Admin:</strong> Full system access, user management
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}