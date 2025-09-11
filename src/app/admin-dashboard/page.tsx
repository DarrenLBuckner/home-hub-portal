"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/supabase";

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

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalPending: 0,
    todaySubmissions: 0,
    byUserType: { fsbo: 0, agent: 0, landlord: 0 },
    totalActive: 0,
    totalRejected: 0,
  });

  // Display mapping for user types
  const displayUserType = (dbValue: string) => {
    const map: { [key: string]: string } = {
      'owner': 'FSBO',
      'agent': 'Agent',
      'landlord': 'Landlord'
    };
    return map[dbValue] || dbValue;
  };
  const [processingPropertyId, setProcessingPropertyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminAccess() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      // Check if user is admin
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (!adminUser) {
        window.location.href = '/dashboard';
        return;
      }

      // Update the user state to include admin info
      setUser({ 
        ...authUser, 
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role 
      });
      await loadDashboardData();
      setLoading(false);
    }

    checkAdminAccess();
  }, []);

  async function loadDashboardData() {
    const supabase = createClient();
    
    try {
      console.log('🔥 ADMIN DASHBOARD DEBUG - Loading dashboard data...');
      console.log('Supabase client:', supabase);
      
      // Load pending properties with user info and images (use LEFT join for profiles)
      const { data: pendingData, error: pendingError } = await supabase
        .from('properties')
        .select(`
          *,
          profiles(first_name, last_name, user_type),
          property_media(media_url, is_primary)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      console.log('🔥 PENDING PROPERTIES QUERY RESULT:', pendingData);
      console.log('🔥 PENDING PROPERTIES QUERY ERROR:', pendingError);
      console.log('🔥 Data type:', typeof pendingData);
      console.log('🔥 Is array?', Array.isArray(pendingData));
      
      if (pendingError) {
        console.error('Error loading pending properties:', pendingError);
        // Try simpler query without joins
        const { data: simpleData, error: simpleError } = await supabase
          .from('properties')
          .select('*')
          .eq('status', 'pending');
          
        console.log('Simple query result:', simpleData);
        console.log('Simple query error:', simpleError);
        
        setPendingProperties(simpleData || []);
      } else {
        setPendingProperties(pendingData || []);
      }

      // Load statistics
      const today = new Date().toISOString().split('T')[0];
      
      // Count pending
      const { count: totalPending } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Count today's submissions
      const { count: todaySubmissions } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today + 'T00:00:00.000Z')
        .lt('created_at', today + 'T23:59:59.999Z');

      // Count by user type
      const { data: byUserTypeData } = await supabase
        .from('properties')
        .select('listed_by_type')
        .eq('status', 'pending');

      const byUserType = {
        fsbo: byUserTypeData?.filter(p => p.listed_by_type === 'owner').length || 0,
        agent: byUserTypeData?.filter(p => p.listed_by_type === 'agent').length || 0,
        landlord: byUserTypeData?.filter(p => p.listed_by_type === 'landlord').length || 0,
      };

      // Count active properties
      const { count: totalActive } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Count rejected properties
      const { count: totalRejected } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'rejected');

      setStatistics({
        totalPending: totalPending || 0,
        todaySubmissions: todaySubmissions || 0,
        byUserType,
        totalActive: totalActive || 0,
        totalRejected: totalRejected || 0,
      });

    } catch (err: any) {
      setError('Failed to load dashboard data');
      console.error(err);
    }
  }

  async function approveProperty(propertyId: string) {
    setProcessingPropertyId(propertyId);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) throw error;

      // Remove from pending list and update statistics
      setPendingProperties(prev => prev.filter(p => p.id !== propertyId));
      setStatistics(prev => ({
        ...prev,
        totalPending: prev.totalPending - 1,
        totalActive: prev.totalActive + 1,
      }));

      // Send approval email notification
      await sendApprovalEmail(propertyId);
      
    } catch (err: any) {
      setError('Failed to approve property: ' + err.message);
    }
    setProcessingPropertyId(null);
  }

  async function rejectProperty(propertyId: string, reason: string) {
    setProcessingPropertyId(propertyId);
    const supabase = createClient();

    try {
      const { error } = await supabase
        .from('properties')
        .update({ 
          status: 'rejected',
          updated_at: new Date().toISOString(),
          // Could add a rejection_reason field to store the reason
        })
        .eq('id', propertyId);

      if (error) throw error;

      // Remove from pending list and update statistics
      setPendingProperties(prev => prev.filter(p => p.id !== propertyId));
      setStatistics(prev => ({
        ...prev,
        totalPending: prev.totalPending - 1,
        totalRejected: prev.totalRejected + 1,
      }));

      // Send rejection email notification with reason
      await sendRejectionEmail(propertyId, reason);
      
      setShowRejectModal(null);
      setRejectReason("");
      
    } catch (err: any) {
      setError('Failed to reject property: ' + err.message);
    }
    setProcessingPropertyId(null);
  }

  // Email notification functions with bulletproof error handling
  async function sendApprovalEmail(propertyId: string) {
    try {
      const property = pendingProperties.find(p => p.id === propertyId);
      if (!property) return;

      const response = await fetch('/api/send-approval-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          ownerEmail: property.owner_email,
          propertyTitle: property.title,
          ownerName: property.profiles?.first_name || 'Property Owner'
        })
      });

      if (!response.ok) {
        console.warn('Approval email failed, but property was still approved');
      }
    } catch (error) {
      console.warn('Email notification failed, but property approval succeeded:', error);
      // Don't throw - property approval should succeed even if email fails
    }
  }

  async function sendRejectionEmail(propertyId: string, reason: string) {
    try {
      const property = pendingProperties.find(p => p.id === propertyId);
      if (!property) return;

      const response = await fetch('/api/send-rejection-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          ownerEmail: property.owner_email,
          propertyTitle: property.title,
          ownerName: property.profiles?.first_name || 'Property Owner',
          rejectionReason: reason
        })
      });

      if (!response.ok) {
        console.warn('Rejection email failed, but property was still rejected');
      }
    } catch (error) {
      console.warn('Email notification failed, but property rejection succeeded:', error);
      // Don't throw - property rejection should succeed even if email fails
    }
  }

  const PropertyCard = ({ property }: { property: Property }) => {
    const primaryImage = property.property_media?.find(img => img.is_primary) || property.property_media?.[0];
    const daysWaiting = Math.floor((Date.now() - new Date(property.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    console.log('Rendering PropertyCard for:', property.id, property.title);

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex">
          {/* Property Image */}
          <div className="w-48 h-32 flex-shrink-0 bg-gray-100">
            {primaryImage ? (
              <img 
                src={primaryImage.media_url} 
                alt={property.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNjRMMTE2IDQ0SDg0TDEwMCA2NFoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
                }}
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

          {/* Property Details */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    PENDING {daysWaiting} days
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full uppercase">
                    {displayUserType(property.listed_by_type)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{property.title}</h3>
                <p className="text-sm text-gray-600 mb-2">
                  {property.description.substring(0, 100)}...
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>🛏️ {property.bedrooms} bed</span>
                  <span>🚿 {property.bathrooms} bath</span>
                  <span>📍 {property.city}, {property.region}</span>
                </div>
              </div>
              <div className="text-right ml-4">
                <div className="text-lg font-bold text-blue-600">${property.price.toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  by {property.profiles?.first_name || 'Unknown'} {property.profiles?.last_name || 'User'}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="text-xs text-gray-600 mb-3">
              📧 {property.owner_email} • 📱 {property.owner_whatsapp}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2">
              <button
                onClick={() => approveProperty(property.id)}
                disabled={processingPropertyId === property.id}
                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processingPropertyId === property.id ? 'Processing...' : '✅ Approve'}
              </button>
              <button
                onClick={() => setShowRejectModal(property.id)}
                disabled={processingPropertyId === property.id}
                className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                ❌ Reject
              </button>
              <Link href={`/admin-dashboard/property/${property.id}`}>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors">
                  View Details
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🔥 Admin Dashboard - UPDATED 🔥</h1>
              <p className="text-gray-600 mt-1">Property Review & Management</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Welcome back,</div>
              <div className="font-medium">{user?.name}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{statistics.totalPending}</p>
              </div>
              <div className="text-3xl">⏳</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Submissions</p>
                <p className="text-2xl font-bold text-blue-600">{statistics.todaySubmissions}</p>
              </div>
              <div className="text-3xl">📈</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Properties</p>
                <p className="text-2xl font-bold text-green-600">{statistics.totalActive}</p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{statistics.totalRejected}</p>
              </div>
              <div className="text-3xl">❌</div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">By Type</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>FSBO:</span>
                  <span className="font-medium">{statistics.byUserType.fsbo}</span>
                </div>
                <div className="flex justify-between">
                  <span>Agent:</span>
                  <span className="font-medium">{statistics.byUserType.agent}</span>
                </div>
                <div className="flex justify-between">
                  <span>Landlord:</span>
                  <span className="font-medium">{statistics.byUserType.landlord}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-600 text-sm">{error}</div>
            <button 
              onClick={() => setError("")}
              className="text-red-600 text-xs underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Pending Properties */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Properties Awaiting Approval ({statistics.totalPending})
              <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">DEBUG v2.1</span>
            </h2>
            <button 
              onClick={loadDashboardData}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>

          {(() => {
            console.log('🔥 RENDERING PROPERTIES SECTION');
            console.log('🔥 pendingProperties:', pendingProperties);
            console.log('🔥 pendingProperties type:', typeof pendingProperties);
            console.log('🔥 pendingProperties.length:', pendingProperties?.length);
            console.log('🔥 Array.isArray(pendingProperties):', Array.isArray(pendingProperties));
            
            if (!pendingProperties || pendingProperties.length === 0) {
              console.log('🔥 SHOWING NO PROPERTIES MESSAGE');
              return (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-xl font-medium text-gray-600 mb-2">All caught up!</h3>
                  <p className="text-gray-500">No properties waiting for review.</p>
                  <div className="mt-4 text-xs text-gray-400">
                    Debug: pendingProperties = {JSON.stringify(pendingProperties)}
                  </div>
                </div>
              );
            } else {
              console.log('🔥 SHOWING PROPERTY CARDS');
              console.log('🔥 Mapping over properties:', pendingProperties.length, 'items');
              return (
                <div className="space-y-4">
                  {pendingProperties.map((property, index) => {
                    console.log(`🔥 Rendering property ${index}:`, property.id, property.title);
                    return <PropertyCard key={property.id} property={property} />;
                  })}
                </div>
              );
            }
          })()}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reject Property</h3>
            <p className="text-gray-600 text-sm mb-4">
              Please provide a reason for rejecting this property. This will be sent to the owner.
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
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectProperty(showRejectModal, rejectReason)}
                disabled={!rejectReason.trim() || processingPropertyId === showRejectModal}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {processingPropertyId === showRejectModal ? 'Processing...' : 'Reject Property'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}