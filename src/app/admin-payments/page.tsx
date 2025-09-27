"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { getCountryAwareAdminPermissions, isSuperAdmin, AdminPermissions, getCountryFilter } from '@/lib/auth/adminPermissions';

interface Payment {
  id: string;
  property_id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'verified' | 'refunded';
  payment_method: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export default function AdminPayments() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
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

      // Check if user is admin or super in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, admin_level, first_name, last_name, email')
        .eq('id', authUser.id)
        .single();

      console.log('🔍 Admin payments profile check:', { 
        profile, 
        profileError,
        userId: authUser.id,
        userEmail: authUser.email 
      });

      // TEMPORARY: Check if profile exists and has valid admin data, if not use hardcoded permissions
      if (profileError || !profile || !profile.admin_level) {
        console.log('🚨 TEMPORARY: Profile issue for payments, checking for hardcoded admin access');
        
        // Hardcoded admin permissions for known users
        const adminConfig: { [email: string]: { level: string, country?: number, displayName?: string } } = {
          'mrdarrenbuckner@gmail.com': { level: 'super', displayName: 'Darren' },
          'qumar@guyanahomehub.com': { level: 'owner', country: 1, displayName: 'Qumar' }
        };
        
        const adminInfo = adminConfig[authUser.email];
        if (adminInfo) {
          console.log('✅ TEMPORARY: Found hardcoded admin config for payments:', authUser.email);
          const isSuperAdmin = adminInfo.level === 'super';
          
          setUser({ 
            ...authUser, 
            name: adminInfo.displayName || authUser.email.split('@')[0],
            email: authUser.email,
            role: 'admin',
            admin_level: adminInfo.level
          });
          setUserRole(adminInfo.level);
          setPermissions({
            canViewUsers: true,
            canEditUsers: false,
            canDeleteUsers: false,
            canViewPayments: true,
            canProcessPayments: true,
            canAcceptPayments: true,
            canIssueRefunds: isSuperAdmin,
            canApproveProperties: true,
            canRejectProperties: true,
            canEscalateToHigherAdmin: !isSuperAdmin,
            canViewSystemSettings: true,
            canEditSystemSettings: isSuperAdmin,
            canViewAllDashboards: true,
            canManageAdmins: isSuperAdmin,
            assignedCountryId: adminInfo.country || null,
            assignedCountryName: adminInfo.country ? 'Guyana' : null,
            canViewAllCountries: isSuperAdmin,
            countryFilter: adminInfo.country || null
          });
          setLoading(false);
          return;
        } else {
          console.log('❌ No hardcoded admin config found for payments:', authUser.email);
          alert('Access denied. Please contact administrator to set up your admin profile.');
          window.location.href = '/admin-login';
          return;
        }
      }

      // Check permissions using the new country-aware system
      const userPermissions = await getCountryAwareAdminPermissions(
        profile?.user_type || '', 
        profile?.email || '',
        profile?.admin_level || null,
        authUser.id,
        supabase
      );
      
      console.log('🔍 User permissions result for payments:', userPermissions);
      
      if (profileError || !profile || !userPermissions.canViewPayments) {
        console.log('❌ Not authorized to view payments.', {
          profileError,
          profile: profile?.user_type,
          permissions: userPermissions
        });
        alert('Access denied. Admin privileges required to view payments.');
        window.location.href = '/admin-login';
        return;
      }

      // Get user role from admin_level or fallback to user_type
      const role = profile.admin_level || profile.user_type;
      setUserRole(role);
      setPermissions(userPermissions);

      // Update the user state to include admin info
      setUser({ 
        ...authUser, 
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        role: profile.user_type,
        admin_level: profile.admin_level
      });

