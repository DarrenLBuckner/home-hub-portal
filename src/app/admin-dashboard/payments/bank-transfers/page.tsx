"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from '@/supabase';
import { formatGYD } from '@/lib/bankConfig';
import { checkAdminAccessWithClient, redirectToAdminLogin } from '@/lib/auth/adminCheck';

interface BankTransfer {
  id: string;
  reference_code: string;
  user_id: string;
  amount_gyd: number;
  amount_usd: number;
  plan_type: string;
  status: string;
  created_at: string;
  expires_at: string;
  verified_at?: string;
  verified_by?: string;
  notes?: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
    user_type: string;
  };
  verifier?: {
    first_name: string;
    last_name: string;
  };
}

export default function BankTransfersAdminPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<BankTransfer[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'expired'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState<{[key: string]: string}>({});

  useEffect(() => {
    async function checkAdminAccessAndLoad() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        redirectToAdminLogin();
        return;
      }

      // Use reusable admin check function
      const isAdmin = await checkAdminAccessWithClient(supabase, authUser.id);
      
      if (!isAdmin) {
        redirectToAdminLogin();
        return;
      }

      setUser(authUser);
      await loadBankTransfers();
      setLoading(false);
    }

    checkAdminAccessAndLoad();
  }, []);

  const loadBankTransfers = async () => {
    try {
      let query = supabase
        .from('payment_references')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email,
            user_type
          ),
          verifier:verified_by (
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading bank transfers:', error);
        return;
      }

      setTransfers(data || []);
    } catch (error) {
      console.error('Error loading bank transfers:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadBankTransfers();
    }
  }, [filter, user]);

  const verifyPayment = async (transferId: string, approved: boolean) => {
    setProcessingId(transferId);
    
    try {
      const notes = verificationNotes[transferId] || '';
      const newStatus = approved ? 'verified' : 'cancelled';

      // Update payment reference
      const { error: updateError } = await supabase
        .from('payment_references')
        .update({
          status: newStatus,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
          notes: notes
        })
        .eq('id', transferId);

      if (updateError) {
        throw updateError;
      }

      // Update payment history
      const transfer = transfers.find(t => t.id === transferId);
      if (transfer) {
        await supabase
          .from('payment_history')
          .update({
            status: approved ? 'completed' : 'cancelled',
            verified_by: user.id,
            verified_at: new Date().toISOString(),
            admin_notes: notes
          })
          .eq('external_transaction_id', transfer.reference_code);

        // If approved, activate user subscription
        if (approved) {
          await activateUserSubscription(transfer);
        }
      }

      // Reload transfers
      await loadBankTransfers();
      
      // Clear notes
      setVerificationNotes(prev => {
        const updated = { ...prev };
        delete updated[transferId];
        return updated;
      });

    } catch (error: any) {
      console.error('Error processing verification:', error);
      alert('Error processing verification: ' + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const activateUserSubscription = async (transfer: BankTransfer) => {
    try {
      // Calculate subscription expiry based on plan
      const daysToAdd = transfer.plan_type === 'basic' ? 60 : 
                       transfer.plan_type === 'extended' ? 90 : 180;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysToAdd);

      // Update user profile
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_plan: transfer.plan_type,
          subscription_expires: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', transfer.user_id);

      if (error) {
        throw error;
      }

      console.log(`Activated subscription for user ${transfer.user_id}`);
    } catch (error) {
      console.error('Error activating subscription:', error);
    }
  };

  const getStatusBadge = (status: string, expiresAt: string) => {
    const isExpired = new Date() > new Date(expiresAt);
    const effectiveStatus = (status === 'pending' && isExpired) ? 'expired' : status;

    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[effectiveStatus as keyof typeof styles]}`}>
        {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
      </span>
    );
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bank transfers...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bank Transfer Verification</h1>
              <p className="text-gray-600 mt-1">Review and verify bank transfer payments</p>
            </div>
            <Link href="/admin-dashboard">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { key: 'pending', label: 'Pending', count: transfers.filter(t => t.status === 'pending' && new Date() <= new Date(t.expires_at)).length },
              { key: 'verified', label: 'Verified', count: transfers.filter(t => t.status === 'verified').length },
              { key: 'expired', label: 'Expired', count: transfers.filter(t => t.status === 'pending' && new Date() > new Date(t.expires_at)).length },
              { key: 'all', label: 'All', count: transfers.length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Transfers List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {transfers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bank transfers found</h3>
              <p className="text-gray-500">No bank transfers match the current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference & Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount & Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status & Timing
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-mono text-sm font-bold text-blue-600">
                            {transfer.reference_code}
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {transfer.profiles.first_name} {transfer.profiles.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transfer.profiles.email}
                          </div>
                          <div className="text-xs text-gray-400 uppercase">
                            {transfer.profiles.user_type}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-lg font-bold text-green-600">
                            {formatGYD(transfer.amount_gyd)}
                          </div>
                          <div className="text-sm text-gray-500">
                            ${(transfer.amount_usd / 100).toFixed(2)} USD
                          </div>
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {transfer.plan_type} Plan
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div>
                          {getStatusBadge(transfer.status, transfer.expires_at)}
                          <div className="text-sm text-gray-500 mt-1">
                            Created: {new Date(transfer.created_at).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transfer.status === 'pending' ? getTimeRemaining(transfer.expires_at) : ''}
                          </div>
                          {transfer.verified_at && (
                            <div className="text-xs text-green-600">
                              Verified: {new Date(transfer.verified_at).toLocaleDateString()}
                              {transfer.verifier && (
                                <span className="block">
                                  by {transfer.verifier.first_name} {transfer.verifier.last_name}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {transfer.status === 'pending' && new Date() <= new Date(transfer.expires_at) && (
                          <div className="space-y-2">
                            <textarea
                              placeholder="Verification notes (optional)"
                              value={verificationNotes[transfer.id] || ''}
                              onChange={(e) => setVerificationNotes(prev => ({
                                ...prev,
                                [transfer.id]: e.target.value
                              }))}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                              rows={2}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => verifyPayment(transfer.id, true)}
                                disabled={processingId === transfer.id}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {processingId === transfer.id ? 'Processing...' : '✅ Verify'}
                              </button>
                              <button
                                onClick={() => verifyPayment(transfer.id, false)}
                                disabled={processingId === transfer.id}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                ❌ Reject
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {transfer.notes && (
                          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                            <strong>Notes:</strong> {transfer.notes}
                          </div>
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