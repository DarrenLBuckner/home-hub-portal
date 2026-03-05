"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAdminData, getAdminDisplayName } from '@/hooks/useAdminData';
import UniversalPropertyManager from '@/components/UniversalPropertyManager';
import EngagementOverview from './components/EngagementOverview';

interface Property {
  id: string;
  title: string;  
  description: string;
  price: number;
  property_type: string;
  listing_type?: string;
  bedrooms: number;
  bathrooms: number;
  region: string;
  city: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_email: string;
  owner_whatsapp: string;
  listed_by_type: string;
  user_id: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  property_media: Array<{
    media_url: string;
    is_primary: boolean;
  }>;
  owner: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
  };
  reviewer?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface Statistics {
  totalPending: number;
  todaySubmissions: number;
  byUserType: {
    fsbo: number;
    agent: number;
    landlord: number;
  };
  totalActive: number;
  totalRejected: number;
}

export default function MobileOptimizedAdminDashboard() {
  const router = useRouter();
  const { adminData, permissions, isAdmin, isLoading: adminLoading, error: adminError } = useAdminData();
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [approvedProperties, setApprovedProperties] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all' | 'engagement' | 'rejected'>('pending');
  const [statistics, setStatistics] = useState<Statistics>({
    totalPending: 0,
    todaySubmissions: 0,
    byUserType: { fsbo: 0, agent: 0, landlord: 0 },
    totalActive: 0,
    totalRejected: 0,
  });
  const [processingPropertyId, setProcessingPropertyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  // Handle admin authentication and authorization
  useEffect(() => {
    if (adminLoading) return;
    
    if (adminError) {
      console.error('❌ Admin data error:', adminError);
      alert('Error loading admin data. Please try again.');
      router.push('/admin-login');
      return;
    }
    
    if (!isAdmin) {
      console.log('❌ Not authorized to view admin dashboard.');
      alert('Access denied. Admin privileges required to view admin dashboard.');
      router.push('/admin-login');
      return;
    }
    
    loadDashboardData();
  }, [adminLoading, adminError, isAdmin, router]);

  const displayUserType = (dbValue: string) => {
    const map: { [key: string]: string } = {
      'owner': 'FSBO',
      'agent': 'Agent', 
      'landlord': 'Landlord'
    };
    return map[dbValue] || dbValue;
  };

  async function loadDashboardData() {
    try {
      console.log('🔄 Loading dashboard data via admin API...');

      // Use server-side API endpoint which uses service role key (bypasses RLS)
      // This ensures all admin levels (super, owner, basic) can see properties
      const [pendingRes, activeRes] = await Promise.all([
        fetch('/api/admin/properties?status=pending', { cache: 'no-store', credentials: 'include' }),
        fetch('/api/admin/properties?status=active', { cache: 'no-store', credentials: 'include' }),
      ]);

      if (!pendingRes.ok || !activeRes.ok) {
        console.error('Properties API error:', pendingRes.status, activeRes.status);
        setError('Failed to load properties');
        return;
      }

      const pendingData = await pendingRes.json();
      const activeData = await activeRes.json();

      setPendingProperties(pendingData.properties || []);
      setApprovedProperties(activeData.properties || []);

      // Use statistics from the API response
      const stats = pendingData.statistics;

      setStatistics({
        totalPending: stats?.totalPending ?? (pendingData.properties?.length || 0),
        todaySubmissions: stats?.todaySubmissions ?? 0,
        byUserType: stats?.byUserType ?? { fsbo: 0, agent: 0, landlord: 0 },
        totalActive: stats?.totalActive ?? (activeData.properties?.length || 0),
        totalRejected: stats?.totalRejected ?? 0,
      });

    } catch (error) {
      console.error('Dashboard load error:', error);
      setError('Failed to load dashboard data');
    }
  }

  async function approveProperty(propertyId: string) {
    setProcessingPropertyId(propertyId);
    setError(''); // Clear any previous errors
    
    try {
      console.log(`🔄 Approving property ${propertyId}...`);
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`/api/properties/update/${propertyId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: 'active' }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Property approved successfully:', result);
        
        // Show success message briefly
        const property = pendingProperties.find(p => p.id === propertyId);
        alert(`✅ Property "${property?.title}" has been approved and is now active!`);
        
        await loadDashboardData();
      } else {
        console.error('❌ Approval failed:', result);
        setError(result.error || 'Failed to approve property');
      }
    } catch (error) {
      console.error('❌ Network error during approval:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingPropertyId(null);
  }

  async function rejectProperty(propertyId: string, reason: string) {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setProcessingPropertyId(propertyId);
    setError(''); // Clear any previous errors
    
    try {
      console.log(`🔄 Rejecting property ${propertyId} with reason: ${reason}`);
      
      // Get the current session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }
      
      const response = await fetch(`/api/properties/update/${propertyId}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: 'rejected', rejection_reason: reason }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Property rejected successfully:', result);
        
        // Show success message briefly
        const property = pendingProperties.find(p => p.id === propertyId);
        alert(`❌ Property "${property?.title}" has been rejected.\nReason: ${reason}`);
        
        setShowRejectModal(null);
        setRejectReason("");
        await loadDashboardData();
      } else {
        console.error('❌ Rejection failed:', result);
        setError(result.error || 'Failed to reject property');
      }
    } catch (error) {
      console.error('❌ Network error during rejection:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingPropertyId(null);
  }

  async function updatePropertyStatus(propertyId: string, newStatus: string) {
    try {
      setProcessingPropertyId(propertyId);
      
      const { error } = await supabase
        .from('properties')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) {
        console.error('❌ Error updating property status:', error);
        setError(`Failed to update property status: ${error.message}`);
        return;
      }

      console.log(`✅ Property ${propertyId} status updated to: ${newStatus}`);
      
      // Refresh the dashboard data to reflect changes
      await loadDashboardData();
      
    } catch (error) {
      console.error('❌ Network error during status update:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingPropertyId(null);
  }

  async function handlePriceChange(propertyId: string, currentPrice: number) {
    const newPriceStr = prompt(
      `Change property price from $${currentPrice.toLocaleString()}\n\nEnter new price (numbers only):`,
      currentPrice.toString()
    );
    
    if (!newPriceStr || newPriceStr.trim() === '') {
      return; // User cancelled
    }
    
    const newPrice = parseFloat(newPriceStr.replace(/[,$]/g, ''));
    
    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Please enter a valid price (numbers only)');
      return;
    }
    
    if (newPrice === currentPrice) {
      return; // No change
    }
    
    try {
      setProcessingPropertyId(propertyId);
      
      const { error } = await supabase
        .from('properties')
        .update({ 
          price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) {
        console.error('❌ Error updating property price:', error);
        setError(`Failed to update price: ${error.message}`);
        return;
      }

      console.log(`✅ Property ${propertyId} price updated to: $${newPrice.toLocaleString()}`);
      
      // Refresh the dashboard data to reflect changes
      await loadDashboardData();
      
    } catch (error) {
      console.error('❌ Network error during price update:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingPropertyId(null);
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      router.push('/admin-login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/admin-login');
    }
  }

  const MobilePropertyCard = ({ property }: { property: Property }) => {
    const primaryImage = property.property_media?.find(media => media.is_primary);
    
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Mobile-First Image with Overlays */}
        <div className="relative w-full h-56 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200">
          {primaryImage ? (
            <img 
              src={primaryImage.media_url} 
              alt={property.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🏡</div>
                <div className="text-sm font-medium">No Image</div>
              </div>
            </div>
          )}
          
          {/* Mobile Overlay Labels */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <span className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              PENDING
            </span>
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase">
              {property.owner ? displayUserType(property.owner.user_type) : 'Unknown'}
            </span>
          </div>
          
          <div className="absolute top-3 right-3 bg-black bg-opacity-75 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
            ${property.price.toLocaleString()}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title and Type */}
          <div className="mb-3">
            <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{property.title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{property.property_type}</span>
              <span>📍 {property.region}</span>
            </div>
          </div>

          {/* Property Details */}
          <div className="flex items-center justify-between mb-3 py-2 px-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4 text-sm text-gray-700">
              <span className="flex items-center">🛏 {property.bedrooms}</span>
              <span className="flex items-center">🚿 {property.bathrooms}</span>
            </div>
          </div>

          {/* Description Preview */}
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {property.description.length > 100 ? `${property.description.substring(0, 100)}...` : property.description}
          </p>

          {/* Owner Info Card */}
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="text-xs font-medium text-blue-800 mb-1">Property Owner</div>
            <div className="text-sm text-blue-700">
              <div className="flex items-center justify-between">
                <span className="truncate">📧 {property.owner_email}</span>
                {property.owner_whatsapp && (
                  <span className="ml-2">📱 {property.owner_whatsapp}</span>
                )}
              </div>
              <div className="mt-1 text-xs text-blue-600">
                Submitted {new Date(property.created_at).toLocaleDateString()} by {
                  property.owner ?
                    [property.owner.first_name, property.owner.last_name].filter(Boolean).join(' ') || 'Unknown User'
                    : 'Unknown User'
                }
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Optimized */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => approveProperty(property.id)}
                disabled={processingPropertyId === property.id}
                className="px-4 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 touch-manipulation"
              >
                {processingPropertyId === property.id ? '⏳ Processing...' : '✅ Approve'}
              </button>
              <button
                onClick={() => setShowRejectModal(property.id)}
                disabled={processingPropertyId === property.id}
                className="px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 touch-manipulation"
              >
                ❌ Reject
              </button>
            </div>
            <Link href={`/admin-dashboard/property/${property.id}`} className="block">
              <button className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors touch-manipulation">
                👁 View Full Details
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const ApprovedPropertyCard = ({ property }: { property: Property }) => {
    const primaryImage = property.property_media?.find(media => media.is_primary);
    
    // Helper function for editing properties - route to user-specific edit forms based on property owner
    const getEditUrl = (property: Property) => {
      // Route based on the property's listed_by_type to the appropriate edit form  
      if (property.listed_by_type === 'agent') {
        return `/dashboard/agent/edit-property/${property.id}`;
      } else if (property.listed_by_type === 'landlord') {
        return `/dashboard/landlord/edit-property/${property.id}`;
      } else if (property.listed_by_type === 'fsbo') {
        return `/dashboard/fsbo/edit-property/${property.id}`;
      } else if (property.listed_by_type === 'owner') {
        return `/dashboard/owner/edit-property/${property.id}`;
      } else {
        // Fallback to owner for unknown types
        return `/dashboard/owner/edit-property/${property.id}`;
      }
    };
    
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Mobile-First Image with Overlays */}
        <div className="relative w-full h-56 sm:h-48 bg-gradient-to-br from-gray-100 to-gray-200">
          {primaryImage ? (
            <img 
              src={primaryImage.media_url} 
              alt={property.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">🏡</div>
                <div className="text-sm font-medium">No Image</div>
              </div>
            </div>
          )}
          
          {/* Mobile Overlay Labels */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-2">
            <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              ACTIVE
            </span>
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md uppercase">
              {property.owner ? displayUserType(property.owner.user_type) : 'Unknown'}
            </span>
          </div>
          
          <div className="absolute top-3 right-3 bg-black bg-opacity-75 text-white text-sm font-bold px-3 py-1 rounded-full shadow-md">
            ${property.price.toLocaleString()}
          </div>
        </div>

        {/* Enhanced Content Section - All Details Inline */}
        <div className="p-4">
          {/* Title and Type */}
          <div className="mb-3">
            <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1">{property.title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{property.property_type}</span>
              <span>📍 {property.region}</span>
            </div>
          </div>

          {/* Enhanced Property Details - No separate page needed */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <h4 className="text-xs font-semibold text-gray-800 mb-2">📋 Property Details</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-gray-600">Type:</span>
                <div className="font-medium">{property.property_type}</div>
              </div>
              <div>
                <span className="text-gray-600">Listing:</span>
                <div className="font-medium">{property.listing_type || 'Sale'}</div>
              </div>
              <div>
                <span className="text-gray-600">Bedrooms:</span>
                <div className="font-medium">🛏 {property.bedrooms}</div>
              </div>
              <div>
                <span className="text-gray-600">Bathrooms:</span>
                <div className="font-medium">🚿 {property.bathrooms}</div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-800 mb-1">📝 Description</h4>
            <p className="text-sm text-gray-600 line-clamp-3">
              {property.description}
            </p>
          </div>

          {/* Owner Info Card */}
          <div className="bg-green-50 rounded-lg p-3 mb-4">
            <div className="text-xs font-medium text-green-800 mb-1">Property Owner</div>
            <div className="text-sm text-green-700">
              <div className="flex items-center justify-between">
                <span className="truncate">📧 {property.owner_email}</span>
                {property.owner_whatsapp && (
                  <span className="ml-2">📱 {property.owner_whatsapp}</span>
                )}
              </div>
              <div className="mt-1 text-xs text-green-600">
                Listed {new Date(property.created_at).toLocaleDateString()} by {
                  property.owner ?
                    [property.owner.first_name, property.owner.last_name].filter(Boolean).join(' ') || 'Unknown User'
                    : 'Unknown User'
                }
              </div>
            </div>
          </div>

          {/* Action Buttons - Mobile Optimized with PROMINENT EDIT */}
          <div className="space-y-2">
            {/* PRIMARY EDIT BUTTON - Most Prominent */}
            <Link href={getEditUrl(property)} className="block">
              <button className="w-full px-4 py-4 bg-yellow-500 text-black text-sm font-black rounded-xl hover:bg-yellow-400 transition-colors shadow-lg transform hover:scale-[1.02] active:scale-[0.98] touch-manipulation border-2 border-yellow-600">
                ✏️ EDIT PROPERTY
              </button>
            </Link>
            
            {/* Enhanced Admin Actions - All in One Place */}
            <div className="grid grid-cols-2 gap-2">
              <a 
                href={`https://guyanahomehub.com/properties/${property.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block"
              >
                <button className="w-full px-4 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors touch-manipulation">
                  🌐 View Live
                </button>
              </a>
              <button 
                onClick={() => updatePropertyStatus(property.id, 'pending')}
                className="w-full px-4 py-3 bg-yellow-600 text-white text-sm font-bold rounded-xl hover:bg-yellow-700 transition-colors touch-manipulation"
              >
                📝 Under Contract
              </button>
            </div>
            
            {/* Additional Actions Row */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button 
                onClick={() => handlePriceChange(property.id, property.price)}
                className="w-full px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
              >
                💰 Change Price
              </button>
              <button 
                onClick={() => updatePropertyStatus(property.id, property.listing_type === 'rental' ? 'rented' : 'sold')}
                className="w-full px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors"
              >
                {property.listing_type === 'rental' ? '🏠 Rented' : '🏆 Sold'}
              </button>
              <button 
                onClick={() => {
                  if (confirm('Hide this property from public view?')) {
                    updatePropertyStatus(property.id, 'off_market');
                  }
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-colors"
              >
                👁️‍🗨️ Off Market
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Sticky Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-600">Property Review & Management</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors"
            >
              🚪 Logout
            </button>
          </div>

          {/* Admin Info & Actions Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                {permissions?.displayRole || 'Admin'}
              </div>
              <div className="text-xs text-gray-600">
                Hi, {getAdminDisplayName(adminData)}
                {adminData?.account_code && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">
                    {adminData.account_code}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Pricing - Super Admin & Owner Admin only */}
              {permissions?.canAccessPricingManagement && (
                <Link href="/admin-dashboard/pricing">
                  <button className="px-3 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors">
                    💰 Pricing
                  </button>
                </Link>
              )}
              
              {/* User Management - Super Admin & Owner Admin only */}
              {permissions?.canAccessUserManagement && (
                <Link href="/admin-dashboard/user-management">
                  <button className="px-3 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">
                    👥 Users
                  </button>
                </Link>
              )}
              
              {/* Settings - All admin levels */}
              {permissions?.canAccessSettings && (
                <Link href="/admin-dashboard/settings">
                  <button className="px-3 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors">
                    ⚙️ Settings
                  </button>
                </Link>
              )}
              
              {/* Diagnostics - SUPER ADMIN ONLY */}
              {permissions?.canAccessDiagnostics && (
                <Link href="/admin-dashboard/diagnostic">
                  <button className="px-3 py-2 bg-orange-600 text-white text-xs font-bold rounded-lg hover:bg-orange-700 transition-colors">
                    🩺 Diagnostic
                  </button>
                </Link>
              )}
              
              {/* System Settings - SUPER ADMIN ONLY */}
              {permissions?.canAccessSystemSettings && (
                <Link href="/admin-dashboard/system-settings">
                  <button className="px-3 py-2 bg-gray-600 text-white text-xs font-bold rounded-lg hover:bg-gray-700 transition-colors">
                    🛠️ System
                  </button>
                </Link>
              )}
              
              {/* Refresh - Always available to all admins */}
              <button 
                onClick={loadDashboardData}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">


        {/* Property Management Hub - Prominent Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-2xl p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">🏠 Property Management Hub</h2>
              <p className="text-gray-700">Complete property oversight & management tools</p>
            </div>
            
            {/* Property Status Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Rejected Properties - Most Important */}
              <button
                onClick={() => setActiveTab('rejected')}
                className="bg-red-500 hover:bg-red-600 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="text-3xl mb-2">❌</div>
                <div className="text-2xl font-bold">{statistics.totalRejected || 0}</div>
                <div className="text-sm opacity-90">Rejected Properties</div>
                <div className="text-xs mt-1 opacity-75">View & Manage</div>
              </button>

              {/* Pending Properties */}
              <button
                onClick={() => setActiveTab('pending')}
                className="bg-yellow-500 hover:bg-yellow-600 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="text-3xl mb-2">⏳</div>
                <div className="text-2xl font-bold">{statistics.totalPending}</div>
                <div className="text-sm opacity-90">Pending Review</div>
                <div className="text-xs mt-1 opacity-75">Need Action</div>
              </button>

              {/* Active Properties */}
              <button
                onClick={() => setActiveTab('approved')}
                className="bg-green-500 hover:bg-green-600 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold">{approvedProperties?.length || 0}</div>
                <div className="text-sm opacity-90">Active Properties</div>
                <div className="text-xs mt-1 opacity-75">Live on Site</div>
              </button>



              {/* Engagement Overview */}
              <button
                onClick={() => setActiveTab('engagement')}
                className="bg-purple-500 hover:bg-purple-600 text-white p-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="text-3xl mb-2">📊</div>
                <div className="text-2xl font-bold">LIKES</div>
                <div className="text-sm opacity-90">Engagement</div>
                <div className="text-xs mt-1 opacity-75">Analytics</div>
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/admin-dashboard/pricing">
                <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
                  💰 Pricing Dashboard
                </button>
              </Link>

            </div>
          </div>
        </div>

        {/* Properties Section with Tabs */}
        <div className="mb-6">
          {/* Tab Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Property Management</h2>
              <p className="text-sm text-gray-600">Review pending, manage approved & view all properties</p>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'pending'
                    ? 'bg-white text-yellow-700 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ⏳ Pending ({statistics.totalPending})
              </button>
              <button
                onClick={() => setActiveTab('approved')}
                className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'approved'
                    ? 'bg-white text-green-700 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✅ Approved ({approvedProperties.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📋 All Properties
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'pending' && (
            <>
              {!pendingProperties || pendingProperties.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">All caught up!</h3>
                  <p className="text-gray-600 mb-6">No properties waiting for review. Excellent work!</p>
                  <button
                    onClick={() => setActiveTab('approved')}
                    className="px-6 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors mr-4"
                  >
                    ✅ View Approved Properties
                  </button>
                  <Link href="/admin-dashboard/pricing">
                    <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                      💰 Pricing Dashboard
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingProperties.map((property) => (
                    <MobilePropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'approved' && (
            <>
              {!approvedProperties || approvedProperties.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-4xl mb-4">📋</div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">No Approved Properties</h3>
                  <p className="text-gray-600 mb-6">Approved properties will appear here for management and editing.</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => setActiveTab('pending')}
                      className="px-6 py-3 bg-yellow-600 text-white font-bold rounded-xl hover:bg-yellow-700 transition-colors"
                    >
                      ⏳ View Pending Properties ({statistics.totalPending})
                    </button>
                    <Link href="/admin-dashboard/pricing">
                      <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                        💰 Pricing Dashboard
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {approvedProperties.map((property) => (
                    <ApprovedPropertyCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Rejected Properties Tab - Dedicated View */}
          {activeTab === 'rejected' && (
            <div className="mt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">❌ Rejected Properties Management</h3>
                <p className="text-sm text-red-800">
                  Review and manage all rejected properties. Fix issues, resubmit, or delete rejected listings.
                </p>
              </div>
              {adminData && (
                <UniversalPropertyManager 
                  userId={adminData.id} 
                  userType="admin"
                  editPropertyPath="/admin-dashboard/property"
                  createPropertyPath="/properties/create"
                  defaultTab="rejected"
                />
              )}
            </div>
          )}

          {/* All Properties Tab - Full Property Management */}
          {activeTab === 'all' && (
            <div className="mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">🔧 Complete Property Management</h3>
                <p className="text-sm text-blue-800">
                  View all properties across all statuses. Delete properties, see rejections, and manage property lifecycle.
                </p>
              </div>
              {adminData && (
                <UniversalPropertyManager 
                  userId={adminData.id} 
                  userType="admin"
                  editPropertyPath="/admin-dashboard/property"
                  createPropertyPath="/properties/create"
                />
              )}
            </div>
          )}

          {/* Engagement Overview Tab */}
          {activeTab === 'engagement' && (
            <div className="mt-4">
              <EngagementOverview />
            </div>
          )}
        </div>
      </div>

      {/* Mobile-Optimized Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
            
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Reject Property</h3>
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="flex items-start space-x-2">
                <div className="text-red-500">⚠️</div>
                <div>
                  <p className="text-red-800 text-sm font-medium">This will notify the property owner</p>
                  <p className="text-red-600 text-xs mt-1">Provide clear feedback to help them improve.</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Example: Images are too dark, missing details, needs better description..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={5}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{rejectReason.length}/500 characters</p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => rejectProperty(showRejectModal, rejectReason)}
                disabled={!rejectReason.trim() || processingPropertyId === showRejectModal}
                className="w-full px-4 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processingPropertyId === showRejectModal ? '⏳ Sending...' : '❌ Reject & Notify Owner'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-4 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{error}</span>
            <button onClick={() => setError("")} className="text-white hover:text-red-200">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}