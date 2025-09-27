"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

interface Property {
  id: string;
  title: string;
  city: string;
  region: string;
  price: number;
}

export default function SubmitPayment() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState<Property[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    property_id: '',
    amount: '',
    payment_method: 'bank_transfer',
    notes: ''
  });

  useEffect(() => {
    async function checkAccess() {
      console.log('🔍 SUBMIT PAYMENT: Checking user authentication...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('❌ No authenticated user, redirecting to login');
        window.location.href = '/admin-login';
        return;
      }

      // Check if user has admin access
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, first_name, last_name, email')
        .eq('id', authUser.id)
        .single();

      if (profileError || !profile) {
        console.log('Profile not found, redirecting to login');
        window.location.href = '/admin-login';
        return;
      }

      setUser({ 
        ...authUser, 
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        role: profile.user_type 
      });

      await loadProperties();
      setLoading(false);
    }

    checkAccess();
  }, []);

  async function loadProperties() {
    try {
      // Load properties that might need payment submissions
      const { data: propertiesData, error } = await supabase
        .from('properties')
        .select('id, title, city, region, price')
        .in('status', ['active', 'approved'])
        .order('title');

      if (error) {
        console.error('Error loading properties:', error);
        return;
      }

      setProperties(propertiesData || []);
    } catch (err) {
      console.error('Failed to load properties:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { error: submitError } = await supabase
        .from('subscription_payments')
        .insert({
          property_id: formData.property_id,
          user_id: user.id,
          amount: parseFloat(formData.amount),
          payment_method: formData.payment_method,
          status: 'pending',
          notes: formData.notes,
          created_at: new Date().toISOString()
        });

      if (submitError) {
        setError(`Failed to submit payment: ${submitError.message}`);
        return;
      }

      setSuccess("Payment submitted successfully! It will be reviewed by an admin.");
      
      // Reset form
      setFormData({
        property_id: '',
        amount: '',
        payment_method: 'bank_transfer',
        notes: ''
      });

      // Redirect after a moment
      setTimeout(() => {
        router.push('/admin-payments');
      }, 2000);

    } catch (err: any) {
      setError(`Failed to submit payment: ${err?.message || 'Unknown error'}`);
    } finally {
      setSubmitting(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submit Payment</h1>
              <p className="text-gray-600 mt-1">Submit a manual payment for admin review</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Welcome,</div>
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

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">⚠️ {error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm">✅ {success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Property Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Property
              </label>
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title} - {property.city}, {property.region} (${property.price.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="money_order">Money Order</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Add any additional information about this payment..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link href="/admin-dashboard">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Payment'}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">💡 Payment Submission Help</h3>
          <div className="text-blue-800 text-sm space-y-1">
            <p>• Select the property this payment is for</p>
            <p>• Enter the exact amount paid</p>
            <p>• Choose the payment method used</p>
            <p>• Add any relevant notes (reference numbers, etc.)</p>
            <p>• Your submission will be reviewed by an admin</p>
          </div>
        </div>
      </div>
    </main>
  );
}