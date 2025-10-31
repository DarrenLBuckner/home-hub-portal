"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/supabase";

interface PropertyMedia {
  media_url: string;
  media_type: string;
  is_primary: boolean;
  display_order: number;
}

interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  house_size_value: number;
  house_size_unit: string;
  land_size_value?: number;
  land_size_unit?: string;
  year_built?: number;
  amenities: string[];
  region: string;
  city: string;
  neighborhood?: string;
  owner_email: string;
  owner_whatsapp: string;
  status: string;
  created_at: string;
  updated_at: string;
  listed_by_type: string;
  user_id: string;
  property_media: PropertyMedia[];
  owner: {
    first_name: string;
    last_name: string;
    user_type: string;
    phone: string;
  };
}

export default function AdminPropertyDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [processingAction, setProcessingAction] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    async function loadProperty() {
      const supabase = createClient();
      
      // Get current user and verify admin access
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      // Check if user is admin using admin_users table
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (!adminUser) {
        window.location.href = '/dashboard';
        return;
      }

      setUser({ ...authUser, admin: adminUser });
      
      // Check if user is super admin (only super admin can delete properties)
      setIsSuperAdmin(authUser.email === 'qumar@realalert.info');

      // Load property with all details
      const { data: propertyData, error: propertyError } = await supabase
        .from('properties')
        .select(`
          *,
          owner:profiles!user_id(first_name, last_name, user_type, phone),
          property_media!left(
            media_url,
            media_type,
            is_primary,
            display_order
          )
        `)
        .eq('id', propertyId)
        .single();

      if (propertyError || !propertyData) {
        setError('Property not found');
        setLoading(false);
        return;
      }

      // Sort images by display_order, putting primary first
      if (propertyData.property_media) {
        propertyData.property_media.sort((a: PropertyMedia, b: PropertyMedia) => {
          if (a.is_primary) return -1;
          if (b.is_primary) return 1;
          return a.display_order - b.display_order;
        });
      }

      setProperty(propertyData);
      setLoading(false);
    }

    if (propertyId) {
      loadProperty();
    }
  }, [propertyId]);

  async function approveProperty() {
    if (!property) return;
    
    setProcessingAction(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', property.id);

      if (error) throw error;

      setProperty({ ...property, status: 'active' });
      
      // TODO: Send approval email notification
      
    } catch (err: any) {
      setError('Failed to approve property: ' + err.message);
    }
    setProcessingAction(false);
  }

  async function rejectProperty() {
    if (!property || !rejectReason.trim()) return;
    
    setProcessingAction(true);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', property.id);

      if (error) throw error;

      setProperty({ ...property, status: 'rejected' });
      setShowRejectModal(false);
      setRejectReason("");
      
      // TODO: Send rejection email notification with reason
      
    } catch (err: any) {
      setError('Failed to reject property: ' + err.message);
    }
    setProcessingAction(false);
  }
  
  async function deleteProperty() {
    if (!property || !isSuperAdmin) return;
    
    setProcessingAction(true);
    const supabase = createClient();

    try {
      // Delete property media first
      if (property.property_media && property.property_media.length > 0) {
        const { error: mediaError } = await supabase
          .from('property_media')
          .delete()
          .eq('property_id', property.id);
          
        if (mediaError) throw mediaError;
      }
      
      // Delete the property
      const { error: propertyError } = await supabase
        .from('properties')
        .delete()
        .eq('id', property.id);

      if (propertyError) throw propertyError;

      // Redirect back to admin dashboard
      router.push('/admin-dashboard?message=Property deleted successfully');
      
    } catch (err: any) {
      setError('Failed to delete property: ' + err.message);
      setProcessingAction(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading property details...</p>
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="text-red-600 mb-4">{error || 'Property not found'}</div>
        <Link href="/admin-dashboard" className="text-blue-600 hover:underline">
          ← Back to Admin Dashboard
        </Link>
      </main>
    );
  }

  const images = property.property_media || [];
  const hasImages = images.length > 0;

  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusStyle = (status: string) => {
      switch (status.toLowerCase()) {
        case 'active':
          return 'bg-green-100 text-green-800 border-green-200';
        case 'pending':
          return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'rejected':
          return 'bg-red-100 text-red-800 border-red-200';
        case 'draft':
          return 'bg-gray-100 text-gray-800 border-gray-200';
        default:
          return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status.toLowerCase()) {
        case 'active':
          return '✅';
        case 'pending':
          return '⏳';
        case 'rejected':
          return '❌';
        case 'draft':
          return '📝';
        default:
          return '📄';
      }
    };

    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getStatusStyle(status)}`}>
        <span className="mr-1">{getStatusIcon(status)}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>
    );
  };

  const ImageGallery = () => {
    if (!hasImages) {
      return (
        <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">🏡</div>
            <p className="text-lg">No images available</p>
          </div>
        </div>
      );
    }

    const nextImage = () => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    };

    const prevImage = () => {
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    return (
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={images[currentImageIndex].media_url}
            alt={`${property.title} - Image ${currentImageIndex + 1}`}
            className="w-full h-full object-cover"
          />
          
          {/* Image Counter */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {images.length}
          </div>

          {/* Primary Badge */}
          {images[currentImageIndex].is_primary && (
            <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Primary Image
            </div>
          )}

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-opacity"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentImageIndex ? 'border-blue-500' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={image.media_url}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const AdminActions = () => {
    if (property.status === 'active') {
      return (
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <h3 className="font-semibold text-green-900 mb-2">✅ Property Approved</h3>
          <p className="text-green-700 text-sm mb-4">
            This property is live and visible to the public.
          </p>
          <button 
            onClick={() => setShowRejectModal(true)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Revoke Approval
          </button>
        </div>
      );
    }

    if (property.status === 'rejected') {
      return (
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <h3 className="font-semibold text-red-900 mb-2">❌ Property Rejected</h3>
          <p className="text-red-700 text-sm mb-4">
            This property has been rejected and the owner notified.
          </p>
          <button 
            onClick={approveProperty}
            disabled={processingAction}
            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {processingAction ? 'Processing...' : 'Approve Property'}
          </button>
        </div>
      );
    }

    // Pending status
    return (
      <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
        <h3 className="font-semibold text-yellow-900 mb-2">⏳ Awaiting Review</h3>
        <p className="text-yellow-700 text-sm mb-4">
          This property is waiting for admin approval.
        </p>
        <div className="space-y-3">
          <button
            onClick={approveProperty}
            disabled={processingAction}
            className="w-full px-4 py-3 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {processingAction ? 'Processing...' : '✅ Approve Property'}
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={processingAction}
            className="w-full px-4 py-3 bg-red-600 text-white font-medium rounded hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            ❌ Reject Property
          </button>
          
          {/* Super Admin Only: Delete Property Button */}
          {isSuperAdmin && (
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={processingAction}
              className="w-full px-4 py-3 bg-red-800 text-white font-medium rounded hover:bg-red-900 transition-colors disabled:opacity-50 border-2 border-red-900"
            >
              🗑️ DELETE PROPERTY (Super Admin Only)
            </button>
          )}
        </div>
      </div>
    );
  };

  const daysWaiting = Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <main className="max-w-6xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin-dashboard" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
          ← Back to Admin Dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{property.title}</h1>
            <div className="flex items-center space-x-4 mb-4">
              <StatusBadge status={property.status} />
              <span className="text-sm text-gray-500">
                Submitted {daysWaiting} days ago
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">${property.price.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Listed Price</div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-600 text-sm">{error}</div>
          <button onClick={() => setError("")} className="text-red-600 text-xs underline mt-1">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <ImageGallery />

          {/* Property Description */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{property.description}</p>
          </div>

          {/* Property Details */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Details</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">🏠</span>
                <div>
                  <div className="font-medium">{property.property_type}</div>
                  <div className="text-sm text-gray-500">Type</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">🛏️</span>
                <div>
                  <div className="font-medium">{property.bedrooms}</div>
                  <div className="text-sm text-gray-500">Bedrooms</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">🚿</span>
                <div>
                  <div className="font-medium">{property.bathrooms}</div>
                  <div className="text-sm text-gray-500">Bathrooms</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">📐</span>
                <div>
                  <div className="font-medium">{property.house_size_value} {property.house_size_unit}</div>
                  <div className="text-sm text-gray-500">House Size</div>
                </div>
              </div>
              {property.land_size_value && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">🌱</span>
                  <div>
                    <div className="font-medium">{property.land_size_value} {property.land_size_unit}</div>
                    <div className="text-sm text-gray-500">Land Size</div>
                  </div>
                </div>
              )}
              {property.year_built && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">🗓️</span>
                  <div>
                    <div className="font-medium">{property.year_built}</div>
                    <div className="text-sm text-gray-500">Year Built</div>
                  </div>
                </div>
              )}
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-gray-900 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">📍</span>
                <span className="font-medium">{property.region}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">🏘️</span>
                <span>{property.city}</span>
              </div>
              {property.neighborhood && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">🏡</span>
                  <span>{property.neighborhood}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Admin Actions */}
          <AdminActions />

          {/* Owner Information */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Property Owner</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">{property.owner.first_name} {property.owner.last_name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{property.owner_email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">WhatsApp</div>
                <div className="font-medium">{property.owner_whatsapp}</div>
              </div>
              {property.owner.phone && (
                <div>
                  <div className="text-sm text-gray-500">Profile Phone</div>
                  <div className="font-medium">{property.owner.phone}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-gray-500">Account Type</div>
                <div className="font-medium uppercase">{property.listed_by_type}</div>
              </div>
            </div>
          </div>

          {/* Property Metadata */}
          <div className="bg-gray-50 rounded-lg border p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Property Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Property ID:</span>
                <span className="font-medium text-gray-900">{property.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Submitted:</span>
                <span className="font-medium text-gray-900">
                  {new Date(property.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="font-medium text-gray-900">
                  {new Date(property.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Listing Type:</span>
                <span className="font-medium text-gray-900">Sale</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {property.status === 'active' ? 'Revoke Approval' : 'Reject Property'}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Please provide a reason for {property.status === 'active' ? 'revoking approval of' : 'rejecting'} this property. 
              This will be sent to the owner.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain what needs to be changed or fixed..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={4}
            />
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={rejectProperty}
                disabled={!rejectReason.trim() || processingAction}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processingAction ? 'Processing...' : (property.status === 'active' ? 'Revoke' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-red-900 mb-4">⚠️ DELETE PROPERTY</h2>
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                <strong>WARNING:</strong> This will permanently delete the property and all associated media files. This action cannot be undone.
              </p>
              <div className="bg-red-50 border border-red-200 p-3 rounded text-red-800 text-sm">
                <strong>Property:</strong> {property?.title}<br />
                <strong>Owner:</strong> {property?.owner_email}
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={processingAction}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteProperty}
                disabled={processingAction}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processingAction ? 'Deleting...' : 'DELETE FOREVER'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}