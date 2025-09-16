"use client";
import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface PricingPlan {
  id: string;
  plan_name: string;
  user_type: string;
  plan_type: string;
  price: number;
  max_properties: number | null;
  featured_listings_included: number;
  listing_duration_days: number;
  is_active: boolean;
  is_popular: boolean;
  display_order: number;
  features: any;
  active_subscriptions: number;
  total_purchases: number;
}

export default function AdminPricingManagement() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  const fetchPricingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_pricing_overview')
        .select('*')
        .order('user_type', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (planId: string, updates: Partial<PricingPlan>) => {
    try {
      const { error } = await supabase
        .from('pricing_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);

      if (error) throw error;
      
      await fetchPricingPlans();
      setEditingPlan(null);
      alert('Plan updated successfully!');
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Error updating plan');
    }
  };

  const addNewPlan = async (newPlan: Omit<PricingPlan, 'id' | 'active_subscriptions' | 'total_purchases'>) => {
    try {
      const { error } = await supabase
        .from('pricing_plans')
        .insert([newPlan]);

      if (error) throw error;
      
      await fetchPricingPlans();
      setShowAddForm(false);
      alert('Plan created successfully!');
    } catch (error) {
      console.error('Error creating plan:', error);
      alert('Error creating plan');
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const EditForm = ({ plan, onSave, onCancel }: { 
    plan: PricingPlan; 
    onSave: (updates: Partial<PricingPlan>) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState({
      plan_name: plan.plan_name,
      price: plan.price / 100, // Convert to dollars for editing
      max_properties: plan.max_properties || '',
      featured_listings_included: plan.featured_listings_included,
      listing_duration_days: plan.listing_duration_days,
      is_active: plan.is_active,
      is_popular: plan.is_popular,
      display_order: plan.display_order
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        plan_name: formData.plan_name,
        price: Math.round(formData.price * 100), // Convert back to cents
        max_properties: formData.max_properties ? Number(formData.max_properties) : null,
        featured_listings_included: formData.featured_listings_included,
        listing_duration_days: formData.listing_duration_days,
        is_active: formData.is_active,
        is_popular: formData.is_popular,
        display_order: formData.display_order
      });
    };

    return (
      <tr className="bg-blue-50">
        <td colSpan={10}>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                <input
                  type="text"
                  value={formData.plan_name}
                  onChange={(e) => setFormData({ ...formData, plan_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Max Properties</label>
                <input
                  type="number"
                  value={formData.max_properties}
                  onChange={(e) => setFormData({ ...formData, max_properties: e.target.value })}
                  placeholder="Leave empty for unlimited"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Featured Listings</label>
                <input
                  type="number"
                  value={formData.featured_listings_included}
                  onChange={(e) => setFormData({ ...formData, featured_listings_included: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Duration (Days)</label>
                <input
                  type="number"
                  value={formData.listing_duration_days}
                  onChange={(e) => setFormData({ ...formData, listing_duration_days: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Popular</span>
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </td>
      </tr>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">💰 Pricing Management</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage pricing plans for agents, FSBO sellers, and landlords. Changes take effect immediately.
          </p>
        </div>

        {/* Add New Plan Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            + Add New Plan
          </button>
        </div>

        {/* Pricing Plans Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Properties</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Featured</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <React.Fragment key={plan.id}>
                    {editingPlan?.id === plan.id ? (
                      <EditForm
                        plan={editingPlan}
                        onSave={(updates) => updatePlan(plan.id, updates)}
                        onCancel={() => setEditingPlan(null)}
                      />
                    ) : (
                      <tr className={`${!plan.is_active ? 'bg-gray-100 opacity-60' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">{plan.plan_name}</div>
                            {plan.is_popular && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Popular
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{plan.user_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{plan.plan_type.replace('_', ' ')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{formatPrice(plan.price)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.max_properties || 'Unlimited'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.featured_listings_included}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.listing_duration_days} days</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            plan.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {plan.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>Subs: {plan.active_subscriptions}</div>
                          <div>Sales: {plan.total_purchases}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setEditingPlan(plan)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => updatePlan(plan.id, { is_active: !plan.is_active })}
                            className={`${plan.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          >
                            {plan.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">💡 Quick Tips</h3>
            <ul className="mt-3 text-sm text-gray-600 space-y-2">
              <li>• Price changes take effect immediately</li>
              <li>• Mark popular plans to highlight them</li>
              <li>• Inactive plans are hidden from users</li>
              <li>• Display order controls plan arrangement</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">📊 Revenue Impact</h3>
            <div className="mt-3 text-sm text-gray-600">
              <p>Total Active Plans: {plans.filter(p => p.is_active).length}</p>
              <p>Total Subscriptions: {plans.reduce((sum, p) => sum + p.active_subscriptions, 0)}</p>
              <p>Total Sales: {plans.reduce((sum, p) => sum + p.total_purchases, 0)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">🚀 Best Practices</h3>
            <ul className="mt-3 text-sm text-gray-600 space-y-2">
              <li>• Test pricing changes in development first</li>
              <li>• Notify users of major price changes</li>
              <li>• Monitor usage after price adjustments</li>
              <li>• Keep feature descriptions updated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}