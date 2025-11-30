'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';

interface User {
  id: string;
  account_code: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  user_type: string;
  country_id: string;
  subscription_status: string;
  is_suspended: boolean;
  suspended_at?: string;
  suspension_reason?: string;
  suspended_by?: string;
  created_at: string;
  phone?: string;
  company?: string;
  property_count?: number;
  last_payment_date?: string;
  payment_status?: string;
}

interface AdminUserManagementProps {
  adminUserId: string;
  permissions: {
    canViewAllCountries: boolean;
    countryFilter: string | null;
    canManageUsers: boolean;
  };
}

const AdminUserManagement: React.FC<AdminUserManagementProps> = ({
  adminUserId,
  permissions
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'suspended' | 'payment_issues'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  const supabase = createClient();

  // CRITICAL SECURITY: Super Admin Protection
  const SUPER_ADMIN_EMAIL = 'mrdarrenbuckner@gmail.com';
  
  const isSuperAdmin = (userEmail: string): boolean => {
    return userEmail?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
  };

  useEffect(() => {
    loadUsers();
  }, [permissions]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('profiles')
        .select(`
          id,
          account_code,
          email,
          first_name,
          last_name,
          display_name,
          user_type,
          country_id,
          subscription_status,
          is_suspended,
          suspended_at,
          suspension_reason,
          suspended_by,
          created_at,
          phone,
          company
        `)
        .in('user_type', ['agent', 'landlord', 'fsbo']) // Only regular users, not admins
        .neq('id', adminUserId) // Exclude current admin
        .order('created_at', { ascending: false });

      // Apply country filter for Owner Admins
      if (!permissions.canViewAllCountries && permissions.countryFilter) {
        query = query.eq('country_id', permissions.countryFilter);
      }

      const { data: profiles, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Get property counts for each user
      const usersWithCounts = await Promise.all(
        (profiles || []).map(async (user: any) => {
          const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Get last payment date (mock for now - you'll need to implement based on your payment tracking)
          const lastPaymentDate = user.subscription_status === 'active' 
            ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
            : null;

          return {
            ...user,
            property_count: count || 0,
            last_payment_date: lastPaymentDate,
            payment_status: user.subscription_status === 'active' ? 'current' : 'overdue'
          };
        })
      );

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Apply search filter (account code, name, email)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.account_code?.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(search) ||
        user.display_name?.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    switch (filterStatus) {
      case 'active':
        filtered = filtered.filter(user => !user.is_suspended && user.subscription_status === 'active');
        break;
      case 'suspended':
        filtered = filtered.filter(user => user.is_suspended);
        break;
      case 'payment_issues':
        filtered = filtered.filter(user => user.subscription_status !== 'active' || user.payment_status === 'overdue');
        break;
    }

    setFilteredUsers(filtered);
  };

  const handleSuspendUser = async (user: User) => {
    // CRITICAL SECURITY: Block suspension of Super Admin accounts
    if (isSuperAdmin(user.email)) {
      alert('🔒 SECURITY BLOCK: Super Admin accounts cannot be suspended by any user!\n\nThis is a critical security protection that prevents system lockout.');
      console.error('SECURITY VIOLATION: Attempt to suspend Super Admin account blocked', {
        targetEmail: user.email,
        adminUserId: adminUserId,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    setSelectedUser(user);
    setShowSuspensionModal(true);
  };

  const confirmSuspension = async () => {
    if (!selectedUser || !suspensionReason.trim()) return;

    // DOUBLE-CHECK SECURITY: Block suspension of Super Admin accounts
    if (isSuperAdmin(selectedUser.email)) {
      alert('🔒 CRITICAL SECURITY ERROR: Super Admin accounts cannot be suspended!\n\nThis operation is blocked for system security.');
      console.error('CRITICAL SECURITY VIOLATION: Attempted Super Admin suspension in confirmSuspension', {
        targetEmail: selectedUser.email,
        adminUserId: adminUserId,
        timestamp: new Date().toISOString()
      });
      setShowSuspensionModal(false);
      setSelectedUser(null);
      setSuspensionReason('');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: true,
          suspended_at: new Date().toISOString(),
          suspension_reason: suspensionReason.trim(),
          suspended_by: adminUserId
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id 
          ? { 
              ...user, 
              is_suspended: true, 
              suspended_at: new Date().toISOString(),
              suspension_reason: suspensionReason.trim(),
              suspended_by: adminUserId 
            }
          : user
      ));

      setShowSuspensionModal(false);
      setSelectedUser(null);
      setSuspensionReason('');
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Failed to suspend user. Please try again.');
    }
  };

  const handleActivateSubscription = async (userId: string) => {
    if (!confirm('Are you sure you want to activate this user\'s subscription?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active'
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, subscription_status: 'active', payment_status: 'current' }
          : user
      ));

      alert('✅ User subscription activated successfully!');
    } catch (error) {
      console.error('Error activating subscription:', error);
      alert('Failed to activate subscription. Please try again.');
    }
  };

  const handleDeactivateSubscription = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user\'s subscription?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'inactive'
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, subscription_status: 'inactive', payment_status: 'overdue' }
          : user
      ));

      alert('✅ User subscription deactivated successfully!');
    } catch (error) {
      console.error('Error deactivating subscription:', error);
      alert('Failed to deactivate subscription. Please try again.');
    }
  };

  const handleReactivateUser = async (userId: string) => {
    if (!confirm('Are you sure you want to reactivate this user account?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_suspended: false,
          suspended_at: null,
          suspension_reason: null,
          suspended_by: null
        })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              is_suspended: false, 
              suspended_at: undefined,
              suspension_reason: undefined,
              suspended_by: undefined 
            }
          : user
      ));
    } catch (error) {
      console.error('Error reactivating user:', error);
      alert('Failed to reactivate user. Please try again.');
    }
  };

  const handleDeleteUser = async (user: User) => {
    // CRITICAL SECURITY: Block deletion of Super Admin accounts
    if (isSuperAdmin(user.email)) {
      alert('🔒 SECURITY BLOCK: Super Admin accounts cannot be deleted by any user!\n\nThis is a critical security protection that prevents system lockout.');
      console.error('SECURITY VIOLATION: Attempt to delete Super Admin account blocked', {
        targetEmail: user.email,
        adminUserId: adminUserId,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeletion = async () => {
    if (!selectedUser || deleteConfirmation !== 'DELETE') return;

    // DOUBLE-CHECK SECURITY: Block deletion of Super Admin accounts
    if (isSuperAdmin(selectedUser.email)) {
      alert('🔒 CRITICAL SECURITY ERROR: Super Admin accounts cannot be deleted!\n\nThis operation is blocked for system security.');
      console.error('CRITICAL SECURITY VIOLATION: Attempted Super Admin deletion in confirmDeletion', {
        targetEmail: selectedUser.email,
        adminUserId: adminUserId,
        timestamp: new Date().toISOString()
      });
      setShowDeleteModal(false);
      setSelectedUser(null);
      setDeleteConfirmation('');
      return;
    }

    try {
      // Call the DELETE API endpoint that handles both Auth and Profile deletion
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete user');
      }

      // Remove from local state
      setUsers(prev => prev.filter(user => user.id !== selectedUser.id));

      setShowDeleteModal(false);
      setSelectedUser(null);
      setDeleteConfirmation('');

      alert(`✅ User ${selectedUser.first_name} ${selectedUser.last_name} has been permanently deleted.\n\n${result.wasFoundingAgent ? '🏆 Founding agent counter has been decremented.' : ''}\n\n⚠️ Email address is now available for reuse.`);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(`Failed to delete user: ${error}`);
    }
  };

  const getUserTypeDisplay = (userType: string) => {
    const types: { [key: string]: { label: string; icon: string; color: string } } = {
      'agent': { label: 'Real Estate Agent', icon: '🏢', color: 'bg-blue-100 text-blue-800' },
      'landlord': { label: 'Landlord', icon: '🏠', color: 'bg-green-100 text-green-800' },
      'owner': { label: 'FSBO Owner', icon: '👤', color: 'bg-purple-100 text-purple-800' },
      'admin': { label: 'Administrator', icon: '⚖️', color: 'bg-orange-100 text-orange-800' }
    };
    return types[userType] || { label: userType, icon: '❓', color: 'bg-gray-100 text-gray-800' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">
          Manage user accounts, track payments, and handle suspensions
          {!permissions.canViewAllCountries && permissions.countryFilter && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              {permissions.countryFilter} Region Only
            </span>
          )}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by account code, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="payment_issues">Payment Issues</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => !u.is_suspended && u.subscription_status === 'active').length}
          </div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => u.is_suspended).length}
          </div>
          <div className="text-sm text-gray-600">Suspended</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">
            {users.filter(u => u.payment_status === 'overdue').length}
          </div>
          <div className="text-sm text-gray-600">Payment Issues</div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => {
          const userTypeInfo = getUserTypeDisplay(user.user_type);

          return (
            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-blue-600">
                          {user.account_code || 'No Code'}
                        </span>
                        {isSuperAdmin(user.email) && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-300">
                            🛡️ SUPER ADMIN - PROTECTED
                          </span>
                        )}
                        {user.is_suspended && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            SUSPENDED
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {user.display_name || `${user.first_name} ${user.last_name}`}
                        </h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-gray-600">📱 {user.phone}</p>
                        )}
                      </div>

                      <div>
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${userTypeInfo.color}`}>
                          <span className="mr-1">{userTypeInfo.icon}</span>
                          {userTypeInfo.label}
                        </div>
                        <p className="text-sm text-gray-600">
                          🏴 {user.country_id || 'No Country'}
                        </p>
                        <p className="text-sm text-gray-600">
                          🏠 {user.property_count} Properties
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Status: <span className={`font-medium ${
                            user.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {user.subscription_status?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </p>
                        {user.last_payment_date && (
                          <p className="text-sm text-gray-600">
                            Last Payment: {new Date(user.last_payment_date).toLocaleDateString()}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {user.is_suspended && user.suspension_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Suspension Reason:</strong> {user.suspension_reason}
                        </p>
                        {user.suspended_at && (
                          <p className="text-xs text-red-600 mt-1">
                            Suspended on {new Date(user.suspended_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    {isSuperAdmin(user.email) ? (
                      <div className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm text-center border-2 border-dashed border-gray-300">
                        🛡️ Protected Account
                      </div>
                    ) : user.is_suspended ? (
                      <button
                        onClick={() => handleReactivateUser(user.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        ✅ Reactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSuspendUser(user)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        🚫 Suspend
                      </button>
                    )}

                    {/* Subscription Status Controls */}
                    {!isSuperAdmin(user.email) && (
                      user.subscription_status === 'active' ? (
                        <button
                          onClick={() => handleDeactivateSubscription(user.id)}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        >
                          ⏸️ Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateSubscription(user.id)}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                        >
                          ▶️ Activate
                        </button>
                      )
                    )}
                    
                    <button
                      onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      📧 Email
                    </button>

                    {/* DANGER ZONE: Delete User */}
                    {!isSuperAdmin(user.email) && permissions.canManageUsers && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        className="px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-900 transition-colors text-sm border-2 border-red-600"
                        title="⚠️ PERMANENT DELETION - Use extreme caution"
                      >
                        🗑️ DELETE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-600">
            {searchTerm 
              ? `No users match "${searchTerm}"`
              : 'No users match the selected filters'
            }
          </p>
        </div>
      )}

      {/* Suspension Modal */}
      {showSuspensionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Suspend User Account
            </h3>
            <p className="text-gray-600 mb-4">
              You are about to suspend <strong>{selectedUser.display_name || `${selectedUser.first_name} ${selectedUser.last_name}`}</strong> ({selectedUser.account_code}).
            </p>
            <p className="text-sm text-gray-500 mb-4">
              This will block their dashboard access and redirect their contact information to admin.
            </p>
            
            <textarea
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              placeholder="Please provide a reason for suspension..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              rows={3}
              required
            />
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowSuspensionModal(false);
                  setSelectedUser(null);
                  setSuspensionReason('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmSuspension}
                disabled={!suspensionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DANGER: Delete User Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto border-4 border-red-600">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-2xl font-bold text-red-900 mb-2">
                DANGER: PERMANENT USER DELETION
              </h3>
              <p className="text-red-700 font-medium">
                This action CANNOT be undone!
              </p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-red-900 mb-2">You are about to PERMANENTLY DELETE:</h4>
              <div className="text-red-800 text-sm">
                <p><strong>Name:</strong> {selectedUser.display_name || `${selectedUser.first_name} ${selectedUser.last_name}`}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Account:</strong> {selectedUser.account_code}</p>
                <p><strong>User Type:</strong> {selectedUser.user_type}</p>
                <p><strong>Properties:</strong> {selectedUser.property_count} listings</p>
                <p><strong>Status:</strong> {selectedUser.subscription_status}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-900 mb-2">🔥 What will be deleted:</h4>
              <ul className="text-yellow-800 text-sm space-y-1">
                <li>✅ User account from Supabase Auth (email becomes reusable)</li>
                <li>✅ Profile data and settings</li>
                <li>✅ All property listings and media</li>
                <li>✅ Payment and subscription history</li>
                <li>✅ Founding agent status (if applicable - counter decrements)</li>
                <li>❌ <strong>This CANNOT be recovered!</strong></li>
              </ul>
            </div>

            {selectedUser.user_type === 'agent' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">🏆 Founding Agent Check:</h4>
                <p className="text-blue-800 text-sm">
                  If this agent used the FOUNDERS-AGENT-GY code, deleting them will automatically decrement the founding agent counter, making that spot available again for testing.
                </p>
              </div>
            )}
            
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
                  setSelectedUser(null);
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
    </div>
  );
};

export default AdminUserManagement;