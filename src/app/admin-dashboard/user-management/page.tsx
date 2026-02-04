"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAdminData } from '@/hooks/useAdminData';
import DashboardHeader from '@/components/admin/DashboardHeader';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  admin_level?: string;
  created_at: string;
  updated_at: string;
  is_suspended?: boolean;
  suspended_at?: string;
  suspension_reason?: string;
  suspended_by?: string;
}

export default function UserManagement() {
  const router = useRouter();
  const { adminData, permissions, isAdmin, isLoading: adminLoading, error: adminError } = useAdminData();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState("");
  
  // User type filter (all, admin, agent, landlord, fsbo)
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'admin' | 'agent' | 'landlord' | 'fsbo'>('all');
  
  // Modal and creation state
  const [showAddUser, setShowAddUser] = useState(false);
  const [userTypeMode, setUserTypeMode] = useState<'admin' | 'regular'>('regular'); // Which type to create
  
  // Common fields
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserFirstName, setNewUserFirstName] = useState("");
  const [newUserLastName, setNewUserLastName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  
  // Admin-specific fields
  const [newAdminLevel, setNewAdminLevel] = useState("basic");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  
  // Regular user-specific fields
  const [newUserType, setNewUserType] = useState<'agent' | 'landlord' | 'fsbo'>('agent');
  const [newUserTerritory, setNewUserTerritory] = useState("");
  
  // Form submission state
  const [creatingUser, setCreatingUser] = useState(false);
  
  // Other modals
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  useEffect(() => {
    async function checkUserManagementAccess() {
      console.log('🔍 USER MANAGEMENT: Checking admin access...');
      
      if (adminLoading) {
        console.log('⏳ Admin data still loading...');
        return;
      }
      
      if (adminError) {
        console.error('❌ Admin data error:', adminError);
        alert('Error loading admin data. Please try again.');
        router.push('/admin-login');
        return;
      }
      
      if (!isAdmin) {
        console.log('❌ Not authorized for user management - not admin');
        alert('Access denied. Admin privileges required.');
        router.push('/admin-login');
        return;
      }
      
      if (!permissions?.canAccessUserManagement) {
        console.log('❌ Not authorized for user management - insufficient permissions');
        alert('Access denied. Insufficient permissions to manage users.');
        router.push('/admin-dashboard');
        return;
      }
      
      if (!adminData) {
        console.log('❌ Admin data not available');
        setError('Admin data not available. Please refresh the page.');
        return;
      }

      const displayName = [adminData.first_name, adminData.last_name]
        .filter(Boolean)
        .join(' ') || adminData.email?.split('@')[0] || 'User';
      
      const adminLevelDisplay = adminData.admin_level === 'super' 
        ? 'Super Admin'
        : adminData.admin_level === 'owner'
        ? 'Owner Admin' 
        : 'Admin';

      setUser({ 
        id: adminData.id,
        name: displayName,
        email: adminData.email,
        role: adminData.user_type,
        admin_level: adminData.admin_level,
        admin_level_display: adminLevelDisplay
      });

      await loadUsers();
      setLoading(false);
    }

    checkUserManagementAccess();
  }, [adminLoading, adminError, isAdmin, permissions, adminData]);

  async function loadUsers() {
    try {
      console.log('Loading all users (admins and regular users)...');
      
      // Load all users - both admins and regular users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .in('user_type', ['admin', 'agent', 'landlord', 'fsbo'])  // Load all relevant user types
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

  const createNewUser = async () => {
    // Validate common fields
    if (!newUserEmail.trim() || !newUserFirstName.trim() || !newUserLastName.trim()) {
      alert('Please fill in email, first name, and last name');
      return;
    }

    setCreatingUser(true);
    try {
      if (userTypeMode === 'admin') {
        // Create admin user
        if (!newAdminPassword) {
          alert('Please provide a temporary password');
          return;
        }

        if (newAdminPassword.length < 8) {
          alert('Password must be at least 8 characters');
          return;
        }

        // Validate admin level permissions
        if (newAdminLevel === 'super' && user?.admin_level !== 'super') {
          alert('🔒 ACCESS DENIED: Only Super Admins can create Super Admin accounts!');
          return;
        }

        if (newAdminLevel === 'owner' && user?.admin_level !== 'super' && user?.admin_level !== 'owner') {
          alert('🔒 ACCESS DENIED: Only Super Admins and Owner Admins can create Owner Admin accounts!');
          return;
        }

        const response = await fetch('/api/admin/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: newUserEmail.trim(),
            firstName: newUserFirstName.trim(),
            lastName: newUserLastName.trim(),
            password: newAdminPassword,
            adminLevel: newAdminLevel,
            countryId: adminData?.country_id || null
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create admin');
        }

        const levelNames: {[key: string]: string} = {
          'super': 'Super Admin',
          'owner': 'Owner Admin',
          'basic': 'Basic Admin'
        };

        alert(
          `✅ ${levelNames[newAdminLevel]} created successfully!\n\n` +
          `📧 Email: ${newUserEmail.trim()}\n` +
          `🔑 Password: ${newAdminPassword}\n` +
          `🏴 Country: ${result.admin?.countryId || 'Global'}\n\n` +
          `⚠️ Share these credentials with the new admin securely.\n` +
          `They can change their password after logging in.`
        );
      } else {
        // Create regular user (agent, landlord, FSBO)
        if (!newUserType) {
          alert('Please select a user type');
          return;
        }

        let territory = newUserTerritory;
        
        // Owner Admin can only assign to their own territory
        if (user?.admin_level === 'owner') {
          territory = adminData?.country_id;
          if (!territory) {
            alert('Cannot determine your country assignment. Please contact Super Admin.');
            return;
          }
        } else if (user?.admin_level === 'super') {
          // Super Admin must specify territory
          if (!territory) {
            alert('Please select a territory for this user');
            return;
          }
        } else {
          alert('Only Super Admin and Owner Admin can create regular users.');
          return;
        }


        // Get the current session to retrieve the access token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!session || !session.access_token) {
          throw new Error('Authorization required');
        }

        const response = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            email: newUserEmail.trim(),
            firstName: newUserFirstName.trim(),
            lastName: newUserLastName.trim(),
            phone: newUserPhone || null,
            userType: newUserType,
            territory: territory
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create user');
        }

        const typeNames: {[key: string]: string} = {
          'agent': 'Agent',
          'landlord': 'Landlord',
          'fsbo': 'FSBO'
        };

        alert(
          `✅ ${typeNames[newUserType]} created successfully!\n\n` +
          `📧 Email: ${newUserEmail.trim()}\n` +
          `🔑 Temporary Password: ${result.user.tempPassword}\n` +
          `🏴 Territory: ${territory}\n\n` +
          `⚠️ Share these credentials with the new user securely.\n` +
          `They can change their password after logging in.`
        );
      }

      // Clear form
      setNewUserEmail('');
      setNewUserFirstName('');
      setNewUserLastName('');
      setNewUserPhone('');
      setNewAdminLevel('basic');
      setNewAdminPassword('');
      setNewUserType('agent');
      setNewUserTerritory('');
      setShowAddUser(false);

      // Reload users list
      await loadUsers();

    } catch (err: any) {
      console.error('Error creating user:', err);
      alert(`Failed to create user: ${err?.message || 'Unknown error'}`);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSuspendAdmin = (admin: User) => {
    // CRITICAL SECURITY: Block suspension of Super Admin accounts
    if (admin.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert('🔒 SECURITY BLOCK: Super Admin accounts cannot be suspended by any user!\n\nThis is a critical security protection.');
      return;
    }
    
    setSelectedAdmin(admin);
    setShowSuspendModal(true);
  };

  const confirmSuspension = async () => {
    if (!selectedAdmin || !suspendReason.trim()) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspension_reason: suspendReason.trim(),
          suspended_by: user?.id
        })
        .eq('id', selectedAdmin.id);

      if (error) throw error;

      // Reload admins
      await loadUsers();
      
      setShowSuspendModal(false);
      setSelectedAdmin(null);
      setSuspendReason('');
      
      alert(`✅ Admin ${selectedAdmin.first_name} ${selectedAdmin.last_name} has been suspended.`);
    } catch (error) {
      console.error('Error suspending admin:', error);
      alert('Failed to suspend admin. Please try again.');
    }
  };

  const handleReactivateAdmin = async (adminId: string) => {
    if (!confirm('Are you sure you want to reactivate this admin account?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspended_at: null,
          suspension_reason: null,
          suspended_by: null
        })
        .eq('id', adminId);

      if (error) throw error;

      await loadUsers();
      alert('✅ Admin account reactivated successfully!');
    } catch (error) {
      console.error('Error reactivating admin:', error);
      alert('Failed to reactivate admin. Please try again.');
    }
  };

  const handleDeleteAdmin = (admin: User) => {
    // CRITICAL SECURITY: Block deletion of Super Admin accounts
    if (admin.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert('🔒 SECURITY BLOCK: Super Admin accounts cannot be deleted by any user!\n\nThis is a critical security protection.');
      return;
    }

    // Permission hierarchy check
    const currentAdminLevel = user?.admin_level;
    const targetAdminLevel = admin.admin_level;

    // Basic Admin cannot delete any other admin
    if (currentAdminLevel === 'basic') {
      alert('🔒 ACCESS DENIED: Basic Admins cannot delete other admin accounts.\n\nOnly Owner Admin and Super Admin can delete admin accounts.');
      return;
    }

    // Owner Admin cannot delete other Owner Admins or Super Admins
    if (currentAdminLevel === 'owner' && (targetAdminLevel === 'owner' || targetAdminLevel === 'super')) {
      alert('🔒 ACCESS DENIED: Owner Admins cannot delete other Owner Admin or Super Admin accounts.\n\nOnly Super Admin can delete these high-level accounts.');
      return;
    }

    // Only Super Admin can delete Super Admin accounts (already blocked above, but double check)
    if (targetAdminLevel === 'super' && currentAdminLevel !== 'super') {
      alert('🔒 ACCESS DENIED: Only Super Admin can delete Super Admin accounts.');
      return;
    }
    
    setSelectedAdmin(admin);
    setShowDeleteModal(true);
  };

  const confirmDeletion = async () => {
    if (!selectedAdmin || deleteConfirmation !== 'DELETE') return;

    // DOUBLE-CHECK SECURITY: All the same checks as above
    if (selectedAdmin.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      alert('🔒 CRITICAL SECURITY ERROR: Super Admin accounts cannot be deleted!');
      return;
    }

    try {
      // Call the DELETE API endpoint that handles both Auth and Profile deletion
      const response = await fetch(`/api/users/${selectedAdmin.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete admin');
      }

      // Remove from local state
      await loadUsers();

      setShowDeleteModal(false);
      setSelectedAdmin(null);
      setDeleteConfirmation('');

      alert(`✅ Admin ${selectedAdmin.first_name} ${selectedAdmin.last_name} has been permanently deleted.\n\n⚠️ Email address is now available for reuse.`);
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert(`Failed to delete admin: ${error}`);
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
      {/* Standardized Header with Back Button */}
      <DashboardHeader
        title="User Management"
        description="Create and manage user accounts (Admins, Agents, Landlords, FSBO)"
        icon="👥"
        actions={
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        }
        adminInfo={`Welcome, ${adminData?.email} • ${adminData?.admin_level || 'Admin'}`}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Security & Business Warning Notice */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm mb-2">
            ℹ️ <strong>User Creation Permissions:</strong>
          </p>
          <ul className="text-blue-700 text-xs space-y-1">
            <li>🛡️ <strong>Super Admin:</strong> Can create all user types (Admins, Agents, Landlords, FSBO) for any territory</li>
            <li>👑 <strong>Owner Admin:</strong> Can create Agents, Landlords, FSBO for their territory only</li>
            <li>⚙️ <strong>Basic Admin:</strong> Cannot create users (property review only)</li>
            <li>🔒 <strong>Super Admin accounts are PROTECTED</strong> - Cannot be modified by anyone</li>
            <li>💰 <strong>PAID ROLES PROTECTED</strong> - Agent/Landlord/FSBO accounts are created in pending approval status</li>
          </ul>
        </div>

        {/* Search Bar and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setUserTypeFilter('all')}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  userTypeFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Users ({users.length})
              </button>
              <button
                onClick={() => setUserTypeFilter('admin')}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  userTypeFilter === 'admin'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Admins ({users.filter(u => u.user_type === 'admin').length})
              </button>
              <button
                onClick={() => setUserTypeFilter('agent')}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  userTypeFilter === 'agent'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Agents ({users.filter(u => u.user_type === 'agent').length})
              </button>
              <button
                onClick={() => setUserTypeFilter('landlord')}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  userTypeFilter === 'landlord'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Landlords ({users.filter(u => u.user_type === 'landlord').length})
              </button>
              <button
                onClick={() => setUserTypeFilter('fsbo')}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  userTypeFilter === 'fsbo'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                FSBO ({users.filter(u => u.user_type === 'fsbo').length})
              </button>
              <button 
                onClick={loadUsers}
                className="ml-auto px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded-lg"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {userTypeFilter === 'all' ? 'All Users' : 
                 userTypeFilter === 'admin' ? 'Admin Accounts' :
                 userTypeFilter === 'agent' ? 'Agents' :
                 userTypeFilter === 'landlord' ? 'Landlords' :
                 'FSBO Users'} ({users.filter(user => {
                  if (userTypeFilter !== 'all' && user.user_type !== userTypeFilter) return false;
                  if (!searchTerm) return true;
                  const search = searchTerm.toLowerCase();
                  return user.email.toLowerCase().includes(search) ||
                         `${user.first_name} ${user.last_name}`.toLowerCase().includes(search);
                }).length})
              </h2>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowAddUser(true)}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                >
                  + Add User
                </button>
              </div>
            </div>
          </div>

          {users.filter(user => {
            if (userTypeFilter !== 'all' && user.user_type !== userTypeFilter) return false;
            if (!searchTerm) return true;
            const search = searchTerm.toLowerCase();
            return user.email.toLowerCase().includes(search) ||
                   `${user.first_name} ${user.last_name}`.toLowerCase().includes(search);
          }).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">
                {userTypeFilter === 'all' ? 'No users found' : `No ${userTypeFilter === 'admin' ? 'admin' : userTypeFilter} users found`}
              </h3>
              <p className="text-gray-500">Users will appear here when they are created.</p>
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
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
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
                  {users.filter(user => {
                    if (userTypeFilter !== 'all' && user.user_type !== userTypeFilter) return false;
                    if (!searchTerm) return true;
                    const search = searchTerm.toLowerCase();
                    return user.email.toLowerCase().includes(search) ||
                           `${user.first_name} ${user.last_name}`.toLowerCase().includes(search);
                  }).map((userData) => (
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
                          userData.user_type === 'admin'
                            ? 'bg-red-100 text-red-800'
                            : userData.user_type === 'agent'
                            ? 'bg-purple-100 text-purple-800'
                            : userData.user_type === 'landlord'
                            ? 'bg-green-100 text-green-800'
                            : userData.user_type === 'fsbo'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {userData.user_type === 'admin' ? 'Admin' :
                           userData.user_type === 'agent' ? 'Agent' :
                           userData.user_type === 'landlord' ? 'Landlord' :
                           userData.user_type === 'fsbo' ? 'FSBO' :
                           'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {userData.user_type === 'admin' && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              userData.admin_level === 'super' 
                                ? 'bg-red-100 text-red-800'
                                : userData.admin_level === 'owner'
                                ? 'bg-purple-100 text-purple-800'
                                : userData.admin_level === 'basic'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {userData.admin_level === 'super' 
                                ? 'Super Admin'
                                : userData.admin_level === 'owner'
                                ? 'Owner Admin'
                                : userData.admin_level === 'basic' 
                                ? 'Basic Admin'
                                : 'Admin'}
                            </span>
                          )}
                          {userData.is_suspended && (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              SUSPENDED
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(userData.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {userData.id !== user?.id ? (
                          <div className="flex space-x-2">
                            {/* SECURITY: Super Admins are PROTECTED */}
                            {userData.admin_level === 'super' ? (
                              <span className="text-red-600 font-medium text-sm px-3 py-2 bg-red-50 rounded">
                                🛡️ Protected
                              </span>
                            ) : (
                              <>
                                {userData.is_suspended ? (
                                  <button
                                    onClick={() => handleReactivateAdmin(userData.id)}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  >
                                    ✅ Reactivate
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleSuspendAdmin(userData)}
                                    className="px-3 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                                  >
                                    ⏸️ Suspend
                                  </button>
                                )}
                                <select
                                  value={userData.admin_level === 'owner' ? 'owner' :
                                         userData.admin_level === 'basic' ? 'basic_admin' :
                                         'basic_admin'}
                                  onChange={(e) => updateUserRole(userData.id, e.target.value)}
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                  disabled={userData.is_suspended}
                                >
                                  <option value="basic_admin">Basic Admin</option>
                                  {(user?.admin_level === 'super' || user?.admin_level === 'owner') && (
                                    <option value="owner">Owner Admin</option>
                                  )}
                                  {user?.admin_level === 'super' && (
                                    <option value="super">Super Admin</option>
                                  )}
                                </select>
                                
                                {/* DELETE BUTTON - With permission hierarchy */}
                                {(user?.admin_level === 'super' || 
                                  (user?.admin_level === 'owner' && userData.admin_level === 'basic') ||
                                  (user?.admin_level === 'owner' && !userData.admin_level)) && (
                                  <button
                                    onClick={() => handleDeleteAdmin(userData)}
                                    className="px-3 py-1 bg-red-800 text-white rounded text-xs hover:bg-red-900 border-2 border-red-600"
                                    title="⚠️ PERMANENT DELETION - Use extreme caution"
                                  >
                                    🗑️ DELETE
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm px-3 py-2 bg-gray-50 rounded">Current User</span>
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

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header with Tabs */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4">Add New User</h3>
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  onClick={() => setUserTypeMode('regular')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    userTypeMode === 'regular'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Regular User (Agent/Landlord/FSBO)
                </button>
                <button
                  onClick={() => setUserTypeMode('admin')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    userTypeMode === 'admin'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Admin User
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Common Fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number (optional)
                </label>
                <input
                  type="tel"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Admin-Specific Fields */}
              {userTypeMode === 'admin' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Level *
                    </label>
                    <select
                      value={newAdminLevel}
                      onChange={(e) => setNewAdminLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="basic">Basic Admin - Property review & basic admin tasks</option>
                      {(user?.admin_level === 'super' || user?.admin_level === 'owner') && (
                        <option value="owner">Owner Admin - Full country management</option>
                      )}
                      {user?.admin_level === 'super' && (
                        <option value="super">Super Admin - Global system access</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Temporary Password *
                    </label>
                    <input
                      type="password"
                      value={newAdminPassword}
                      onChange={(e) => setNewAdminPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="Min 8 characters"
                      minLength={8}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Share this password with the new admin. They can change it after first login.
                    </p>
                  </div>
                </>
              )}

              {/* Regular User-Specific Fields */}
              {userTypeMode === 'regular' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Type *
                    </label>
                    <select
                      value={newUserType}
                      onChange={(e) => setNewUserType(e.target.value as 'agent' | 'landlord' | 'fsbo')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="agent">Agent - Property listing professional</option>
                      <option value="landlord">Landlord - Property owner for rental</option>
                      <option value="fsbo">FSBO - For Sale By Owner</option>
                    </select>
                  </div>

                  {user?.admin_level === 'super' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Territory/Country *
                      </label>
                      <select
                        value={newUserTerritory}
                        onChange={(e) => setNewUserTerritory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a territory...</option>
                        <option value="GY">Guyana (GY)</option>
                        <option value="JM">Jamaica (JM)</option>
                        <option value="CO">Colombia (CO)</option>
                        <option value="US">United States (US)</option>
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex gap-3">
              <button
                onClick={createNewUser}
                disabled={creatingUser}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                {creatingUser ? 'Creating...' : `Create ${userTypeMode === 'admin' ? `${newAdminLevel} Admin` : `${newUserType}`}`}
              </button>
              <button
                onClick={() => {
                  setShowAddUser(false);
                  setNewUserEmail('');
                  setNewUserFirstName('');
                  setNewUserLastName('');
                  setNewUserPhone('');
                  setNewAdminLevel('basic');
                  setNewAdminPassword('');
                  setNewUserType('agent');
                  setNewUserTerritory('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border-t border-blue-200 p-4">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ About User Creation:</strong><br/>
                {userTypeMode === 'admin' ? (
                  <>• Admins are assigned to your country and can manage properties, users, and system settings<br/>
                  • A temporary password will be generated and must be shared securely</>
                ) : (
                  <>• Regular users are created in pending approval status<br/>
                  • A temporary password will be auto-generated and displayed after creation<br/>
                  • {user?.admin_level === 'owner' ? `Users will be assigned to your country (${adminData?.country_id})` : 'You can select any territory'}</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Admin Modal */}
      {showSuspendModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Suspend Admin Account
            </h3>
            <p className="text-gray-600 mb-4">
              You are about to suspend <strong>{selectedAdmin.first_name} {selectedAdmin.last_name}</strong> ({selectedAdmin.admin_level} admin).
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Important:</strong> Suspended admins will lose access to the admin dashboard but their account remains in the system.
              </p>
            </div>
            
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Please provide a reason for suspension..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
              rows={3}
              required
            />
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSelectedAdmin(null);
                  setSuspendReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSuspension}
                disabled={!suspendReason.trim()}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suspend Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DANGER: Delete Admin Modal */}
      {showDeleteModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 border-4 border-red-600">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-red-900 mb-2">
                DANGER: PERMANENT ADMIN DELETION
              </h3>
              <p className="text-red-700 font-medium">
                This action CANNOT be undone!
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-red-900 mb-2">You are about to PERMANENTLY DELETE:</h4>
              <div className="text-red-800 text-sm">
                <p><strong>Name:</strong> {selectedAdmin.first_name} {selectedAdmin.last_name}</p>
                <p><strong>Email:</strong> {selectedAdmin.email}</p>
                <p><strong>Admin Level:</strong> {selectedAdmin.admin_level || 'Basic'} Admin</p>
                <p><strong>Created:</strong> {new Date(selectedAdmin.created_at).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-900 mb-2">🔥 What will be deleted:</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>✅ Admin account from Supabase Auth (email becomes reusable)</li>
                <li>✅ All admin permissions and access rights</li>
                <li>✅ Profile data and settings</li>
                <li>✅ Account creation history</li>
                <li>❌ <strong>This CANNOT be recovered!</strong></li>
              </ul>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-orange-900 mb-2">🔒 Permission Check:</h4>
              <p className="text-orange-800 text-sm">
                <strong>Your Level:</strong> {user?.admin_level || 'Basic'} Admin<br/>
                <strong>Target Level:</strong> {selectedAdmin.admin_level || 'Basic'} Admin<br/>
                {user?.admin_level === 'super' ? (
                  <span className="text-green-800">✅ <strong>AUTHORIZED:</strong> Super Admin can delete any admin level</span>
                ) : user?.admin_level === 'owner' && (selectedAdmin.admin_level === 'basic' || !selectedAdmin.admin_level) ? (
                  <span className="text-green-800">✅ <strong>AUTHORIZED:</strong> Owner Admin can delete Basic Admin</span>
                ) : (
                  <span className="text-red-800">❌ <strong>UNAUTHORIZED:</strong> Insufficient permissions</span>
                )}
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="bg-red-100 px-2 py-1 rounded font-mono text-red-800">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedAdmin(null);
                  setDeleteConfirmation('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletion}
                disabled={deleteConfirmation !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                🗑️ PERMANENTLY DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}