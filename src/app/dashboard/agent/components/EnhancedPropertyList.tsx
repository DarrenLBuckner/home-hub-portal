'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';

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
  listed_by_type?: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700',
    badgeColor: 'bg-green-600 text-white',
    badgeText: 'LIVE',
    icon: '✅',
    description: 'Property is live and visible to potential buyers/renters',
    statusMessage: null as string | null
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700',
    badgeColor: 'bg-yellow-500 text-white',
    badgeText: 'UNDER REVIEW',
    icon: '⏳',
    description: 'Property is waiting for admin approval',
    statusMessage: 'This property is awaiting admin approval'
  },
  under_contract: {
    label: 'Under Contract',
    color: 'bg-orange-100 text-orange-700',
    badgeColor: 'bg-[#F97316] text-white',
    badgeText: 'UNDER CONTRACT',
    icon: '📝',
    description: 'Property is under contract but not yet sold/rented',
    statusMessage: 'This property is under contract'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-200 text-red-800',
    badgeColor: 'bg-red-600 text-white',
    badgeText: 'REJECTED',
    icon: '❌',
    description: 'Property was rejected and needs fixes before resubmission',
    statusMessage: 'This property was rejected'
  },
  draft: {
    label: 'Draft',
    color: 'bg-blue-100 text-blue-700',
    badgeColor: 'bg-blue-500 text-white',
    badgeText: 'DRAFT',
    icon: '📝',
    description: 'Incomplete property listing that needs to be finished',
    statusMessage: 'This is a draft'
  },
  sold: {
    label: 'Sold',
    color: 'bg-red-100 text-red-700',
    badgeColor: 'bg-[#DC2626] text-white',
    badgeText: 'SOLD',
    icon: '🏆',
    description: 'Property has been sold',
    statusMessage: 'This property has been sold'
  },
  rented: {
    label: 'Rented',
    color: 'bg-blue-100 text-blue-700',
    badgeColor: 'bg-[#2563EB] text-white',
    badgeText: 'RENTED',
    icon: '🏠',
    description: 'Property has been rented',
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

export default function EnhancedPropertyList({ userId }: { userId: string }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('active');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [userId]);

  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProperties(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    
    setDeletingId(id);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert('Error deleting property');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: string) => {
    window.location.href = `/dashboard/agent/edit-property/${id}`;
  };

  const updatePropertyStatus = async (propertyId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId)
        .eq('user_id', userId);

      if (error) throw error;
      
      await fetchProperties(); // Refresh the list
      alert(`Property status updated to ${newStatus}!`);
    } catch (err) {
      alert('Error updating property status');
      console.error(err);
    }
  };

  const resubmitProperty = async (propertyId: string) => {
    await updatePropertyStatus(propertyId, 'pending');
  };

  const continueDraft = (property: Property) => {
    // Redirect to edit page to continue working on draft
    window.location.href = `/dashboard/agent/edit-property/${property.id}`;
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

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2">Loading properties...</span>
    </div>
  );

  if (error) return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      Error: {error}
    </div>
  );

  const filteredProperties = getFilteredProperties(activeTab);
  const availableTabs = Object.keys(statusConfig).filter(status => getStatusCount(status) > 0);

  return (
    <div className="w-full">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {availableTabs.map((status) => {
            const config = statusConfig[status as keyof typeof statusConfig];
            const count = getStatusCount(status);
            
            return (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
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

      {/* Tab Content */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{statusConfig[activeTab as keyof typeof statusConfig].icon}</span>
          <span>{statusConfig[activeTab as keyof typeof statusConfig].description}</span>
        </div>
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">{statusConfig[activeTab as keyof typeof statusConfig].icon}</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {statusConfig[activeTab as keyof typeof statusConfig].label.toLowerCase()} properties
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
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden"
              >
                {/* Image Section */}
                <div className="relative h-48 w-full overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={property.title}
                    className={`object-cover w-full h-full ${['sold', 'rented', 'under_contract'].includes(property.status) ? 'opacity-70' : ''}`}
                  />
                  <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${config.badgeColor || config.color}`}>
                    {config.badgeText}
                  </span>
                  
                  {/* FSBO Badge - positioned below status badge */}
                  {(property.listed_by_type === 'owner' || property.listed_by_type === 'fsbo') && (
                    <span className="absolute top-12 left-3 px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 shadow-sm">
                      For Sale By Owner
                    </span>
                  )}
                  
                  <span className="absolute top-3 right-3 text-2xl">{typeIcon}</span>
                  
                  {/* Rejection indicator */}
                  {property.status === 'rejected' && (
                    <div className="absolute bottom-2 left-2 right-2">
                      <button
                        onClick={() => showRejectionDetails(property)}
                        className="w-full bg-red-500 text-white text-xs py-1 px-2 rounded hover:bg-red-600 transition"
                      >
                        View Rejection Reason
                      </button>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{property.title}</h3>
                    <span className="text-blue-700 font-semibold">{formatPrice(property.price)}</span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {property.city}, {property.region}
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <span className="flex items-center gap-1 text-gray-700">
                      <span role="img" aria-label="bed">🛏️</span> {property.bedrooms}
                    </span>
                    <span className="flex items-center gap-1 text-gray-700">
                      <span role="img" aria-label="bath">🛁</span> {property.bathrooms}
                    </span>
                    {property.square_footage && (
                      <span className="flex items-center gap-1 text-gray-700">
                        <span role="img" aria-label="sqft">📏</span> {property.square_footage} sqft
                      </span>
                    )}
                  </div>

                  {/* Status-specific Actions */}
                  <div className="space-y-2">
                    {property.status === 'active' && (
                      <div className="flex gap-2 flex-wrap text-xs">
                        <button 
                          onClick={() => updatePropertyStatus(property.id, 'under_contract')}
                          className="px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 transition"
                        >
                          📝 Mark Under Contract
                        </button>
                        {property.listing_type === 'rent' ? (
                          <button 
                            onClick={() => updatePropertyStatus(property.id, 'rented')}
                            className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          >
                            🏠 Mark Rented
                          </button>
                        ) : (
                          <button 
                            onClick={() => updatePropertyStatus(property.id, 'sold')}
                            className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          >
                            🏆 Mark Sold
                          </button>
                        )}
                      </div>
                    )}

                    {property.status === 'rejected' && (
                      <div className="space-y-2">
                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                          <strong>Rejected:</strong> {property.rejection_reason || 'No specific reason provided'}
                        </div>
                        <div className="flex gap-2 text-xs">
                          <button
                            onClick={() => handleEdit(property.id)}
                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                          >
                            🔧 Fix & Edit
                          </button>
                          <button
                            onClick={() => resubmitProperty(property.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                          >
                            🔄 Resubmit
                          </button>
                        </div>
                      </div>
                    )}

                    {property.status === 'draft' && (
                      <div className="space-y-2">
                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                          <strong>Draft:</strong> Complete your listing to submit for approval
                        </div>
                        <button
                          onClick={() => continueDraft(property)}
                          className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                        >
                          ✏️ Continue Editing
                        </button>
                      </div>
                    )}

                    {property.status === 'pending' && (
                      <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                        <strong>Under Review:</strong> Your property is being reviewed by our team
                      </div>
                    )}

                    {property.status === 'under_contract' && (
                      <div className="space-y-2">
                        <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                          <strong>Under Contract:</strong> This property is under contract
                        </div>
                        <div className="flex gap-2 text-xs">
                          <button 
                            onClick={() => updatePropertyStatus(property.id, property.listing_type === 'rent' ? 'rented' : 'sold')}
                            className="flex-1 px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          >
                            {property.listing_type === 'rent' ? '🏠 Completed - Rented' : '🏆 Completed - Sold'}
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Put property back on market?')) {
                                updatePropertyStatus(property.id, 'active');
                              }
                            }}
                            className="flex-1 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition"
                          >
                            ↩️ Back to Market
                          </button>
                        </div>
                      </div>
                    )}

                    {(property.status === 'sold' || property.status === 'rented') && (
                      <div className="space-y-2">
                        <div className={`text-xs p-2 rounded font-semibold ${
                          property.status === 'sold'
                            ? 'text-red-700 bg-red-50 border border-red-200'
                            : 'text-blue-700 bg-blue-50 border border-blue-200'
                        }`}>
                          {property.status === 'sold'
                            ? '🏆 This property has been sold'
                            : '🏠 This property has been rented'}
                        </div>
                        {/* Disabled status buttons */}
                        <div className="flex gap-2 flex-wrap text-xs">
                          <button disabled className="px-2 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed opacity-50">
                            📝 Under Contract
                          </button>
                          <button disabled className="px-2 py-1 bg-gray-300 text-gray-500 rounded cursor-not-allowed opacity-50">
                            {property.listing_type === 'rent' ? '🏠 Rented' : '🏆 Sold'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Standard Edit/Delete Actions - Always available */}
                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        className="flex-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm transition"
                        onClick={() => handleEdit(property.id)}
                        disabled={deletingId === property.id}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="flex-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm transition"
                        onClick={() => handleDelete(property.id)}
                        disabled={deletingId === property.id}
                      >
                        {deletingId === property.id ? '...' : '🗑️ Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Details Modal */}
      {showRejectionModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600">
                  ❌ Property Rejected
                </h3>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-1">{selectedProperty.title}</h4>
                <p className="text-sm text-gray-600">{selectedProperty.city}, {selectedProperty.region}</p>
              </div>

              <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200">
                <h5 className="font-medium text-red-800 mb-2">Rejection Reason:</h5>
                <p className="text-red-700 text-sm">
                  {selectedProperty.rejection_reason || 'No specific reason was provided by the admin.'}
                </p>
              </div>

              {selectedProperty.reviewed_by && (
                <div className="mb-4 text-xs text-gray-600">
                  <p>Reviewed by: {selectedProperty.reviewed_by}</p>
                  {selectedProperty.reviewed_at && (
                    <p>Date: {new Date(selectedProperty.reviewed_at).toLocaleDateString()}</p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRejectionModal(false);
                    handleEdit(selectedProperty.id);
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
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
      )}
    </div>
  );
}