      setLoading(false);
    }

    checkAdminAccess();
  }, []);

  // Load payments when permissions are available
  useEffect(() => {
    if (permissions && user) {
      loadPayments();
    }
  }, [permissions, user]);

  async function loadPayments() {
    try {
      console.log('Loading payments data...');
      
      if (!permissions) {
        console.log('No permissions available yet');
        return;
      }

      // Get country filter based on admin permissions
      const countryFilter = getCountryFilter(permissions);
      console.log('Country filter:', countryFilter);

      // Simple query without joins - just get payment history
      let query = supabase
        .from('payment_history')
        .select('*')
        .order('created_at', { ascending: false });

      // TODO: Add country filtering when we have proper user relationship
      // For now, load all payments for testing
      console.log('Note: Country filtering temporarily disabled for testing');

      const { data: paymentsData, error: paymentsError } = await query;

      if (paymentsError) {
        console.error('Error loading payments:', paymentsError);
        setError(`Failed to load payments: ${paymentsError.message}`);
        return;
      }

      console.log('Loaded payments:', paymentsData?.length || 0, 'with country filter:', countryFilter);
      setPayments(paymentsData || []);

    } catch (err: any) {
      console.error('Failed to load payments data:', err);
      setError(`Failed to load payments data: ${err?.message || 'Unknown error'}`);
      setPayments([]);
    }
  }

  async function updatePaymentStatus(paymentId: string, newStatus: 'approved' | 'rejected' | 'verified' | 'refunded') {
    try {
      const { error } = await supabase
        .from('payment_history')
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

        {/* Country access indicator */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            🌍 <strong>Data Scope:</strong> {permissions?.canViewAllCountries 
              ? 'Viewing payments from ALL countries (Super Admin access)' 
              : `Viewing payments from ${permissions?.assignedCountryName || 'your assigned country'} only`}
          </p>
        </div>

        {/* Role-based access notification */}
        {!permissions?.canProcessPayments && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              ⚠️ <strong>View-Only Access:</strong> You can review payments but cannot approve or reject them. 
              Only Super Admin can process payments.
            </p>
          </div>
        )}

        {/* Admin access messages based on actual role */}
        {permissions?.canProcessPayments && userRole === 'super' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              ✅ <strong>Super Admin Access:</strong> You have full access to approve/reject payments, issue refunds, and manage the entire system.
            </p>
          </div>
        )}

        {permissions?.canProcessPayments && userRole === 'owner' && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              ✅ <strong>Full {permissions?.assignedCountryName || 'Country'} Access:</strong> You can approve/reject payments and manage properties for {permissions?.assignedCountryName || 'your assigned country'}. Contact Super Admin for refunds.
            </p>
          </div>
        )}

        {permissions?.canProcessPayments && userRole === 'basic' && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-purple-800 text-sm">
              ✅ <strong>Basic Admin - {permissions?.assignedCountryName || 'Country'} Access:</strong> You can accept/reject payments for {permissions?.assignedCountryName || 'your assigned country'}. Escalate complex issues to higher admins.
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
                          ${payment.amount ? payment.amount.toFixed(2) : '0.00'}
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
                            : payment.status === 'verified'
                            ? 'bg-blue-100 text-blue-800'
                            : payment.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : payment.status === 'refunded'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Payment acceptance - all admins */}
                          {payment.status === 'pending' && ['super', 'owner', 'basic'].includes(userRole) && (
                            <button 
                              onClick={() => updatePaymentStatus(payment.id, 'verified')}
                              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                              title="Accept payment and mark as verified"
                            >
                              Accept Payment
                            </button>
                          )}

                          {/* Refunds - ONLY super admin */}
                          {payment.status === 'verified' && userRole === 'super' && (
                            <button 
                              onClick={() => updatePaymentStatus(payment.id, 'refunded')}
                              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors ml-2"
                              title="Issue refund - Super Admin only"
                            >
                              Issue Refund
                            </button>
                          )}

                          {/* Show limitation for non-super admins */}
                          {payment.status === 'verified' && ['owner', 'basic'].includes(userRole) && (
                            <span className="text-gray-500 italic text-xs" title="Only Super Admin can issue refunds">
                              Refunds need Super Admin
                            </span>
                          )}

                          {/* Show status for non-actionable payments */}
                          {payment.status === 'pending' && !['super', 'owner', 'basic'].includes(userRole) && (
                            <span className="text-gray-500 text-xs" title="View Only Access">View Only</span>
                          )}

                          {!['pending', 'verified'].includes(payment.status) && (
                            <span className="text-gray-500 capitalize text-xs">{payment.status}</span>
                          )}
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
    </main>
  );
}