"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAdminData } from '@/hooks/useAdminData';
import DashboardHeader from '@/components/admin/DashboardHeader';

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
  country_id: string;
}

export default function SuperSimplePricingManagement() {
  const router = useRouter();
  const { adminData, permissions, isAdmin, isLoading: adminLoading, error: adminError } = useAdminData();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>('ALL');
  const supabase = createClientComponentClient();
  
  // Admin access control for pricing management
  useEffect(() => {
    if (adminLoading) return;
    
    if (adminError) {
      console.error('❌ Admin data error:', adminError);
      alert('Error loading admin data. Please try again.');
      router.push('/admin-login');
      return;
    }
    
    if (!isAdmin) {
      console.log('❌ Not authorized to view pricing management - not admin.');
      alert('Access denied. Admin privileges required.');
      router.push('/admin-login');
      return;
    }
    
    // Check if user has pricing management access (Super Admin + Owner Admin only)
    if (!permissions?.canAccessPricingManagement) {
      console.log('❌ Not authorized to view pricing management - insufficient permissions.');
      alert('Access denied. Super Admin or Owner Admin privileges required for pricing management.');
      router.push('/admin-dashboard');
      return;
    }
  }, [adminLoading, adminError, isAdmin, permissions, router]);

  useEffect(() => {
    fetchPricingPlans();
  }, []);

  // Restrict Owner Admin to their country only
  useEffect(() => {
    if (!permissions?.canEditGlobalPricing && permissions?.countryFilter) {
      setSelectedCountryFilter(permissions.countryFilter);
    }
  }, [permissions]);

  // Hide "All Countries" option for Owner Admin
  const showAllCountriesOption = permissions?.canEditGlobalPricing;

  // Get country flag/identifier for display (moved up to fix hoisting)
  function getCountryDisplay(countryId: string) {
    switch (countryId) {
      case 'GY': return '🇬🇾 GY';
      case 'JM': return '🇯🇲 JM';
      default: return `🏴 ${countryId}`;
    }
  };

  // Filter plans based on selected country (moved here after getCountryDisplay)
  const filteredPlans = selectedCountryFilter === 'ALL' 
    ? plans 
    : plans.filter(plan => plan.country_id === selectedCountryFilter);

  // Get unique countries from plans for dropdown
  const uniqueCountries = Array.from(
    new Set(plans.map(p => p.country_id))
  ).map(countryId => ({
    id: countryId,
    display: getCountryDisplay(countryId)
  }));

  // Count plans per country for statistics
  const planCountByCountry = plans.reduce((acc, plan) => {
    acc[plan.country_id] = (acc[plan.country_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const fetchPricingPlans = async () => {
    try {
      let query = supabase
        .from('pricing_plans')
        .select('*');
      
      // REMOVED: Country filtering for viewing - all admins can see all pricing for transparency
      // This allows competitive intelligence and transparency between countries
      // but editing will still be restricted by country
      
      query = query.order('user_type', { ascending: true });
      
      const { data, error } = await query;

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Note: Filter logic moved after getCountryDisplay function

  const updatePlan = async (planId: string, updates: Partial<PricingPlan>) => {
    try {
      // Check if user has permission to edit pricing
      if (!permissions?.canEditCountryPricing && !permissions?.canEditGlobalPricing) {
        alert('Access denied. You do not have permission to edit pricing.');
        return;
      }
      
      let query = supabase
        .from('pricing_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);
      
      // Apply country filter for Owner Admins (they can only edit their country's pricing)
      if (!permissions?.canEditGlobalPricing && permissions?.countryFilter) {
        query = query.eq('country_id', permissions.countryFilter);
      }

      const { error } = await query;

      if (error) throw error;
      
      await fetchPricingPlans();
      setEditingPlan(null);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating plan:', error);
      alert('Error updating plan - please try again');
    }
  };

  const togglePlanActive = async (plan: PricingPlan) => {
    await updatePlan(plan.id, { is_active: !plan.is_active });
  };

  const makePlanPopular = async (plan: PricingPlan) => {
    // First, make all other plans not popular
    for (const p of plans) {
      if (p.id !== plan.id && p.is_popular) {
        await updatePlan(p.id, { is_popular: false });
      }
    }
    // Then make this plan popular
    await updatePlan(plan.id, { is_popular: true });
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const getPlanTypeIcon = (userType: string) => {
    switch (userType) {
      case 'agent': return '🏢';
      case 'landlord': return '🏠';
      case 'fsbo': return '👤';
      default: return '📋';
    }
  };

  const getStatusBadge = (plan: PricingPlan) => {
    if (!plan.is_active) return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">❌ Disabled</span>;
    if (plan.is_popular) return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">⭐ Popular</span>;
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">✅ Active</span>;
  };

  // Helper function to check if current admin can edit this pricing plan
  const canEditPlan = (plan: PricingPlan): boolean => {
    // Super Admin can edit all plans
    if (permissions?.canEditGlobalPricing) {
      return true;
    }
    
    // Owner Admin can only edit plans for their country
    if (permissions?.canEditCountryPricing && permissions?.countryFilter) {
      return plan.country_id === permissions.countryFilter;
    }
    
    // No edit permissions
    return false;
  };

  // (getCountryDisplay function moved above)

  const SuperSimpleEditForm = ({ plan }: { plan: PricingPlan }) => {
    const [price, setPrice] = useState((plan.price / 100).toString());
    const [maxProperties, setMaxProperties] = useState(plan.max_properties?.toString() || 'Unlimited');
    const [featuredListings, setFeaturedListings] = useState(plan.featured_listings_included.toString());
    const [durationDays, setDurationDays] = useState(plan.listing_duration_days.toString());

    const handleSave = () => {
      const updates = {
        price: Math.round(parseFloat(price) * 100), // Convert to cents
        max_properties: maxProperties === 'Unlimited' ? null : parseInt(maxProperties),
        featured_listings_included: parseInt(featuredListings),
        listing_duration_days: parseInt(durationDays)
      };
      updatePlan(plan.id, updates);
    };

    // Security check - prevent editing if no permission
    if (!canEditPlan(plan)) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <h3 className="text-xl font-bold text-red-600 mb-4">🚫 Access Denied</h3>
              <p className="text-gray-600 mb-4">You can only edit pricing plans for your assigned country ({permissions?.countryFilter}).</p>
              <p className="text-sm text-gray-500 mb-4">This plan is for country: {getCountryDisplay(plan.country_id)}</p>
              <button
                onClick={() => setEditingPlan(null)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <span className="text-2xl mr-2">{getPlanTypeIcon(plan.user_type)}</span>
              <div>
                <h3 className="text-xl font-bold">{plan.plan_name}</h3>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {getCountryDisplay(plan.country_id)}
                </span>
              </div>
            </div>
          </div>

          {/* Super Simple Price Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">💰 Monthly Price</label>
            <div className="flex items-center">
              <span className="text-2xl mr-2">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="flex-1 text-2xl p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="29.99"
                step="0.01"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">💡 Tip: Enter the dollar amount (like 29.99)</p>
          </div>

          {/* Max Properties */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">🏠 Maximum Properties Allowed</label>
            <select
              value={maxProperties}
              onChange={(e) => setMaxProperties(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">1 Property</option>
              <option value="3">3 Properties</option>
              <option value="5">5 Properties</option>
              <option value="10">10 Properties</option>
              <option value="25">25 Properties</option>
              <option value="50">50 Properties</option>
              <option value="100">100 Properties</option>
              <option value="Unlimited">Unlimited Properties</option>
            </select>
          </div>

          {/* Featured Listings */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">⭐ Featured Listings Included</label>
            <select
              value={featuredListings}
              onChange={(e) => setFeaturedListings(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="0">0 Featured (None)</option>
              <option value="1">1 Featured Listing</option>
              <option value="2">2 Featured Listings</option>
              <option value="3">3 Featured Listings</option>
              <option value="5">5 Featured Listings</option>
              <option value="10">10 Featured Listings</option>
              <option value="999">Unlimited Featured</option>
            </select>
          </div>

          {/* Duration */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">📅 How Long Listings Stay Live</label>
            <select
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">7 Days (1 Week)</option>
              <option value="14">14 Days (2 Weeks)</option>
              <option value="30">30 Days (1 Month)</option>
              <option value="60">60 Days (2 Months)</option>
              <option value="90">90 Days (3 Months)</option>
              <option value="365">365 Days (1 Year)</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              ✅ Save Changes
            </button>
            <button
              onClick={() => setEditingPlan(null)}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              ❌ Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Show loading while checking permissions or loading data
  if (adminLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">
            {adminLoading ? 'Checking pricing management access...' : 'Loading your pricing plans...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render if not authorized (useEffect will handle redirect)
  if (!isAdmin || !permissions?.canAccessPricingManagement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="text-red-600 text-4xl mb-4">🔒</div>
          <p className="text-gray-900 font-bold mb-2">Admin Access Required</p>
          <p className="text-gray-600">Pricing management is restricted to Super Admin and Owner Admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Success Message */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
          🎉 Pricing updated successfully!
        </div>
      )}

      {/* Standardized Header with Back Button */}
      <DashboardHeader
        title="Super Simple Pricing Management"
        description="Change your pricing plans easily - no technical knowledge required!"
        icon="💰"
        statusBadge={
          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
            permissions?.canEditGlobalPricing 
              ? 'bg-red-100 text-red-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {permissions?.canEditGlobalPricing ? '🌍 Global Access' : `🏴 ${adminData?.country_id || 'Country'} Access`}
          </div>
        }
        adminInfo={`Welcome, ${adminData?.email} • ${permissions?.displayRole || 'Admin'} • ${
          permissions?.canEditGlobalPricing 
            ? 'Can edit pricing for all countries' 
            : 'Can edit pricing for your country only'
        }`}
      />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>🎯 Quick Tips:</strong> You can view all pricing plans for competitive intelligence and transparency. 
              Click "Edit" to change prices instantly (only for your country). 
              Toggle plans on/off with the switch. Mark plans as "Popular" to highlight them.
              {!permissions?.canEditGlobalPricing && (
                <span className="block mt-2 text-yellow-700">
                  <strong>🌍 Transparency:</strong> You can see all countries' pricing for competitive analysis, but can only edit pricing for {permissions?.countryFilter}. 
                  Other countries' plans will show as "View Only" with grayed-out buttons.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Country Filter Dropdown */}
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <label htmlFor="country-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Country
          </label>
          <select
            id="country-filter"
            value={selectedCountryFilter}
            onChange={(e) => setSelectedCountryFilter(e.target.value)}
            disabled={!permissions?.canEditGlobalPricing} // Disable for Owner Admin
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {showAllCountriesOption && (
              <option value="ALL">
                🌍 All Countries ({plans.length} plans)
              </option>
            )}
            {uniqueCountries.map(country => (
              <option key={country.id} value={country.id}>
                {country.display} ({planCountByCountry[country.id]} plans)
              </option>
            ))}
          </select>
          
          {selectedCountryFilter !== 'ALL' && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {filteredPlans.length} pricing plans for {getCountryDisplay(selectedCountryFilter)}
            </div>
          )}
        </div>

        {/* Pricing Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Plan Header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{getPlanTypeIcon(plan.user_type)}</span>
                    <div>
                      <h3 className="font-bold text-lg">{plan.plan_name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{plan.user_type} Plan</p>
                      <div className="mt-1">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {getCountryDisplay(plan.country_id)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(plan)}
                    {!canEditPlan(plan) && (
                      <div className="mt-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          🔒 View Only
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Display */}
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {formatPrice(plan.price)}
                  </div>
                  <p className="text-gray-500 text-sm">per {plan.plan_type}</p>
                </div>

                {/* Plan Features (Simplified) */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm">
                    <span className="mr-2">🏠</span>
                    <span>{plan.max_properties ? `${plan.max_properties} Properties` : 'Unlimited Properties'}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="mr-2">⭐</span>
                    <span>{plan.featured_listings_included} Featured Listings</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="mr-2">📅</span>
                    <span>{plan.listing_duration_days} Days Duration</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="mr-2">👥</span>
                    <span>{plan.active_subscriptions} Active Users</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => canEditPlan(plan) && setEditingPlan(plan)}
                    disabled={!canEditPlan(plan)}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                      canEditPlan(plan)
                        ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={canEditPlan(plan) ? 'Edit this pricing plan' : 'You can only edit pricing for your assigned country'}
                  >
                    {canEditPlan(plan) ? '✏️ Edit This Plan' : '🔒 View Only'}
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => canEditPlan(plan) && togglePlanActive(plan)}
                      disabled={!canEditPlan(plan)}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                        !canEditPlan(plan)
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : plan.is_active 
                            ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                            : 'bg-green-100 hover:bg-green-200 text-green-700'
                      }`}
                      title={canEditPlan(plan) ? undefined : 'You can only edit pricing for your assigned country'}
                    >
                      {!canEditPlan(plan) ? '🔒' : plan.is_active ? '🚫 Disable' : '✅ Enable'}
                    </button>
                    
                    <button
                      onClick={() => canEditPlan(plan) && makePlanPopular(plan)}
                      disabled={!canEditPlan(plan)}
                      className={`flex-1 px-3 py-2 rounded-lg font-medium transition-colors ${
                        !canEditPlan(plan)
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : plan.is_popular 
                            ? 'bg-yellow-200 text-yellow-800' 
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      title={canEditPlan(plan) ? undefined : 'You can only edit pricing for your assigned country'}
                    >
                      {!canEditPlan(plan) ? '🔒' : plan.is_popular ? '⭐ Popular' : '⭐ Mark Popular'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">📚 How to Use This (Super Easy!)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">✏️</div>
              <h3 className="font-medium mb-2">Edit Prices</h3>
              <p className="text-sm text-gray-600">Click "Edit This Plan" to change the price, features, or limits instantly.</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl mb-2">🔄</div>
              <h3 className="font-medium mb-2">Enable/Disable</h3>
              <p className="text-sm text-gray-600">Turn plans on or off. Disabled plans won't show to customers.</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl mb-2">⭐</div>
              <h3 className="font-medium mb-2">Mark Popular</h3>
              <p className="text-sm text-gray-600">Highlight the plan you want customers to choose most.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {editingPlan && <SuperSimpleEditForm plan={editingPlan} />}
    </div>
  );
}