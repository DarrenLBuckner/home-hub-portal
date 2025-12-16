'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import { getCountryAwareAdminPermissions } from '@/lib/auth/adminPermissions';

interface Property {
  id: string;
  user_id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  listing_type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  location: string;
  created_at: string;
  updated_at: string;
  images: string[];
  features: string[];
  square_footage: number;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  city: string;
  region: string;
  propertyCategory: string;
  listed_by_type: string;
  country_id?: string;
  owner?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
  };
}

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700',
    badgeColor: 'bg-green-600 text-white',
    badgeText: 'LIVE',
    icon: '✅',
    description: 'Properties that are live and visible to potential buyers/renters',
    statusMessage: null
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700',
    badgeColor: 'bg-yellow-500 text-white',
    badgeText: 'UNDER REVIEW',
    icon: '⏳',
    description: 'Properties waiting for admin approval',
    statusMessage: 'This property is awaiting admin approval'
  },
  under_contract: {
    label: 'Under Contract',
    color: 'bg-orange-100 text-orange-700',
    badgeColor: 'bg-[#F97316] text-white',
    badgeText: 'UNDER CONTRACT',
    icon: '📝',
    description: 'Properties that are under contract but not yet sold/rented',
    statusMessage: 'This property is under contract'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-200 text-red-800',
    badgeColor: 'bg-red-600 text-white',
    badgeText: 'REJECTED',
    icon: '❌',
    description: 'Properties that were rejected and need fixes before resubmission',
    statusMessage: 'This property was rejected - see rejection reason'
  },
  draft: {
    label: 'Drafts',
    color: 'bg-blue-100 text-blue-700',
    badgeColor: 'bg-blue-500 text-white',
    badgeText: 'DRAFT',
    icon: '📝',
    description: 'Incomplete property listings that need to be finished',
    statusMessage: 'This is a draft - complete and submit for review'
  },
  off_market: {
    label: 'Off Market',
    color: 'bg-gray-100 text-gray-700',
    badgeColor: 'bg-gray-600 text-white',
    badgeText: 'HIDDEN',
    icon: '👁️‍🗨️',
    description: 'Properties hidden from public view by owner choice',
    statusMessage: 'This property is hidden from public view'
  },
  sold: {
    label: 'Sold',
    color: 'bg-red-100 text-red-700',
    badgeColor: 'bg-[#DC2626] text-white',
    badgeText: 'SOLD',
    icon: '🏆',
    description: 'Properties that have been sold',
    statusMessage: 'This property has been sold'
  },
  rented: {
    label: 'Rented',
    color: 'bg-blue-100 text-blue-700',
    badgeColor: 'bg-[#2563EB] text-white',
    badgeText: 'RENTED',
    icon: '🏠',
    description: 'Properties that have been rented',
    statusMessage: 'This property has been rented'
  }
};

const typeIcons: { [key: string]: string } = {
  house: '🏠',
  apartment: '🏢',
  condo: '🏬',
  commercial: '🏭',
  land: '🌳',
};

function formatPrice(price: number): string {
  return `G$${price.toLocaleString('en-US')}`;
}

interface UniversalPropertyManagerProps {
  userId: string;
  userType: 'agent' | 'landlord' | 'fsbo' | 'admin';
  createPropertyPath?: string;
  editPropertyPath?: string;
  defaultTab?: string;
}

