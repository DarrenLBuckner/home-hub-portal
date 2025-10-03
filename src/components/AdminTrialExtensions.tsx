"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/supabase';

interface UserLimits {
  user_id: string;
  email: string;
  user_type: string;
  first_name: string;
  last_name: string;
  free_trial_end_date: string;
  is_trial_active: boolean;
  current_properties: number;
  max_free_properties: number;
  trial_extensions_count: number;
}

interface ExtensionResult {
  success: boolean;
  message: string;
  new_end_date: string;
}

export default function AdminTrialExtensions() {
  const [users, setUsers] = useState<UserLimits[]>([]);
  const [loading, setLoading] = useState(true);
  const [extending, setExtending] = useState<string | null>(null);
  const [extensionDays, setExtensionDays] = useState(60);
  const [extensionReason, setExtensionReason] = useState('Admin extension during company rollout');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Get users with their property limits
      const { data, error } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT 
              p.id as user_id,
              p.email,
              p.user_type,
              p.first_name,
              p.last_name,
              COALESCE(upl.free_trial_end_date, NOW() + INTERVAL '60 days') as free_trial_end_date,
              COALESCE(upl.is_trial_active, true) as is_trial_active,
              COALESCE(upl.current_free_properties, 0) as current_properties,
              COALESCE(upl.max_free_properties, 
                CASE 
                  WHEN p.user_type IN ('fsbo', 'landlord') THEN 1
                  ELSE 10
                END
              ) as max_free_properties,
              COALESCE(upl.trial_extensions_count, 0) as trial_extensions_count
            FROM profiles p
            LEFT JOIN user_property_limits upl ON p.id = upl.user_id
            WHERE p.user_type IN ('agent', 'landlord', 'fsbo')
            AND p.email NOT IN ('mrdarrenbuckner@gmail.com', 'qumar@guyanahomehub.com', 'Qumar@guyanahomehub.com')
            ORDER BY p.email;
          `
        });

      if (error) {
        console.error('Error fetching users:', error);
        setMessage({ type: 'error', text: 'Failed to load users' });
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const extendTrial = async (userId: string) => {
    setExtending(userId);
    setMessage(null);

    try {
      // Get current user (admin)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        setMessage({ type: 'error', text: 'You must be logged in' });
        return;
      }

      // Call the extension function
      const { data, error } = await supabase
        .rpc('extend_user_trial', {
          target_user_id: userId,
          admin_user_id: currentUser.id,
          extension_days: extensionDays,
          reason: extensionReason
        });

      if (error) {
        console.error('Extension error:', error);
        setMessage({ type: 'error', text: `Failed to extend trial: ${error.message}` });
      } else {
        const result = data?.[0] as ExtensionResult;
        if (result?.success) {
          setMessage({ type: 'success', text: result.message });
          fetchUsers(); // Refresh the list
        } else {
          setMessage({ type: 'error', text: result?.message || 'Extension failed' });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Failed to extend trial' });
    } finally {
      setExtending(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isTrialExpired = (endDate: string) => {
    return new Date(endDate) < new Date();
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  };

  if (loading) {
    return <div className="p-6">Loading users...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Admin Trial Extensions</h1>
        <p className="text-gray-600">
          Extend free trial periods for users during company rollout. 
          Owner and Super Admins can extend trials as many times as necessary.
        </p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Extension Settings */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">Extension Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Extension Days</label>
            <input
              type="number"
              value={extensionDays}
              onChange={(e) => setExtensionDays(parseInt(e.target.value) || 60)}
              className="w-full p-2 border rounded-lg"
              min="1"
              max="365"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <input
              type="text"
              value={extensionReason}
              onChange={(e) => setExtensionReason(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Reason for extension"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">User</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Properties</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trial Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trial End Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Extensions</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.user_type === 'landlord' ? 'bg-blue-100 text-blue-800' :
                    user.user_type === 'fsbo' ? 'bg-purple-100 text-purple-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {user.user_type.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm">
                    {user.current_properties}/{user.max_free_properties}
                    {user.user_type === 'landlord' && (
                      <div className="text-xs text-blue-600">Landlord: 1 property limit</div>
                    )}
                    {user.user_type === 'fsbo' && (
                      <div className="text-xs text-purple-600">FSBO: 1 property limit</div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {user.is_trial_active ? (
                    <div>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        isTrialExpired(user.free_trial_end_date) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {isTrialExpired(user.free_trial_end_date) ? 'Expired' : 'Active'}
                      </span>
                      {!isTrialExpired(user.free_trial_end_date) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {getDaysRemaining(user.free_trial_end_date)} days left
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatDate(user.free_trial_end_date)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {user.trial_extensions_count}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => extendTrial(user.user_id)}
                    disabled={extending === user.user_id}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-3 py-1 rounded text-sm font-medium"
                  >
                    {extending === user.user_id ? 'Extending...' : `Extend ${extensionDays}d`}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No users found requiring trial extensions
        </div>
      )}

      {/* Property Limits Summary */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Property Limits Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <strong>Landlords:</strong> 1 free property for 60 days
          </div>
          <div>
            <strong>FSBO:</strong> 1 free property for 60 days
          </div>
          <div>
            <strong>Agents:</strong> 10 free properties for 60 days
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          After free trial: Users must upgrade to continue service or list more properties
        </div>
      </div>
    </div>
  );
}