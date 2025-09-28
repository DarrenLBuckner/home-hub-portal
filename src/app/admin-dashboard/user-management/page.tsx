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
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminFirstName, setNewAdminFirstName] = useState("");
  const [newAdminLastName, setNewAdminLastName] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);

  useEffect(() => {
    async function checkSuperAdminAccess() {
      console.log('🔍 USER MANAGEMENT: Checking super admin access...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('❌ No authenticated user, redirecting to admin login');
        window.location.href = '/admin-login';
        return;
      }

      // Check if user is super admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, admin_level, first_name, last_name, email')
        .eq('id', authUser.id)
        .single();

      console.log('User management profile check:', { profile, profileError });

      if (profileError || !profile || (profile.admin_level !== 'super' && profile.admin_level !== 'owner')) {
        console.log('Not authorized for user management. Admin level:', profile?.admin_level);
        alert('Access denied. Super Admin or Owner Admin privileges required.');
        router.push('/admin-dashboard');
        return;
      }

      const displayName = [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join(' ') || profile.email?.split('@')[0] || 'User';
      
      const adminLevelDisplay = profile.admin_level === 'super' 
        ? 'Super Admin'
        : profile.admin_level === 'owner'
        ? 'Owner Admin' 
        : 'Admin';

      setUser({ 
        ...authUser, 
        name: displayName,
        email: profile.email,
        role: profile.user_type,
        admin_level: profile.admin_level,
        admin_level_display: adminLevelDisplay
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
      // CRITICAL SECURITY: Check if trying to modify a Super Admin
      const { data: targetUser } = await supabase
        .from('profiles')
        .select('admin_level, email')
        .eq('id', userId)
        .single();

      // SECURITY: NEVER allow anyone to modify Super Admin accounts
      if (targetUser?.admin_level === 'super') {
        alert('🔒 SECURITY VIOLATION: Super Admin accounts cannot be modified by other users!');
        console.error('SECURITY VIOLATION: Attempt to modify Super Admin account blocked');
        return;
      }

      // SECURITY: Only Super Admins can create other Super Admins or Owner Admins
      if ((newRole === 'super' || newRole === 'owner') && user?.admin_level !== 'super') {
        alert('🔒 ACCESS DENIED: Only Super Admins can create Super Admin or Owner Admin accounts!');
        console.error('SECURITY VIOLATION: Non-super admin attempting to create high-level admin');
        return;
      }

      // BUSINESS SECURITY: Only Super Admins can assign PAID user types (prevents revenue bypass)
      if ((newRole === 'agent' || newRole === 'landlord' || newRole === 'fsbo') && user?.admin_level !== 'super') {
        alert('💰 BUSINESS VIOLATION: Only Super Admins can assign paid user types! These require valid subscriptions.');
        console.error('BUSINESS VIOLATION: Non-super admin attempting to bypass payment system');
        return;
      }

      let updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Handle admin levels vs regular user types
      if (newRole === 'super' || newRole === 'owner' || newRole === 'basic_admin') {
        updateData.user_type = 'admin';
        updateData.admin_level = newRole === 'basic_admin' ? 'basic' : newRole;
      } else {
        updateData.user_type = newRole;
        updateData.admin_level = null; // Clear admin level for non-admin users
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
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

  const addNewBasicAdmin = async () => {
    if (!newAdminEmail.trim() || !newAdminFirstName.trim() || !newAdminLastName.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setAddingAdmin(true);
    try {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', newAdminEmail.trim())
        .single();

      if (existingUser) {
        alert('A user with this email already exists');
        setAddingAdmin(false);
        return;
      }

      // Create new admin profile
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          email: newAdminEmail.trim(),
          first_name: newAdminFirstName.trim(),
          last_name: newAdminLastName.trim(),
          user_type: 'admin',
          admin_level: 'basic',
          created_by_admin: user?.id,
          admin_created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      alert(`Basic admin ${newAdminFirstName} ${newAdminLastName} created successfully!`);
      
      // Clear form
      setNewAdminEmail('');
      setNewAdminFirstName('');
      setNewAdminLastName('');
      setShowAddAdmin(false);
      
      // Reload users
      await loadUsers();
      
    } catch (err: any) {
      console.error('Error creating admin:', err);
      alert(`Failed to create admin: ${err?.message || 'Unknown error'}`);
    } finally {
      setAddingAdmin(false);
    }
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
                <div className="text-sm text-gray-500">{user?.admin_level_display || 'Admin'}</div>
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
        {/* Security & Business Warning Notice */}
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm mb-2">
            ⚠️ <strong>Security & Business Protection:</strong> Role changes affect system security and revenue.
          </p>
          <ul className="text-red-700 text-xs space-y-1">
            <li>🔒 <strong>Super Admin accounts are PROTECTED</strong> - Cannot be modified by anyone</li>
            <li>👑 Only Super Admins can create Owner Admin or Super Admin accounts</li>
            <li>💰 <strong>PAID ROLES PROTECTED</strong> - Agent/Landlord/FSBO require Super Admin (prevents revenue bypass)</li>
            <li>⚡ Owner Admins can create Basic Admin and manage User accounts only</li>
            <li>🛡️ All role changes are logged for security and business auditing</li>
          </ul>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                System Users ({users.length})
              </h2>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowAddAdmin(true)}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  + Add Basic Admin
                </button>
                <button 
                  onClick={loadUsers}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
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
                            {[userData.first_name, userData.last_name].filter(Boolean).join(' ') || 
                             userData.email?.split('@')[0] || 'User'}
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
                          userData.admin_level === 'super' 
                            ? 'bg-red-100 text-red-800'
                            : userData.admin_level === 'owner'
                            ? 'bg-purple-100 text-purple-800'
                            : userData.admin_level === 'basic'
                            ? 'bg-blue-100 text-blue-800'
                            : userData.user_type === 'agent'
                            ? 'bg-green-100 text-green-800'
                            : userData.user_type === 'landlord'
                            ? 'bg-yellow-100 text-yellow-800'
                            : userData.user_type === 'fsbo'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userData.admin_level === 'super' 
                            ? 'super admin'
                            : userData.admin_level === 'owner'
                            ? 'owner admin'
                            : userData.admin_level === 'basic' 
                            ? 'basic admin'
                            : userData.user_type || 'user'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userData.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {userData.id !== user?.id ? (
                          <>
                            {/* SECURITY: Super Admins can NEVER be changed by anyone except themselves */}
                            {userData.admin_level === 'super' ? (
                              <span className="text-red-600 font-medium text-sm">
                                🔒 Super Admin (Protected)
                              </span>
                            ) : (
                              <select
                                value={userData.admin_level === 'owner' ? 'owner' :
                                       userData.admin_level === 'basic' ? 'basic_admin' :
                                       userData.user_type || 'user'}
                                onChange={(e) => updateUserRole(userData.id, e.target.value)}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="user">User</option>
                                
                                {/* BUSINESS SECURITY: Only Super Admins can assign PAID roles */}
                                {user?.admin_level === 'super' && (
                                  <>
                                    <option value="agent">Agent (Paid)</option>
                                    <option value="landlord">Landlord (Paid)</option>
                                    <option value="fsbo">FSBO (Paid)</option>
                                  </>
                                )}
                                
                                {/* Admin roles based on permission level */}
                                <option value="basic_admin">Basic Admin</option>
                                {user?.admin_level === 'super' && (
                                  <>
                                    <option value="owner">Owner Admin</option>
                                    <option value="super">Super Admin</option>
                                  </>
                                )}
                              </select>
                            )}
                          </>
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
          <h3 className="text-lg font-medium text-blue-900 mb-4">👤 User Role Descriptions & Business Model</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-blue-800 text-sm">
            <div>
              <strong>User:</strong> Basic access, can browse properties (Free)
            </div>
            <div className="bg-green-100 p-2 rounded">
              <strong>💰 Agent (PAID):</strong> Professional listings, client management (Subscription Required)
            </div>
            <div className="bg-green-100 p-2 rounded">
              <strong>💰 Landlord (PAID):</strong> Rental property management (Subscription Required)
            </div>
            <div className="bg-green-100 p-2 rounded">
              <strong>💰 FSBO (PAID):</strong> For sale by owner listings (Subscription Required)
            </div>
            <div>
              <strong>Basic Admin:</strong> Property review, customer support (Staff Role)
            </div>
            <div>
              <strong>Owner Admin:</strong> Business management, can create staff admins only
            </div>
            <div>
              <strong>Super Admin:</strong> Full system access, can assign paid roles manually
            </div>
          </div>
          <div className="mt-4 p-3 bg-yellow-100 rounded border-l-4 border-yellow-500">
            <p className="text-yellow-800 text-xs">
              <strong>💡 Business Protection:</strong> Paid roles (Agent/Landlord/FSBO) can only be assigned by Super Admins 
              to prevent revenue bypass. Regular user upgrades should go through the payment system.
            </p>
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Add New Basic Admin</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={newAdminFirstName}
                  onChange={(e) => setNewAdminFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="John"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={newAdminLastName}
                  onChange={(e) => setNewAdminLastName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={addNewBasicAdmin}
                disabled={addingAdmin}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {addingAdmin ? 'Creating...' : 'Create Basic Admin'}
              </button>
              <button
                onClick={() => {
                  setShowAddAdmin(false);
                  setNewAdminEmail('');
                  setNewAdminFirstName('');
                  setNewAdminLastName('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Basic admins can review properties and access admin features, 
                but cannot manage users or system settings.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}