export default function UniversalPropertyManager({ 
  userId, 
  userType,
  createPropertyPath = '/properties/create',
  editPropertyPath = '/dashboard/agent/edit-property',
  defaultTab = 'active'
}: UniversalPropertyManagerProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [adminPermissions, setAdminPermissions] = useState<any>(null);

  useEffect(() => {
    if (userType === 'admin') {
      loadAdminPermissions();
    } else {
      fetchProperties();
    }
  }, [userId, userType]);

  const loadAdminPermissions = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('No authenticated user found');
        setLoading(false);
        return;
      }

      // Get user profile and permissions
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, admin_level, email')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        setError('Failed to load admin profile');
        setLoading(false);
        return;
      }

      // Get country-aware admin permissions
      const permissions = await getCountryAwareAdminPermissions(
        profile.user_type,
        profile.email,
        profile.admin_level,
        user.id,
        supabase
      );

      setAdminPermissions(permissions);
      fetchProperties();
    } catch (err: any) {
      console.error('Admin permissions error:', err);
      setError('Failed to load admin permissions');
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      
      let query = supabase
        .from('properties')
        .select(`
          *,
          owner:profiles!user_id (
            id,
            email,
            first_name,
            last_name,
            user_type
          )
        `)
        .order('created_at', { ascending: false });

      // Apply filtering based on user type
      if (userType === 'admin') {
        console.log('🔧 Admin mode: Loading properties with country filtering...');
        
        // Apply country filter for non-super admins
        if (adminPermissions && !adminPermissions.canViewAllCountries && adminPermissions.countryFilter) {
          console.log(`🌍 Filtering properties for country: ${adminPermissions.countryFilter}`);
          query = query.eq('country_id', adminPermissions.countryFilter);
        } else if (adminPermissions && adminPermissions.canViewAllCountries) {
          console.log('🌍 Super Admin: Loading ALL properties from ALL countries');
        } else {
          console.log('⚠️ Admin permissions not loaded yet, but admin user should see all properties');
          console.log('🔍 Loading ALL properties for admin (no country filter applied)');
          // Don't filter by user_id for admin users - they should see all properties
        }
      } else {
        // Regular users (agent, landlord, fsbo) only see their own properties
        console.log(`👤 Regular user mode (${userType}): Loading user's own properties only`);
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      console.log(`✅ Loaded ${data?.length || 0} properties for ${userType} user`);
      setProperties(data || []);
    } catch (err: any) {
      console.error('❌ Property fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const message = 'Are you sure you want to PERMANENTLY delete this property?\n\n' +
                   '⚠️ This action cannot be undone!\n\n' + 
                   'Alternative: You can "Take Off Market" to hide it instead of deleting.';
    if (!confirm(message)) return;
    
    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Update local state first
      setProperties(prev => prev.filter(p => p.id !== id));
      
      // Success notification
      alert('✅ Property deleted successfully!\n\nNote: It may take up to 1 minute for changes to appear on the public website due to caching.');
      
      // Optional: Trigger cache invalidation on public API (if we want immediate update)
      console.log('🗑️ Property deleted:', id, '- Public site will update within 1 minute');
    } catch (err) {
      alert('Error deleting property. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDeleteRejected = async () => {
    const rejectedProperties = properties.filter(p => p.status === 'rejected');
    
    if (rejectedProperties.length === 0) {
      alert('No rejected properties to delete.');
      return;
    }

    const confirmMessage = `⚠️ BULK DELETE CONFIRMATION\n\n` +
      `Are you sure you want to PERMANENTLY DELETE all ${rejectedProperties.length} rejected properties?\n\n` +
      `This will:\n` +
      `• Delete all rejected property listings\n` +
      `• Remove all associated images and data\n` +
      `• Clean up your admin dashboard\n\n` +
      `⚠️ THIS ACTION CANNOT BE UNDONE!\n\n` +
      `To confirm this dangerous action, please type exactly:\n` +
      `DELETE ALL\n\n` +
      `(Type the words DELETE ALL in the input box below)`;
    
    const userInput = prompt(confirmMessage, "Type DELETE ALL here to confirm");
    if (userInput !== 'DELETE ALL') {
      alert('Bulk delete cancelled. Properties were not deleted.');
      return;
    }

    setDeletingId('bulk');
    try {
      console.log(`🗑️ Bulk deleting ${rejectedProperties.length} rejected properties...`);
      
      // Use dedicated bulk delete API endpoint
      const response = await fetch('/api/properties/bulk-delete-rejected', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to bulk delete rejected properties');
      }

      // Update local state to remove deleted properties
      setProperties(prev => prev.filter(p => p.status !== 'rejected'));
      
      alert(`✅ Successfully deleted ${result.deletedCount} rejected properties!\n\nYour dashboard has been cleaned up. No more clutter from rejected listings.`);
      
      console.log('✅ Bulk delete completed:', result);
    } catch (err: any) {
      alert(`❌ Error during bulk delete: ${err.message}\n\nSome properties may not have been deleted. Please try again or contact support.`);
      console.error('Bulk delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkDeleteDrafts = async () => {
    const draftProperties = properties.filter(p => p.status === 'draft');
    
    if (draftProperties.length === 0) {
      alert('No draft properties to delete.');
      return;
    }

    const confirmMessage = `⚠️ BULK DELETE DRAFTS CONFIRMATION\n\n` +
      `Are you sure you want to PERMANENTLY DELETE all ${draftProperties.length} draft properties?\n\n` +
      `This will:\n` +
      `• Delete all draft property listings\n` +
      `• Remove all associated images and data\n` +
      `• Clean up your workspace\n\n` +
      `⚠️ THIS ACTION CANNOT BE UNDONE!\n\n` +
      `Type "DELETE DRAFTS" below to confirm:`;
    
    const userInput = prompt(confirmMessage);
    if (userInput !== 'DELETE DRAFTS') {
      alert('Bulk delete cancelled. Draft properties were not deleted.');
      return;
    }

    setDeletingId('bulk-drafts');
    try {
      console.log(`🗑️ Bulk deleting ${draftProperties.length} draft properties...`);
      
      // Delete drafts one by one using the existing individual delete logic
      let successCount = 0;
      let errorCount = 0;
      
      for (const draft of draftProperties) {
        try {
          const supabase = createClient();
          const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', draft.id)
            .eq('user_id', userId); // Additional security: only delete user's own properties

          if (error) {
            console.error(`Failed to delete draft ${draft.id}:`, error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (err) {
          console.error(`Error deleting draft ${draft.id}:`, err);
          errorCount++;
        }
      }

      // Update local state to remove successfully deleted properties
      if (successCount > 0) {
        setProperties(prev => prev.filter(p => p.status !== 'draft' || !draftProperties.find(dp => dp.id === p.id)));
      }
      
      if (errorCount === 0) {
        alert(`✅ Successfully deleted all ${successCount} draft properties!\n\nYour workspace has been cleaned up.`);
      } else {
        alert(`⚠️ Partial success: ${successCount} drafts deleted, ${errorCount} failed.\n\nSome drafts may not have been deleted. Please try again or contact support.`);
      }
      
      console.log('✅ Bulk delete drafts completed:', { successCount, errorCount });
    } catch (err: any) {
      alert(`❌ Error during bulk delete: ${err.message}\n\nDrafts may not have been deleted. Please try again or contact support.`);
      console.error('Bulk delete drafts error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: string) => {
    // Find the property to get its listed_by_type
    const property = properties.find(p => p.id === id);
    if (!property) {
      console.error('Property not found for editing:', id);
      return;
    }

    // For admin users, allow editing but with admin awareness
    if (userType === 'admin') {
      // Admins can edit any property - route to the appropriate user edit form
      // but add admin context awareness for better UX
      console.log(`Admin editing property ${id} from user type: ${property.listed_by_type}`);
    }

    // Route to user-specific edit form based on property's listed_by_type
    let editUrl: string;
    if (property.listed_by_type === 'agent') {
      editUrl = `/dashboard/agent/edit-property/${id}`;
    } else if (property.listed_by_type === 'landlord') {
      editUrl = `/dashboard/landlord/edit-property/${id}`;
    } else if (property.listed_by_type === 'fsbo') {
      editUrl = `/dashboard/fsbo/edit-property/${id}`;
    } else if (property.listed_by_type === 'owner') {
      editUrl = `/dashboard/owner/edit-property/${id}`;
    } else {
      // Fallback to owner for unknown types
      editUrl = `/dashboard/owner/edit-property/${id}`;
    }
    
    window.location.href = editUrl;
  };

  const updatePropertyStatus = async (propertyId: string, newStatus: string) => {
    console.log('🔄 updatePropertyStatus called:', { propertyId, newStatus, userType });

    try {
      if (userType === 'admin') {
        // Admin: Use API route with service role to bypass RLS
        console.log('👑 Admin mode: Using API route to bypass RLS');
        const response = await fetch(`/api/properties/status/${propertyId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        const result = await response.json();
        console.log('📡 API response:', { status: response.status, result });

        if (!response.ok) {
          throw new Error(result.error || `API error: ${response.status}`);
        }

        if (!result.success && !result.property) {
          throw new Error('Update failed - no confirmation from server');
        }

        await fetchProperties();
        alert(`Property marked as ${newStatus}!`);
      } else {
        // Non-admin: Use client-side Supabase (RLS allows own properties)
        console.log('👤 User mode: Using client-side Supabase');
        const supabase = createClient();
        const { data, error } = await supabase
          .from('properties')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', propertyId)
          .eq('user_id', userId)
          .select();

        console.log('📡 Supabase response:', { data, error });

        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('No rows updated - you may not own this property');
        }

        await fetchProperties();
        alert(`Property marked as ${newStatus}!`);
      }
    } catch (err) {
      console.error('❌ Error updating property status:', err);
      alert(`Error updating property status: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const resubmitProperty = async (propertyId: string) => {
    if (confirm('This will resubmit your property for admin review. Make sure you have fixed the issues mentioned in the rejection reason.')) {
      await updatePropertyStatus(propertyId, 'pending');
    }
  };

  const submitDraftForReview = async (propertyId: string) => {
    if (confirm('Submit this draft property for admin review? Make sure all required information is completed.')) {
      await updatePropertyStatus(propertyId, 'pending');
    }
  };

  const showRejectionDetails = (property: Property) => {
    setSelectedProperty(property);
    setShowRejectionModal(true);
  };

  const getFilteredProperties = (status: string) => {
    return properties.filter(p => p.status === status);
  };

  const getStatusCount = (status: string) => {
    return getFilteredProperties(status).length;
  };

  // Show available tabs based on what properties exist
  const availableTabs = Object.keys(statusConfig).filter(status => getStatusCount(status) > 0);
  
  // If no properties exist in active tab, switch to first available or stay on active
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab]);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2">Loading your properties...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      <strong>Error loading properties:</strong> {error}
    </div>
  );

  const filteredProperties = getFilteredProperties(activeTab);
  const totalProperties = properties.length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {userType === 'admin' ? 'All Properties' : 'My Properties'}
          </h2>
          <p className="text-gray-600">
            {totalProperties} total propert{totalProperties !== 1 ? 'ies' : 'y'} • 
            {userType === 'admin' 
              ? 'Manage all properties in your region' 
              : 'Manage your listings, track status, and update details'
            }
          </p>
        </div>
        <a
          href={createPropertyPath}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          Create Property
        </a>
      </div>

      {totalProperties === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">🏠</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Properties Yet
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start building your property portfolio by creating your first listing. 
            It only takes a few minutes to get started.
          </p>
          <a
            href={createPropertyPath}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
          >
            <span>➕</span>
            Create Your First Property
          </a>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8 overflow-x-auto">
              {availableTabs.map((status) => {
                const config = statusConfig[status as keyof typeof statusConfig];
                const count = getStatusCount(status);
                
                return (
                  <button
                    key={status}
                    onClick={() => setActiveTab(status)}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                      activeTab === status
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${
                        activeTab === status ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Description */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <span>{statusConfig[activeTab as keyof typeof statusConfig]?.icon}</span>
              <span>{statusConfig[activeTab as keyof typeof statusConfig]?.description}</span>
            </div>
          </div>

          {/* Bulk Delete Section - Admin viewing Rejected Properties */}
          {activeTab === 'rejected' && userType === 'admin' && filteredProperties.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-red-900 flex items-center gap-2 text-lg">
                    🗑️ Bulk Delete Rejected Properties
                  </h4>
                  <p className="text-sm text-red-700 mt-1">
                    Remove all <span className="font-semibold">{filteredProperties.length}</span> rejected properties to clean up your dashboard. 
                    This will permanently delete all rejected listings and their associated data.
                  </p>
                  <p className="text-xs text-red-600 mt-2 font-medium">
                    ⚠️ This action cannot be undone! Use this to prevent dashboard clutter.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleBulkDeleteRejected}
                    disabled={deletingId === 'bulk'}
                    className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    {deletingId === 'bulk' ? '⏳ Deleting All...' : `🗑️ Empty Trash (${filteredProperties.length})`}
                  </button>
                  <p className="text-xs text-gray-600 text-center">
                    "Empty Trash" Feature
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Agent/FSBO/Admin Bulk Delete Drafts Section */}
          {activeTab === 'draft' && (userType === 'agent' || userType === 'fsbo' || userType === 'admin') && filteredProperties.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 flex items-center gap-2 text-lg">
                    🗑️ Clear All Draft Properties
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Remove all <span className="font-semibold">{filteredProperties.length}</span> draft properties to clean up your workspace. 
                    This will permanently delete all unfinished listings and their associated data.
                  </p>
                  <p className="text-xs text-blue-600 mt-2 font-medium">
                    ⚠️ This action cannot be undone! Only use this to clear old drafts you no longer need.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleBulkDeleteDrafts}
                    disabled={deletingId === 'bulk-drafts'}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                  >
                    {deletingId === 'bulk-drafts' ? '⏳ Clearing All...' : `🧹 Clear All Drafts (${filteredProperties.length})`}
                  </button>
                  <p className="text-xs text-gray-600 text-center">
                    "Clear Drafts" Feature
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">{statusConfig[activeTab as keyof typeof statusConfig]?.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No {statusConfig[activeTab as keyof typeof statusConfig]?.label.toLowerCase()} properties
              </h3>
              <p className="text-gray-600">
                {activeTab === 'active' && "You don't have any live properties yet."}
                {activeTab === 'draft' && "No incomplete listings found."}
                {activeTab === 'rejected' && "No rejected properties. Great job!"}
                {activeTab === 'pending' && "No properties awaiting approval."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => {
                const config = statusConfig[property.status as keyof typeof statusConfig] || statusConfig.pending;
                const typeIcon = typeIcons[property.property_type?.toLowerCase()] || '🏠';
                const imageUrl = property.images && property.images.length > 0 
                  ? property.images[0] 
                  : 'https://placehold.co/400x300?text=No+Image';

                return (
                  <div
                    key={property.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-100"
                  >
                    {/* Image Section */}
                    <div className="relative h-48 w-full overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={property.title}
                        className={`object-cover w-full h-full hover:scale-105 transition-transform duration-200 ${['sold', 'rented', 'under_contract'].includes(property.status) ? 'opacity-70' : ''}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=No+Image';
                        }}
                      />
                      <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${config.badgeColor || config.color} shadow-sm`}>
                        {config.badgeText}
                      </span>
                      
                      {/* FSBO Badge - positioned below status badge */}
                      {(property.listed_by_type === 'owner' || property.listed_by_type === 'fsbo') && (
                        <span className="absolute top-12 left-3 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 shadow-sm">
                          For Sale By Owner
                        </span>
                      )}
                      
                      <span className="absolute top-3 right-3 text-2xl bg-white/80 rounded-full p-1">
                        {typeIcon}
                      </span>
                      
                      {/* Special action buttons for rejected properties */}
                      {property.status === 'rejected' && (
                        <div className="absolute bottom-2 left-2 right-2">
                          <button
                            onClick={() => showRejectionDetails(property)}
                            className="w-full bg-red-500 text-white text-xs py-1.5 px-2 rounded hover:bg-red-600 transition shadow-sm"
                          >
                            📋 View Rejection Details
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900 truncate pr-2" title={property.title}>
                          {property.title}
                        </h3>
                        <span className="text-blue-700 font-semibold text-sm whitespace-nowrap">
                          {formatPrice(property.price)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        📍 {property.city}, {property.region}
                      </div>
                      
                      {/* Owner Information for Admin Users */}
                      {userType === 'admin' && property.owner && (
                        <div className="bg-blue-50 rounded-lg p-2 mb-3 text-xs">
                          <div className="font-medium text-blue-800 mb-1">Property Owner</div>
                          <div className="text-blue-700">
                            <div className="flex items-center justify-between">
                              <span className="truncate">
                                {[property.owner.first_name, property.owner.last_name].filter(Boolean).join(' ') || 'Unknown User'}
                              </span>
                              <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-800 rounded text-xs font-medium">
                                {property.owner.user_type === 'owner' ? 'FSBO' : 
                                 property.owner.user_type === 'agent' ? 'Agent' : 
                                 property.owner.user_type === 'landlord' ? 'Landlord' : 
                                 property.owner.user_type}
                              </span>
                            </div>
                            <div className="text-blue-600 mt-1">📧 {property.owner.email}</div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-700">
                          <span>🛏️</span> {property.bedrooms}
                        </span>
                        <span className="flex items-center gap-1 text-gray-700">
                          <span>🛁</span> {property.bathrooms}
                        </span>
                        {property.square_footage && (
                          <span className="flex items-center gap-1 text-gray-700">
                            <span>📏</span> {property.square_footage}
                          </span>
                        )}
                      </div>

                      {/* Status-specific Content & Actions */}
                      <div className="space-y-3">
                        {/* Rejected Properties */}
                        {property.status === 'rejected' && (
                          <div className="space-y-2">
                            <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                              <strong>Rejection Reason:</strong> {property.rejection_reason || 'No specific reason provided'}
                            </div>
                            <div className="flex gap-2 text-xs">
                              <button
                                onClick={() => handleEdit(property.id)}
                                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                              >
                                🔧 Fix & Edit
                              </button>
                              <button
                                onClick={() => resubmitProperty(property.id)}
                                className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition"
                              >
                                🔄 Resubmit
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Draft Properties */}
                        {property.status === 'draft' && (
                          <div className="space-y-2">
                            <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                              <strong>Draft Status:</strong> Complete your listing to submit for approval
                            </div>
                            <div className="flex gap-2 text-xs">
                              <button
                                onClick={() => handleEdit(property.id)}
                                className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                              >
                                ✏️ Continue Editing
                              </button>
                              <button
                                onClick={() => submitDraftForReview(property.id)}
                                className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition"
                              >
                                🚀 Submit for Review
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Pending Properties */}
                        {property.status === 'pending' && (
                          <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                            <strong>Under Review:</strong> Your property is being reviewed by our admin team. 
                            You'll be notified once it's approved or if changes are needed.
                          </div>
                        )}

                        {/* Under Contract Properties */}
                        {property.status === 'under_contract' && (
                          <div className="space-y-2">
                            <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                              <strong>Under Contract:</strong> This property is under contract. Complete the sale or put it back on market.
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <button 
                                onClick={() => updatePropertyStatus(property.id, property.propertyCategory === 'rental' ? 'rented' : 'sold')}
                                className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                              >
                                {property.propertyCategory === 'rental' ? '🏠 Completed - Rented' : '🏆 Completed - Sold'}
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm('This will put your property back on the market as available.')) {
                                    updatePropertyStatus(property.id, 'active');
                                  }
                                }}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                              >
                                ↩️ Back to Market
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Off Market Properties */}
                        {property.status === 'off_market' && (
                          <div className="space-y-2">
                            <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded border border-gray-200">
                              <strong>Hidden from Public:</strong> Your property is not visible to potential {property.propertyCategory === 'rental' ? 'renters' : 'buyers'}
                            </div>
                            <div className="flex gap-2 text-xs">
                              <button 
                                onClick={() => {
                                  if (confirm('This will make your property visible to the public again.')) {
                                    updatePropertyStatus(property.id, 'active');
                                  }
                                }}
                                className="flex-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                              >
                                ✅ Put Back on Market
                              </button>
                              <button 
                                onClick={() => updatePropertyStatus(property.id, property.propertyCategory === 'rental' ? 'rented' : 'sold')}
                                className="flex-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                              >
                                {property.propertyCategory === 'rental' ? '🏠 Rented' : '🏆 Sold'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Active Properties - Status Management */}
                        {property.status === 'active' && (
                          <div className="space-y-2">
                            <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                              <strong>Live Listing:</strong> Your property is visible to potential {property.propertyCategory === 'rental' ? 'renters' : 'buyers'}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <button 
                                onClick={() => updatePropertyStatus(property.id, 'under_contract')}
                                className="px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
                                title="Mark as under contract"
                              >
                                📝 Under Contract
                              </button>
                              <button 
                                onClick={() => updatePropertyStatus(property.id, property.propertyCategory === 'rental' ? 'rented' : 'sold')}
                                className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                              >
                                {property.propertyCategory === 'rental' ? '🏠 Rented' : '🏆 Sold'}
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm('This will hide your property from public view. You can put it back on market anytime.')) {
                                    updatePropertyStatus(property.id, 'off_market');
                                  }
                                }}
                                className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition col-span-2"
                                title="Hide property from public view"
                              >
                                👁️‍🗨️ Take Off Market
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Completed Properties - Sold/Rented */}
                        {(property.status === 'sold' || property.status === 'rented') && (
                          <div className="space-y-2">
                            <div className={`text-xs p-2 rounded border font-medium ${
                              property.status === 'sold'
                                ? 'text-red-700 bg-red-50 border-red-200'
                                : 'text-blue-700 bg-blue-50 border-blue-200'
                            }`}>
                              {property.status === 'sold'
                                ? '🏆 This property has been sold'
                                : '🏠 This property has been rented'}
                            </div>
                            {/* Disabled status buttons */}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <button
                                disabled
                                className="px-2 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed opacity-50"
                                title="Status change not available"
                              >
                                📝 Under Contract
                              </button>
                              <button
                                disabled
                                className="px-2 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed opacity-50"
                              >
                                {property.propertyCategory === 'rental' ? '🏠 Rented' : '🏆 Sold'}
                              </button>
                              <button
                                disabled
                                className="px-2 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed opacity-50 col-span-2"
                              >
                                👁️‍🗨️ Take Off Market
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Standard Actions - Edit/Delete always available */}
                        <div className="flex gap-2 pt-2 border-t border-gray-100">
                          <button
                            className="flex-1 bg-gray-600 text-white px-3 py-1.5 rounded hover:bg-gray-700 text-xs transition"
                            onClick={() => handleEdit(property.id)}
                            disabled={deletingId === property.id}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="flex-1 bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 text-xs transition"
                            onClick={() => handleDelete(property.id)}
                            disabled={deletingId === property.id}
                          >
                            {deletingId === property.id ? '⏳ Deleting...' : '🗑️ Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Rejection Details Modal */}
      {showRejectionModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                  <span>❌</span>
                  Property Rejected
                </h3>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-1">{selectedProperty.title}</h4>
                <p className="text-sm text-gray-600">📍 {selectedProperty.city}, {selectedProperty.region}</p>
                <p className="text-sm text-gray-600">💰 {formatPrice(selectedProperty.price)}</p>
              </div>

              <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h5 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <span>📋</span>
                  Rejection Details
                </h5>
                <div className="text-red-700 text-sm leading-relaxed">
                  {selectedProperty.rejection_reason || 'No specific reason was provided by the admin team. Please contact support for more information.'}
                </div>
              </div>

              {selectedProperty.reviewed_by && (
                <div className="mb-6 text-xs text-gray-600 bg-gray-50 p-3 rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <span>👤</span>
                    <span>Reviewed by: <strong>{selectedProperty.reviewed_by}</strong></span>
                  </div>
                  {selectedProperty.reviewed_at && (
                    <div className="flex items-center gap-2">
                      <span>📅</span>
                      <span>Date: {new Date(selectedProperty.reviewed_at).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                  <strong>💡 What to do next:</strong>
                  <ol className="mt-2 ml-4 list-decimal space-y-1 text-xs">
                    <li>Review the rejection reason carefully</li>
                    <li>Fix the issues mentioned by clicking "Fix Issues & Edit"</li>
                    <li>Resubmit your property for review</li>
                    <li>Our team will review it again within 24-48 hours</li>
                  </ol>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectionModal(false);
                      handleEdit(selectedProperty.id);
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-medium"
                  >
                    🔧 Fix Issues & Edit
                  </button>
                  <button
                    onClick={() => setShowRejectionModal(false)}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}