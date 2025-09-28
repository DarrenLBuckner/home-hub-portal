"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAdminData } from '@/hooks/useAdminData';

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
  owner_email: string;
  owner_whatsapp: string;
  user_id: string;
  rejection_reason?: string;
  property_media: Array<{
    media_url: string;
    is_primary: boolean;
  }>;
  profiles: {
    first_name: string;
    last_name: string;
    user_type: string;
  };
}

export default function MobilePropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;
  const { isAdmin, isLoading: adminLoading } = useAdminData();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (adminLoading) return;
    
    if (!isAdmin) {
      router.push('/admin-login');
      return;
    }
    
    loadProperty();
  }, [adminLoading, isAdmin, propertyId, router]);

  async function loadProperty() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (error) {
        setError('Property not found');
        return;
      }

      setProperty(data);
    } catch (error) {
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'approve' | 'reject') {
    if (!property) return;
    
    setProcessingAction(action);
    
    try {
      if (action === 'reject' && !rejectReason.trim()) {
        setError('Please provide a reason for rejection');
        setProcessingAction(null);
        return;
      }

      const response = await fetch(`/api/properties/update/${property.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'approve' ? 'active' : 'rejected',
          rejection_reason: action === 'reject' ? rejectReason : undefined,
        }),
      });

      if (response.ok) {
        // Show success and redirect
        alert(`Property ${action === 'approve' ? 'approved' : 'rejected'} successfully!`);
        router.push('/admin-dashboard/mobile');
      } else {
        setError(`Failed to ${action} property`);
      }
    } catch (error) {
      setError('Network error occurred');
    }
    
    setProcessingAction(null);
    setShowRejectModal(false);
  }

  const displayUserType = (dbValue: string) => {
    const map: { [key: string]: string } = {
      'owner': 'FSBO',
      'agent': 'Agent', 
      'landlord': 'Landlord'
    };
    return map[dbValue] || dbValue;
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg text-center">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Property Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'This property may have been removed or does not exist.'}</p>
            <Link href="/admin-dashboard/mobile">
              <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = property.property_media || [];
  const primaryImage = images.find(img => img.is_primary) || images[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header with Back Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin-dashboard/mobile">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
                <span className="text-xl">←</span>
                <span className="text-sm font-medium">Back to Dashboard</span>
              </button>
            </Link>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase ${
                property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                property.status === 'active' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {property.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Image Gallery - Fortune 500 Style */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg mb-6">
          <div className="relative">
            {images.length > 0 ? (
              <div className="relative w-full h-80 sm:h-96 bg-gray-100">
                <img 
                  src={images[currentImageIndex]?.media_url || primaryImage?.media_url} 
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
                
                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1)}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg hover:bg-opacity-75 transition-all"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg hover:bg-opacity-75 transition-all"
                    >
                      ›
                    </button>
                    
                    {/* Image Indicators */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                {/* Price Overlay */}
                <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full">
                  <span className="text-lg font-bold">${property.price.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-80 sm:h-96 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🏡</div>
                  <p className="text-gray-500 font-medium">No images available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Property Information - Mobile-First Cards */}
        <div className="space-y-6">
          {/* Title & Basic Info */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  <span className="flex items-center">📍 {property.region}, {property.city}</span>
                  <span className="flex items-center">🏠 {property.property_type}</span>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 py-4 bg-gray-50 rounded-xl">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
                <div className="text-sm text-gray-600">🛏 Bedrooms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
                <div className="text-sm text-gray-600">🚿 Bathrooms</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{displayUserType(property.profiles.user_type)}</div>
                <div className="text-sm text-gray-600">📋 Type</div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Property Description</h3>
            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
              {property.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-3 last:mb-0">{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Owner Information - Enterprise Security */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
              👤 Property Owner Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-600">Name:</span>
                <span className="text-sm text-gray-900">
                  {[property.profiles.first_name, property.profiles.last_name].filter(Boolean).join(' ') || 
                   'Unknown User'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-600">Email:</span>
                <span className="text-sm text-blue-600">{property.owner_email}</span>
              </div>
              {property.owner_whatsapp && (
                <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                  <span className="text-sm font-medium text-gray-600">WhatsApp:</span>
                  <span className="text-sm text-green-600">{property.owner_whatsapp}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-600">User Type:</span>
                <span className="text-sm font-bold text-blue-800">{displayUserType(property.profiles.user_type)}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                <span className="text-sm font-medium text-gray-600">Submitted:</span>
                <span className="text-sm text-gray-900">{new Date(property.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Rejection Reason (if exists) */}
          {property.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center">
                ❌ Previous Rejection Reason
              </h3>
              <p className="text-red-800 text-sm leading-relaxed">{property.rejection_reason}</p>
            </div>
          )}

          {/* Action Buttons - Mobile-First */}
          {property.status === 'pending' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Admin Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleAction('approve')}
                  disabled={processingAction === 'approve'}
                  className="w-full px-6 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 text-lg touch-manipulation"
                >
                  {processingAction === 'approve' ? '⏳ Approving...' : '✅ Approve Property'}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processingAction === 'reject'}
                  className="w-full px-6 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-lg touch-manipulation"
                >
                  ❌ Reject Property
                </button>
              </div>
            </div>
          )}

          {/* Back to Dashboard - Sticky Bottom */}
          <div className="pb-8">
            <Link href="/admin-dashboard/mobile">
              <button className="w-full px-6 py-4 border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors text-lg touch-manipulation">
                ← Back to Dashboard
              </button>
            </Link>
          </div>
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
                onClick={() => setShowRejectModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <p className="text-red-800 text-sm font-medium">⚠️ This will notify the property owner via email</p>
              <p className="text-red-600 text-xs mt-1">Provide clear, helpful feedback to help them improve their listing.</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Example: Images are too dark or unclear, description needs more details, missing required information..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={6}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">{rejectReason.length}/500 characters</p>
            </div>
            
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => handleAction('reject')}
                disabled={!rejectReason.trim() || processingAction === 'reject'}
                className="w-full px-4 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processingAction === 'reject' ? '⏳ Processing...' : '❌ Reject & Notify Owner'}
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
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