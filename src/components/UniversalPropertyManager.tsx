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
  propertyCategory: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-700',
    badgeText: 'LIVE',
    icon: '✅',
    description: 'Properties that are live and visible to potential buyers/renters'
  },
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-700',
    badgeText: 'UNDER REVIEW',
    icon: '⏳',
    description: 'Properties waiting for admin approval'
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-200 text-red-800',
    badgeText: 'REJECTED',
    icon: '❌',
    description: 'Properties that were rejected and need fixes before resubmission'
  },
  draft: {
    label: 'Drafts',
    color: 'bg-blue-100 text-blue-700',
    badgeText: 'DRAFT',
    icon: '📝',
    description: 'Incomplete property listings that need to be finished'
  },
  off_market: {
    label: 'Off Market',
    color: 'bg-gray-100 text-gray-700',
    badgeText: 'HIDDEN',
    icon: '👁️‍🗨️',
    description: 'Properties hidden from public view by owner choice'
  },
  sold: {
    label: 'Sold',
    color: 'bg-red-100 text-red-700',
    badgeText: 'SOLD',
    icon: '🏆',
    description: 'Properties that have been sold'
  },
  rented: {
    label: 'Rented',
    color: 'bg-purple-100 text-purple-700',
    badgeText: 'RENTED',
    icon: '🏠',
    description: 'Properties that have been rented'
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
}

export default function UniversalPropertyManager({ 
  userId, 
  userType,
  createPropertyPath = '/properties/create',
  editPropertyPath = '/dashboard/agent/edit-property'
}: UniversalPropertyManagerProps) {
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
      setProperties(prev => prev.filter(p => p.id !== id));
      alert('Property deleted successfully');
    } catch (err) {
      alert('Error deleting property. Please try again.');
      console.error('Delete error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (id: string) => {
    window.location.href = `${editPropertyPath}/${id}`;
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
      
      await fetchProperties();
      alert(`Property status updated to ${newStatus}!`);
    } catch (err) {
      alert('Error updating property status');
      console.error(err);
    }
  };

  const resubmitProperty = async (propertyId: string) => {
    if (confirm('This will resubmit your property for admin review. Make sure you have fixed the issues mentioned in the rejection reason.')) {
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
          <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
          <p className="text-gray-600">
            {totalProperties} total propert{totalProperties !== 1 ? 'ies' : 'y'} • 
            Manage your listings, track status, and update details
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
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=No+Image';
                        }}
                      />
                      <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${config.color} shadow-sm`}>
                        {config.badgeText}
                      </span>
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
                            <button
                              onClick={() => handleEdit(property.id)}
                              className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm font-medium"
                            >
                              ✏️ Continue Editing
                            </button>
                          </div>
                        )}

                        {/* Pending Properties */}
                        {property.status === 'pending' && (
                          <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                            <strong>Under Review:</strong> Your property is being reviewed by our admin team. 
                            You'll be notified once it's approved or if changes are needed.
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
                                onClick={() => updatePropertyStatus(property.id, 'pending')}
                                className="px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition"
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

                        {/* Completed Properties */}
                        {(property.status === 'sold' || property.status === 'rented') && (
                          <div className="text-xs text-purple-700 bg-purple-50 p-2 rounded border border-purple-200 font-medium">
                            🎉 Congratulations! Property successfully {property.status === 'sold' ? 'sold' : 'rented'}
                          </div>
                        )}

                        {/* Standard Actions */}
                        {!['sold', 'rented'].includes(property.status) && (
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
                        )}
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