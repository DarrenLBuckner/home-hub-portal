"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from '@/supabase';
import { checkAdminAccessWithClient, redirectToAdminLogin } from '@/lib/auth/adminCheck';
import { getClientPermissions, ClientPermissions, createPermissionChecker } from '@/lib/auth/permissions';

interface PendingUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  created_at: string;
  phone: string;
  approval_status?: string;
  rejection_reason?: string;
}

interface ApprovalModalData {
  userId: string;
  userName: string;
  action: 'approve' | 'reject';
}

export default function UserApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<ApprovalModalData | null>(null);
  const [showRoleModal, setShowRoleModal] = useState<{userId: string, userName: string, currentRole: string} | null>(null);
  const [newRole, setNewRole] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState<ClientPermissions | null>(null);

  // Display mapping for user types
  const displayUserType = (dbValue: string) => {
    const map: { [key: string]: string } = {
      'owner': 'FSBO',
      'agent': 'Agent',
      'landlord': 'Landlord'
    };
    return map[dbValue] || dbValue;
  };

  useEffect(() => {
    async function checkAdminAndLoad() {
      // Check admin access
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        redirectToAdminLogin();
        return;
      }

      const isAdmin = await checkAdminAccessWithClient(supabase, authUser.id);
      
      if (!isAdmin) {
        redirectToAdminLogin();
        return;
      }

      // Load user permissions
      const userPermissions = await getClientPermissions(authUser.id);
      setPermissions(userPermissions);

      await loadPendingUsers();
      setLoading(false);
    }

    checkAdminAndLoad();
  }, []);

  async function loadPendingUsers() {
    try {
      // Get all users with pending approval status
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          user_type,
          phone,
          created_at
        `)
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading pending users:', error);
        setError('Failed to load pending users');
        return;
      }

      // Get email addresses from auth.users
      const userIds = data?.map((user: any) => user.id) || [];
      const emailPromises = userIds.map(async (id: string) => {
        const { data: { user } } = await supabase.auth.admin.getUserById(id);
        return { id, email: user?.email || '' };
      });

      const emailData = await Promise.all(emailPromises);
      const emailMap = Object.fromEntries(emailData.map(item => [item.id, item.email]));

      const usersWithEmails = data?.map((user: any) => ({
        ...user,
        email: emailMap[user.id] || ''
      })) || [];

      setPendingUsers(usersWithEmails);
    } catch (error) {
      console.error('Error loading pending users:', error);
      setError('Failed to load pending users');
    }
  }

  function openApprovalModal(userId: string, userName: string, action: 'approve' | 'reject') {
    setShowModal({ userId, userName, action });
    setNotes('');
    setRejectionReason('');
    setError('');
  }

  function closeModal() {
    setShowModal(null);
    setNotes('');
    setRejectionReason('');
    setError('');
  }

  function openRoleModal(userId: string, userName: string, currentRole: string) {
    setShowRoleModal({ userId, userName, currentRole });
    setNewRole(currentRole);
    setError('');
  }

  function closeRoleModal() {
    setShowRoleModal(null);
    setNewRole('');
    setError('');
  }

  async function handleApprovalSubmit() {
    if (!showModal) return;

    if (showModal.action === 'reject' && !rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setProcessingUserId(showModal.userId);
    setError('');

    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: showModal.userId,
          action: showModal.action,
          reason: showModal.action === 'reject' ? rejectionReason : null,
          notes: notes || null
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process approval');
      }

      // Remove the processed user from the list
      setPendingUsers(prev => prev.filter(user => user.id !== showModal.userId));
      closeModal();
    } catch (error) {
      console.error('Error processing approval:', error);
      setError(error instanceof Error ? error.message : 'Failed to process approval');
    } finally {
      setProcessingUserId(null);
    }
  }

  async function handleRoleChange() {
    if (!showRoleModal || !newRole) return;

    setProcessingUserId(showRoleModal.userId);
    setError('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newRole })
        .eq('id', showRoleModal.userId);

      if (error) {
        throw new Error(error.message);
      }

      // Update the user in the local state
      setPendingUsers(prev => 
        prev.map(user => 
          user.id === showRoleModal.userId 
            ? { ...user, user_type: newRole }
            : user
        )
      );

      closeRoleModal();
    } catch (error) {
      console.error('Error changing user role:', error);
      setError(error instanceof Error ? error.message : 'Failed to change user role');
    } finally {
      setProcessingUserId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pending users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Approvals</h1>
                <p className="mt-2 text-gray-600">Review and approve new user registrations</p>
              </div>
              <Link 
                href="/admin-dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Pending User Approvals ({pendingUsers.length})
            </h2>
          </div>

          {pendingUsers.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">✓</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Approvals</h3>
              <p className="text-gray-600">All users have been reviewed and processed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {displayUserType(user.user_type)}
                          </span>
                          {permissions?.canChangeUserRoles && (
                            <button
                              onClick={() => openRoleModal(user.id, `${user.first_name} ${user.last_name}`, user.user_type)}
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              Change
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openApprovalModal(user.id, `${user.first_name} ${user.last_name}`, 'approve')}
                            disabled={processingUserId === user.id}
                            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {processingUserId === user.id ? 'Processing...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => openApprovalModal(user.id, `${user.first_name} ${user.last_name}`, 'reject')}
                            disabled={processingUserId === user.id}
                            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approval/Rejection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {showModal.action === 'approve' ? 'Approve User' : 'Reject User'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {showModal.action === 'approve' 
                  ? `Are you sure you want to approve ${showModal.userName}?`
                  : `Are you sure you want to reject ${showModal.userName}?`
                }
              </p>

              {showModal.action === 'reject' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                  placeholder="Add any additional notes..."
                />
              </div>

              {error && (
                <div className="mb-4 text-red-600 text-sm">{error}</div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprovalSubmit}
                  disabled={processingUserId === showModal.userId}
                  className={`px-4 py-2 text-sm text-white rounded transition-colors disabled:opacity-50 ${
                    showModal.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processingUserId === showModal.userId 
                    ? 'Processing...' 
                    : showModal.action === 'approve' ? 'Approve' : 'Reject'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {showRoleModal && permissions?.canChangeUserRoles && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Change User Role
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Change role for: <strong>{showRoleModal.userName}</strong>
              </p>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select New Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="owner">FSBO (Owner)</option>
                  <option value="agent">Agent</option>
                  <option value="landlord">Landlord</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Current role: {displayUserType(showRoleModal.currentRole)}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>Warning:</strong> Changing user roles affects their permissions and access levels. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeRoleModal}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRoleChange}
                  disabled={processingUserId === showRoleModal.userId || !newRole || newRole === showRoleModal.currentRole}
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {processingUserId === showRoleModal.userId ? 'Changing...' : 'Change Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}