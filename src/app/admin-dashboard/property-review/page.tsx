"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAdminData, getAdminDisplayName } from '@/hooks/useAdminData';

interface Property {
  id: string;
  title: string;  
  description: string;
  price: number;
  property_type: string;
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
  currency?: string;
  listing_type?: string;
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

interface PropertyFilters {
  status: string;
  userType: string;
  priceRange: string;
  region: string;
  propertyType: string;
}

export default function PropertyReviewPage() {
  const router = useRouter();
  const { adminData, permissions, isAdmin, isLoading: adminLoading, error: adminError } = useAdminData();
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [priceEditMode, setPriceEditMode] = useState<string | null>(null);
  const [newPrice, setNewPrice] = useState<string>("");
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignTargetId, setReassignTargetId] = useState<string>("");
  const [availableAgents, setAvailableAgents] = useState<Array<{id: string; first_name: string; last_name: string; company: string; user_type: string}>>([]);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ propertyId: string; status: string; propertyTitle: string; actionLabel: string } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState<PropertyFilters>({
    status: 'all',
    userType: 'all',
    priceRange: 'all',
    region: 'all',
    propertyType: 'all'
  });

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
      console.log('❌ Not authorized to view property review.');
      alert('Access denied. Admin privileges required.');
      router.push('/admin-login');
      return;
    }
    
    loadProperties();
  }, [adminLoading, adminError, isAdmin, router]);

  // Apply filters whenever filters or properties change
  useEffect(() => {
    applyFilters();
  }, [properties, filters]);

  const displayUserType = (dbValue: string) => {
    const map: { [key: string]: string } = {
      'owner': 'FSBO',
      'agent': 'Agent', 
      'landlord': 'Landlord'
    };
    return map[dbValue] || dbValue;
  };

  async function loadProperties() {
    try {
      console.log('🔄 Loading all properties for review via admin API...');

      // Use server-side API endpoint which uses service role key (bypasses RLS)
      // This ensures all admin levels (super, owner, basic) can see properties
      const response = await fetch('/api/admin/properties', {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error('Properties API error:', response.status, errData);
        setError(errData.error || 'Failed to load properties');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setProperties(data.properties || []);
      setLoading(false);

    } catch (error) {
      console.error('Property load error:', error);
      setError('Failed to load properties');
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...properties];
    
    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    
    // User type filter
    if (filters.userType !== 'all') {
      filtered = filtered.filter(p => p.owner?.user_type === filters.userType);
    }
    
    // Price range filter
    if (filters.priceRange !== 'all') {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(p => {
        if (max) {
          return p.price >= min && p.price <= max;
        } else {
          return p.price >= min;
        }
      });
    }
    
    // Region filter
    if (filters.region !== 'all') {
      filtered = filtered.filter(p => p.region === filters.region);
    }
    
    // Property type filter
    if (filters.propertyType !== 'all') {
      filtered = filtered.filter(p => p.property_type === filters.propertyType);
    }
    
    setFilteredProperties(filtered);
  }

  async function updatePropertyPrice(propertyId: string, newPrice: number) {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          price: newPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) {
        alert('Error updating price');
        console.error(error);
      } else {
        alert('✅ Price updated successfully!');
        await loadProperties(); // Reload to get fresh data
        setPriceEditMode(null);
        setNewPrice("");
        setShowPriceModal(false);
      }
    } catch (error) {
      alert('Error updating price');
      console.error(error);
    }
  }

  // Opens confirmation dialog before changing property status
  function requestStatusChange(propertyId: string, newStatus: string, propertyTitle: string, actionLabel: string) {
    setConfirmAction({ propertyId, status: newStatus, propertyTitle, actionLabel });
    setShowConfirmDialog(true);
  }

  // Actually performs the status change after confirmation
  async function executeStatusChange() {
    if (!confirmAction) return;
    setConfirmLoading(true);
    try {
      const response = await fetch(`/api/properties/status/${confirmAction.propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: confirmAction.status
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Error: ${result.error || 'Unknown error'}`);
        console.error('Status update error:', result);
      } else {
        alert(`✅ ${result.message || 'Property status updated successfully'}!`);
        await loadProperties();
      }
    } catch (error) {
      alert('Error updating status');
      console.error('Status update error:', error);
    } finally {
      setConfirmLoading(false);
      setShowConfirmDialog(false);
      setConfirmAction(null);
    }
  }

  const isBasicAdmin = adminData?.admin_level === 'basic';
  const canManageStatus = !isBasicAdmin; // Only super/owner can mark under contract, sold, rented, change price
  const canReassign = true; // All admin levels can reassign (basic admins create properties for others)

  // Get unique values for filter dropdowns
  const uniqueRegions = [...new Set(properties.map(p => p.region).filter(Boolean))];
  const uniquePropertyTypes = [...new Set(properties.map(p => p.property_type).filter(Boolean))];

  const handlePriceEdit = (property: Property) => {
    setSelectedProperty(property);
    setNewPrice(property.price.toString());
    setShowPriceModal(true);
  };

  const getEditUrl = (property: Property) => {
    const userType = property.owner?.user_type || property.listed_by_type;
    switch (userType) {
      case 'agent':
        return `/dashboard/agent/edit-property/${property.id}`;
      case 'owner':
        return `/dashboard/owner/edit-property/${property.id}`;
      case 'landlord':
        return `/dashboard/landlord/edit-property/${property.id}`;
      default:
        return `/dashboard/owner/edit-property/${property.id}`;
    }
  };

  async function handleReassignOpen(property: Property) {
    setSelectedProperty(property);
    setReassignTargetId("");
    setShowReassignModal(true);

    // Load available agents/users for the dropdown via admin API (bypasses RLS)
    try {
      const response = await fetch('/api/admin/users', {
        cache: 'no-store',
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableAgents(data.users || []);
      } else {
        console.error('Error loading agents:', response.status);
      }
    } catch (err) {
      console.error('Error loading agents:', err);
    }
  }

  async function handleReassign() {
    if (!selectedProperty || !reassignTargetId) return;

    setReassignLoading(true);
    try {
      const response = await fetch(`/api/properties/update/${selectedProperty.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reassign_to_user_id: reassignTargetId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Error reassigning property: ${result.error || 'Unknown error'}`);
      } else {
        const targetAgent = availableAgents.find(a => a.id === reassignTargetId);
        const targetName = targetAgent ? `${targetAgent.first_name} ${targetAgent.last_name}` : reassignTargetId;
        alert(`Property reassigned to ${targetName} successfully!`);
        setShowReassignModal(false);
        setSelectedProperty(null);
        setReassignTargetId("");
        await loadProperties();
      }
    } catch (err) {
      alert('Error reassigning property');
      console.error(err);
    } finally {
      setReassignLoading(false);
    }
  }

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading property review dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">📋 Property Review & Management</h1>
              <p className="text-sm text-gray-600">Comprehensive property management, pricing, and review center</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/admin-dashboard">
                <button className="px-3 py-2 bg-gray-600 text-white text-sm font-bold rounded-lg hover:bg-gray-700 transition-colors">
                  ← Back to Dashboard
                </button>
              </Link>
              <button
                onClick={loadProperties}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
          
          <div className="text-xs text-gray-600">
            Welcome, {getAdminDisplayName(adminData)} • {permissions?.displayRole || 'Admin'}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">🔍 Filter Properties</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* User Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">User Type</label>
              <select
                value={filters.userType}
                onChange={(e) => setFilters({...filters, userType: e.target.value})}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="owner">FSBO</option>
                <option value="agent">Agent</option>
                <option value="landlord">Landlord</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Price Range</label>
              <select
                value={filters.priceRange}
                onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Prices</option>
                <option value="0-50000">Under $50K</option>
                <option value="50000-100000">$50K - $100K</option>
                <option value="100000-200000">$100K - $200K</option>
                <option value="200000-500000">$200K - $500K</option>
                <option value="500000">$500K+</option>
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters({...filters, region: e.target.value})}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Regions</option>
                {uniqueRegions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            {/* Property Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => setFilters({...filters, propertyType: e.target.value})}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                {uniquePropertyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredProperties.length} of {properties.length} properties
            </div>
            <button
              onClick={() => setFilters({
                status: 'all',
                userType: 'all', 
                priceRange: 'all',
                region: 'all',
                propertyType: 'all'
              })}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Properties List */}
        <div className="space-y-4">
          {filteredProperties.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-gray-700 mb-2">No properties match your filters</h3>
              <p className="text-gray-600">Try adjusting your filters to see more properties.</p>
            </div>
          ) : (
            filteredProperties.map((property) => {
              const primaryImage = property.property_media?.find(media => media.is_primary);
              const statusColor = {
                'pending': 'bg-yellow-100 text-yellow-800',
                'available': 'bg-green-100 text-green-800',
                'sold': 'bg-[#DC2626] text-white',
                'rented': 'bg-[#2563EB] text-white',
                'under_contract': 'bg-[#F97316] text-white',
                'rejected': 'bg-red-100 text-red-800'
              }[property.status] || 'bg-gray-100 text-gray-800';

              const statusMessages: { [key: string]: string } = {
                sold: 'This property has been sold',
                rented: 'This property has been rented',
                under_contract: 'This property is under contract',
              };

              const isCompletedStatus = ['sold', 'rented', 'under_contract'].includes(property.status);

              return (
                <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Property Image */}
                      <div className="flex-shrink-0">
                        <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden">
                          {primaryImage ? (
                            <img
                              src={primaryImage.media_url}
                              alt={property.title}
                              className={`w-full h-full object-cover ${isCompletedStatus ? 'opacity-70' : ''}`}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <div className="text-center">
                                <div className="text-2xl mb-1">🏡</div>
                                <div className="text-xs">No Image</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                                {property.status.toUpperCase()}
                              </span>
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                                {displayUserType(property.owner?.user_type || '')}
                              </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{property.title}</h3>
                            <p className="text-sm text-gray-600">📍 {property.region}, {property.city}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              🛏 {property.bedrooms} bed • 🚿 {property.bathrooms} bath • {property.property_type}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-600 mb-1">
                              ${property.price.toLocaleString()} {property.currency || 'USD'}
                            </div>
                            <div className="text-xs text-gray-500">
                              Listed {new Date(property.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        {/* Owner Info */}
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="text-xs font-medium text-gray-700 mb-1">Property Owner</div>
                          <div className="text-sm text-gray-600">
                            📧 {property.owner_email} {property.owner_whatsapp && `• 📱 ${property.owner_whatsapp}`}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {property.owner ? 
                              [property.owner.first_name, property.owner.last_name].filter(Boolean).join(' ') || 'Unknown User'
                              : 'Unknown User'
                            }
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/* Price Management - Super/Owner only */}
                          {canManageStatus && (
                            <button
                              onClick={() => handlePriceEdit(property)}
                              className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
                            >
                              💰 Change Price
                            </button>
                          )}

                          {/* Edit Property - All admins */}
                          <Link href={getEditUrl(property)}>
                            <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                              ✏️ Edit Property
                            </button>
                          </Link>

                          {/* Reassign - All admin levels (basic admins create properties for others) */}
                          {canReassign && (
                            <button
                              onClick={() => handleReassignOpen(property)}
                              className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                              🔄 Reassign
                            </button>
                          )}

                          {/* Status Management */}
                          {(property.status === 'pending' || property.status === 'draft') && (
                            <>
                              <button
                                onClick={() => requestStatusChange(property.id, 'active', property.title, 'Approve')}
                                className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                              >
                                ✅ Approve
                              </button>
                              <button
                                onClick={() => requestStatusChange(property.id, 'rejected', property.title, 'Reject')}
                                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                              >
                                ❌ Reject
                              </button>
                            </>
                          )}

                          {property.status === 'active' && canManageStatus && (
                            <>
                              <button
                                onClick={() => requestStatusChange(property.id, 'under_contract', property.title, 'Mark Under Contract')}
                                className="px-4 py-2 bg-[#F97316] text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
                              >
                                📝 Mark Under Contract
                              </button>
                              <button
                                onClick={() => requestStatusChange(property.id, property.listing_type === 'rental' ? 'rented' : 'sold', property.title, property.listing_type === 'rental' ? 'Mark Rented' : 'Mark Sold')}
                                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                {property.listing_type === 'rental' ? '🏠 Mark Rented' : '🏆 Mark Sold'}
                              </button>
                            </>
                          )}

                          {property.status === 'under_contract' && canManageStatus && (
                            <>
                              <button
                                onClick={() => requestStatusChange(property.id, property.listing_type === 'rental' ? 'rented' : 'sold', property.title, property.listing_type === 'rental' ? 'Complete - Rented' : 'Complete - Sold')}
                                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                {property.listing_type === 'rental' ? '🏠 Completed - Rented' : '🏆 Completed - Sold'}
                              </button>
                              <button
                                onClick={() => requestStatusChange(property.id, 'active', property.title, 'Put Back on Market')}
                                className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                              >
                                ↩️ Back to Market
                              </button>
                            </>
                          )}

                          {(property.status === 'sold' || property.status === 'rented') && (
                            <div className="flex items-center gap-3">
                              <span className={`font-semibold ${property.status === 'sold' ? 'text-[#DC2626]' : 'text-[#2563EB]'}`}>
                                {statusMessages[property.status]}
                              </span>
                            </div>
                          )}

                          {/* View Details - All admins */}
                          <button
                            onClick={() => window.open(getEditUrl(property) + '?mode=view', '_blank')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            title="View property details in new tab"
                          >
                            👁 View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Price Edit Modal */}
      {showPriceModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">💰 Update Property Price</h3>
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setSelectedProperty(null);
                  setNewPrice("");
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Property: <strong>{selectedProperty.title}</strong></p>
              <p className="text-sm text-gray-600 mb-4">Current Price: <strong>${selectedProperty.price.toLocaleString()}</strong></p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Price <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Enter new price"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              />
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  const price = parseFloat(newPrice);
                  if (price && price > 0) {
                    updatePropertyPrice(selectedProperty.id, price);
                  } else {
                    alert('Please enter a valid price');
                  }
                }}
                disabled={!newPrice || parseFloat(newPrice) <= 0}
                className="w-full px-4 py-3 bg-yellow-500 text-black font-bold rounded-xl hover:bg-yellow-400 transition-colors disabled:opacity-50"
              >
                💰 Update Price
              </button>
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setSelectedProperty(null);
                  setNewPrice("");
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Property Modal */}
      {showReassignModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">🔄 Reassign Property</h3>
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedProperty(null);
                  setReassignTargetId("");
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Property: <strong>{selectedProperty.title}</strong></p>
              <p className="text-sm text-gray-600 mb-4">
                Current owner: <strong>
                  {selectedProperty.owner
                    ? `${selectedProperty.owner.first_name} ${selectedProperty.owner.last_name}`
                    : 'Unknown'}
                </strong>
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reassign to <span className="text-red-500">*</span>
              </label>
              <select
                value={reassignTargetId}
                onChange={(e) => setReassignTargetId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select an agent or user...</option>
                {availableAgents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.first_name} {agent.last_name}
                    {agent.company ? ` — ${agent.company}` : ''}
                    {` (${agent.user_type})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleReassign}
                disabled={!reassignTargetId || reassignLoading}
                className="w-full px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {reassignLoading ? 'Reassigning...' : '🔄 Reassign Property'}
              </button>
              <button
                onClick={() => {
                  setShowReassignModal(false);
                  setSelectedProperty(null);
                  setReassignTargetId("");
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Confirm Action</h3>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">
                Property: <strong>{confirmAction.propertyTitle}</strong>
              </p>
              <div className={`p-4 rounded-lg ${
                confirmAction.status === 'rejected' ? 'bg-red-50 border border-red-200' :
                confirmAction.status === 'active' ? 'bg-green-50 border border-green-200' :
                'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className={`text-sm font-medium ${
                  confirmAction.status === 'rejected' ? 'text-red-800' :
                  confirmAction.status === 'active' ? 'text-green-800' :
                  'text-yellow-800'
                }`}>
                  Are you sure you want to <strong>{confirmAction.actionLabel}</strong> this property?
                </p>
                {confirmAction.status === 'rejected' && (
                  <p className="text-xs text-red-600 mt-2">This will remove the property from the marketplace.</p>
                )}
                {(confirmAction.status === 'sold' || confirmAction.status === 'rented') && (
                  <p className="text-xs text-yellow-600 mt-2">This will mark the property as no longer available.</p>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={executeStatusChange}
                disabled={confirmLoading}
                className={`w-full px-4 py-3 font-bold rounded-xl transition-colors disabled:opacity-50 ${
                  confirmAction.status === 'rejected'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : confirmAction.status === 'active'
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {confirmLoading ? 'Processing...' : `Yes, ${confirmAction.actionLabel}`}
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  setConfirmAction(null);
                }}
                disabled={confirmLoading}
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