'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/supabase';
import { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  user_type: string;
  property_limit: number | null;
  country_id: string;
  created_at: string;
  _property_count?: number;
}

interface LimitUpdate {
  user_id: string;
  old_limit: number | null;
  new_limit: number | null;
  updated_by: string;
  updated_at: string;
  reason: string;
  profiles?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export default function PropertyLimitsAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [isSuper, setIsSuper] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newLimit, setNewLimit] = useState<string>('');
  const [reason, setReason] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [recentUpdates, setRecentUpdates] = useState<LimitUpdate[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const supabase = createClient();

  // Super admin emails (match the ADMIN_REGISTRY in API)
  const SUPER_ADMINS = ['mrdarrenbuckner@gmail.com']; // Only super admins can access this interface

  useEffect(() => {
    checkAuth();
    loadRecentUpdates();
  }, []);

  async function checkAuth() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (!user) {
        window.location.href = '/auth/signin';
        return;
      }

      setUser(user);
      
      // Check if user is super admin
      const isSuper = SUPER_ADMINS.includes(user.email?.toLowerCase() || '');
      setIsSuper(isSuper);
      
      if (!isSuper) {
        setMessage({type: 'error', text: 'Access denied. Super admin privileges required.'});
      }
    } catch (error) {
      console.error('Auth error:', error);
      setMessage({type: 'error', text: 'Authentication failed'});
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers() {
    if (!searchTerm.trim() || !isSuper) return;
    
    setSearchLoading(true);
    try {
      // Search by email or name
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`email.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`)
        .limit(20);

      if (error) throw error;

      // Get property counts for each user
      const usersWithCounts = await Promise.all(
        data.map(async (profile: UserProfile) => {
          const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .in('status', ['active', 'pending', 'draft']);
          
          return { ...profile, _property_count: count || 0 };
        })
      );

      setUsers(usersWithCounts);
    } catch (error) {
      console.error('Search error:', error);
      setMessage({type: 'error', text: 'Failed to search users'});
    } finally {
      setSearchLoading(false);
    }
  }

  async function updatePropertyLimit() {
    if (!selectedUser || !isSuper || !reason.trim()) return;

    const parsedLimit = newLimit.trim() === '' ? null : parseInt(newLimit);
    if (newLimit.trim() !== '' && (isNaN(parsedLimit!) || parsedLimit! < 0)) {
      setMessage({type: 'error', text: 'Invalid limit value'});
      return;
    }

    setUpdateLoading(true);
    try {
      // Update the user's property limit
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ property_limit: parsedLimit })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      // Log the change
      const { error: logError } = await supabase
        .from('admin_property_limit_updates')
        .insert({
          user_id: selectedUser.id,
          old_limit: selectedUser.property_limit,
          new_limit: parsedLimit,
          updated_by: user?.email,
          reason: reason.trim()
        });

      if (logError) {
        console.error('Failed to log update:', logError);
        // Don't fail the whole operation for logging error
      }

      setMessage({type: 'success', text: `Property limit updated successfully for ${selectedUser.email}`});
      setSelectedUser(null);
      setNewLimit('');
      setReason('');
      
      // Refresh recent updates
      loadRecentUpdates();
      
      // Refresh user data if still in search results
      if (users.length > 0) {
        searchUsers();
      }
    } catch (error) {
      console.error('Update error:', error);
      setMessage({type: 'error', text: 'Failed to update property limit'});
    } finally {
      setUpdateLoading(false);
    }
  }

  async function loadRecentUpdates() {
    if (!isSuper) return;
    
    try {
      const { data, error } = await supabase
        .from('admin_property_limit_updates')
        .select(`
          *,
          profiles!inner(email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentUpdates(data || []);
    } catch (error) {
      console.error('Failed to load recent updates:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isSuper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Super admin privileges required to access this page.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-4xl mr-3">⚙️</span>
            Super Admin: Property Limits Management
          </h1>

          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 border border-green-400 text-green-700' 
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Search Users Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔍 Search Users</h2>
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                placeholder="Search by email, first name, or last name..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                onClick={searchUsers}
                disabled={searchLoading || !searchTerm.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-3 text-left">User</th>
                      <th className="border border-gray-200 px-4 py-3 text-left">Type</th>
                      <th className="border border-gray-200 px-4 py-3 text-left">Current Limit</th>
                      <th className="border border-gray-200 px-4 py-3 text-left">Properties</th>
                      <th className="border border-gray-200 px-4 py-3 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3">
                          <div>
                            <div className="font-medium">{user.email}</div>
                            <div className="text-sm text-gray-600">
                              {user.first_name} {user.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.user_type === 'admin' ? 'bg-purple-100 text-purple-800' :
                            user.user_type === 'agent' ? 'bg-blue-100 text-blue-800' :
                            user.user_type === 'landlord' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.user_type}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <span className="font-mono text-lg">
                            {user.property_limit === null ? '∞' : user.property_limit}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <span className="font-medium">{user._property_count}</span>
                          {user.property_limit !== null && (
                            <span className="text-sm text-gray-600">
                              /{user.property_limit}
                            </span>
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                          >
                            Edit Limit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Edit Limit Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Edit Property Limit
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">User:</p>
                  <p className="font-medium">{selectedUser.email}</p>
                  <p className="text-sm text-gray-600">
                    {selectedUser.first_name} {selectedUser.last_name} ({selectedUser.user_type})
                  </p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-1">Current: 
                    <span className="font-mono ml-2">
                      {selectedUser.property_limit === null ? '∞' : selectedUser.property_limit}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">Active Properties: {selectedUser._property_count}</p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Limit:
                  </label>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={(e) => setNewLimit(e.target.value)}
                    placeholder="Enter number or leave empty for unlimited"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for unlimited (∞)
                  </p>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Change: *
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Enter reason for this change..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={updatePropertyLimit}
                    disabled={updateLoading || !reason.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {updateLoading ? 'Updating...' : 'Update Limit'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setNewLimit('');
                      setReason('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recent Updates Section */}
          {recentUpdates.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Recent Updates</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-3 text-left">Date</th>
                      <th className="border border-gray-200 px-4 py-3 text-left">User</th>
                      <th className="border border-gray-200 px-4 py-3 text-left">Change</th>
                      <th className="border border-gray-200 px-4 py-3 text-left">Updated By</th>
                      <th className="border border-gray-200 px-4 py-3 text-left">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUpdates.map((update, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          {new Date(update.updated_at).toLocaleDateString()} {new Date(update.updated_at).toLocaleTimeString()}
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="text-sm">
                            <div className="font-medium">{update.profiles?.email}</div>
                            <div className="text-gray-600">
                              {update.profiles?.first_name} {update.profiles?.last_name}
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <span className="font-mono text-sm">
                            {update.old_limit === null ? '∞' : update.old_limit} → {update.new_limit === null ? '∞' : update.new_limit}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          {update.updated_by}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-sm">
                          {update.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}