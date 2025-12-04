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
      console.log('🔄 Loading all properties for review...');
      
      // Build query with profiles data
      let propertiesQuery = supabase
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

      // Apply country filter for non-super admins
      if (permissions && !permissions.canViewAllCountries && permissions.countryFilter) {
        propertiesQuery = propertiesQuery.eq('country_id', permissions.countryFilter);
      }

      const { data: allProperties, error: propertiesError } = await propertiesQuery;

      if (propertiesError) {
        console.error('Properties error:', propertiesError);
        setError('Failed to load properties');
        return;
      }

      setProperties(allProperties || []);
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

  async function updatePropertyStatus(propertyId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/properties/status/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(`Error updating status: ${result.error || 'Unknown error'}`);
        console.error('Status update error:', result);
      } else {
        alert(`✅ ${result.message || 'Property status updated successfully'}!`);
        await loadProperties();
      }
    } catch (error) {
      alert('Error updating status');
      console.error('Status update error:', error);
    }
  }

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
                'sold': 'bg-purple-100 text-purple-800',
                'rented': 'bg-blue-100 text-blue-800',
                'rejected': 'bg-red-100 text-red-800'
              }[property.status] || 'bg-gray-100 text-gray-800';

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
                              className="w-full h-full object-cover"
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
                          {/* Price Management */}
                          <button
                            onClick={() => handlePriceEdit(property)}
                            className="px-4 py-2 bg-yellow-500 text-black font-bold rounded-lg hover:bg-yellow-400 transition-colors flex items-center gap-2"
                          >
                            💰 Change Price
                          </button>

                          {/* Edit Property */}
                          <Link href={getEditUrl(property)}>
                            <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                              ✏️ Edit Property
                            </button>
                          </Link>

                          {/* Status Management */}
                          {(property.status === 'pending' || property.status === 'draft') && (
                            <>
                              <button
                                onClick={() => updatePropertyStatus(property.id, 'active')}
                                className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
                              >
                                ✅ Approve
                              </button>
                              <button
                                onClick={() => updatePropertyStatus(property.id, 'rejected')}
                                className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                              >
                                ❌ Reject
                              </button>
                            </>
                          )}

                          {property.status === 'available' && (
                            <>
                              <button
                                onClick={() => updatePropertyStatus(property.id, property.listing_type === 'rental' ? 'rented' : 'sold')}
                                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                {property.listing_type === 'rental' ? '🏠 Mark Rented' : '🏆 Mark Sold'}
                              </button>
                              <button
                                onClick={() => updatePropertyStatus(property.id, 'pending')}
                                className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors"
                              >
                                📝 Under Contract
                              </button>
                            </>
                          )}

                          {/* View Details - Opens property in new tab */}
                          <button 
                            onClick={() => window.open(getEditUrl(property), '_blank')}
                            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            title="View/edit property details in new tab"
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