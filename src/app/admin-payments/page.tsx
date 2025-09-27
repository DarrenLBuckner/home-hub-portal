"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

interface Payment {
  id: string;
  property_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  payment_method: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export default function AdminPayments() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkAdminAccess() {
      console.log('🔍 ADMIN PAYMENTS: Checking user authentication...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('❌ No authenticated user, redirecting to admin login');
        window.location.href = '/admin-login';
        return;
      }

      // Check if user is admin or super_admin in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, admin_level, first_name, last_name, email')
        .eq('id', authUser.id)
        .single();

      console.log('Admin payments profile check:', { profile, profileError });

      if (profileError || !profile || (profile.user_type !== 'admin' && profile.user_type !== 'super_admin')) {
        console.log('Not authorized as admin. User type:', profile?.user_type);
        window.location.href = '/admin-login';
        return;
      }

      // Get user role from admin_level or fallback to user_type
      const role = profile.admin_level || profile.user_type;
      setUserRole(role);

      // Update the user state to include admin info
      setUser({ 
        ...authUser, 
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        role: profile.user_type,
        admin_level: profile.admin_level
      });

      await loadPayments();
      setLoading(false);
    }

    checkAdminAccess();
  }, []);

  async function loadPayments() {
    try {
      console.log('Loading payments data...');
      
      // Load payments data (simplified to avoid relationship errors)
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('subscription_payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Error loading payments:', paymentsError);
        setError(`Failed to load payments: ${paymentsError.message}`);
        return;
      }

      console.log('Loaded payments:', paymentsData?.length || 0);
      setPayments(paymentsData || []);

    } catch (err: any) {
      console.error('Failed to load payments data:', err);
      setError(`Failed to load payments data: ${err?.message || 'Unknown error'}`);
      setPayments([]);
    }
  }

  async function updatePaymentStatus(paymentId: string, newStatus: 'approved' | 'rejected') {
    try {
      const { error } = await supabase
        .from('subscription_payments')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) {
        console.error('Error updating payment:', error);
        alert(`Failed to ${newStatus} payment: ${error.message}`);
        return;
      }

      // Reload payments to reflect changes
      await loadPayments();
      console.log(`Payment ${paymentId} ${newStatus} successfully`);
      
    } catch (err: any) {
      console.error(`Failed to ${newStatus} payment:`, err);
      alert(`Failed to ${newStatus} payment: ${err?.message || 'Unknown error'}`);
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
        <p className="mt-4 text-gray-600">Loading payments...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="text-red-600 mb-4">⚠️ Error</div>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={loadPayments}
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
              <h1 className="text-3xl font-bold text-gray-900">Subscription Payments</h1>
              <p className="text-gray-600 mt-1">Review and manage subscription payment submissions</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Welcome back,</div>
                <div className="font-medium">{user?.name}</div>
                <div className="text-xs text-blue-600">
                  {userRole === 'owner' || userRole === 'super' ? 'Full Access' : 'View Only'}
                </div>
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
        {/* Informational notices */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 text-sm">
            ℹ️ <strong>Note:</strong> User details are shown as User IDs. Contact database admin to configure user profile relationships if full names are needed.
          </p>
        </div>

        {/* Role-based access notification */}
        {userRole !== 'owner' && userRole !== 'super' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              ⚠️ <strong>View-Only Access:</strong> You can review payments but cannot approve or reject them. 
              Contact a Super Admin for approval actions.
            </p>
          </div>
        )}

        {/* Payments Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Payment Submissions ({payments.length})
              </h2>
              <button 
                onClick={loadPayments}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-xl font-medium text-gray-600 mb-2">No payments found</h3>
              <p className="text-gray-500">Payment submissions will appear here when users submit them.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User & Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Subscription Payment
                          </div>
                          <div className="text-sm text-gray-500">
                            Property ID: {payment.property_id || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-400">
                            User ID: {payment.user_id}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ${payment.amount.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.payment_method}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          payment.status === 'approved' 
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {/* Role-based action buttons */}
                        {payment.status === 'pending' && (userRole === 'owner' || userRole === 'super') ? (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => updatePaymentStatus(payment.id, 'approved')}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : payment.status === 'pending' ? (
                          <span className="text-gray-500">View Only</span>
                        ) : (
                          <span className="text-gray-500 capitalize">{payment.status}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}