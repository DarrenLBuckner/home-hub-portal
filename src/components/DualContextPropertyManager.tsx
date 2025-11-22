'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/supabase';
import UniversalPropertyManager from './UniversalPropertyManager';

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
  country_id: string;
  owner?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
    display_name?: string;
  };
}

type PropertyContext = 'personal' | 'admin';

interface DualContextPropertyManagerProps {
  userId: string;
  userType: 'agent' | 'landlord' | 'fsbo' | 'admin';
  adminLevel?: string | null;
  countryId?: string;
  permissions?: {
    canApproveProperties: boolean;
    canRejectProperties: boolean;
    canViewAllCountries: boolean;
    countryFilter: string | null;
  };
}

const DualContextPropertyManager: React.FC<DualContextPropertyManagerProps> = ({
  userId,
  userType,
  adminLevel,
  countryId,
  permissions
}) => {
  const [context, setContext] = useState<PropertyContext>('personal');
  const [personalProperties, setPersonalProperties] = useState<Property[]>([]);
  const [adminProperties, setAdminProperties] = useState<Property[]>([]);
  const [personalCount, setPersonalCount] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const isOwnerAdmin = adminLevel === 'owner';
  const isSuperAdmin = adminLevel === 'super';

  useEffect(() => {
    loadPropertyCounts();
  }, [userId, countryId, permissions]);

  const loadPropertyCounts = async () => {
    try {
      setLoading(true);

      // Get personal properties count
      const { count: personalCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setPersonalCount(personalCount || 0);

      // Get admin review properties count (if user has admin privileges)
      if (isOwnerAdmin || isSuperAdmin) {
        let adminQuery = supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .neq('user_id', userId) // Exclude own properties
          .in('status', ['pending', 'draft']);

        // Apply country filter for Owner Admins
        if (isOwnerAdmin && permissions?.countryFilter) {
          adminQuery = adminQuery.eq('country_id', permissions.countryFilter);
        }

        const { count: adminCount } = await adminQuery;
        setAdminCount(adminCount || 0);
      }

    } catch (error) {
      console.error('Error loading property counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const ContextSwitcher = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 p-1">
      <div className="flex">
        <button
          onClick={() => setContext('personal')}
          className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            context === 'personal'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          <span className="mr-2">👤</span>
          My Properties
          {personalCount > 0 && (
            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
              context === 'personal' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}>
              {personalCount}
            </span>
          )}
        </button>

        {(isOwnerAdmin || isSuperAdmin) && (
          <button
            onClick={() => setContext('admin')}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              context === 'admin'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span className="mr-2">⚖️</span>
            Property Review
            {adminCount > 0 && (
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${
                context === 'admin' 
                  ? 'bg-orange-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {adminCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );

  const ContextIndicator = () => (
    <div className={`mb-4 p-3 rounded-lg border-l-4 ${
      context === 'personal' 
        ? 'bg-blue-50 border-blue-400' 
        : 'bg-orange-50 border-orange-400'
    }`}>
      <div className="flex items-center">
        <span className="text-lg mr-2">
          {context === 'personal' ? '👤' : '⚖️'}
        </span>
        <div>
          <h3 className={`font-medium ${
            context === 'personal' ? 'text-blue-800' : 'text-orange-800'
          }`}>
            {context === 'personal' ? 'Personal Property Management' : 'Admin Property Review'}
          </h3>
          <p className={`text-sm ${
            context === 'personal' ? 'text-blue-600' : 'text-orange-600'
          }`}>
            {context === 'personal' 
              ? 'Manage your own property listings - edit, delete, feature, and track status'
              : 'Review and approve property submissions from other users in your region'
            }
          </p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading properties...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ContextSwitcher />
      <ContextIndicator />
      
      {context === 'personal' ? (
        <UniversalPropertyManager
          userId={userId}
          userType={userType}
        />
      ) : (
        <AdminPropertyReview
          userId={userId}
          countryId={countryId}
          permissions={permissions}
        />
      )}
    </div>
  );
};

// Admin Property Review Component
const AdminPropertyReview: React.FC<{
  userId: string;
  countryId?: string;
  permissions?: any;
}> = ({ userId, countryId, permissions }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    loadAdminProperties();
  }, [userId, countryId, permissions]);

  const loadAdminProperties = async () => {
    try {
      let query = supabase
        .from('properties')
        .select(`
          *,
          owner:profiles!user_id (
            id,
            email,
            first_name,
            last_name,
            user_type,
            display_name
          )
        `)
        .neq('user_id', userId) // Exclude own properties
        .in('status', ['pending', 'draft'])
        .order('created_at', { ascending: false });

      // Apply country filter for Owner Admins
      if (permissions?.countryFilter && !permissions?.canViewAllCountries) {
        query = query.eq('country_id', permissions.countryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProperties(data || []);
    } catch (error) {
      console.error('Error loading admin properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (propertyId: string) => {
    try {
      setProcessingId(propertyId);
      
      const { error } = await supabase
        .from('properties')
        .update({
          status: 'active',
          reviewed_by: userId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) throw error;
      
      // Remove from list
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (error) {
      console.error('Error approving property:', error);
      alert('Error approving property. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (propertyId: string, reason: string) => {
    try {
      setProcessingId(propertyId);
      
      const { error } = await supabase
        .from('properties')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_by: userId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', propertyId);

      if (error) throw error;
      
      // Remove from list
      setProperties(prev => prev.filter(p => p.id !== propertyId));
    } catch (error) {
      console.error('Error rejecting property:', error);
      alert('Error rejecting property. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Loading properties for review...</span>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">⚖️</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties to Review</h3>
        <p className="text-gray-600">All properties in your region are up to date!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {properties.map((property) => (
        <div key={property.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {property.title}
                </h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <span>📍 {property.location}</span>
                  <span>💰 ${property.price?.toLocaleString()}</span>
                  <span>🏠 {property.property_type}</span>
                  <span>🛏️ {property.bedrooms}BR</span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-500">
                    👤 {property.owner?.display_name || `${property.owner?.first_name} ${property.owner?.last_name}`}
                  </span>
                  <span className="text-gray-500">
                    📧 {property.owner?.email}
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                    {property.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Submitted {new Date(property.created_at).toLocaleDateString()}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    const reason = prompt('Please provide a rejection reason:');
                    if (reason) handleReject(property.id, reason);
                  }}
                  disabled={processingId === property.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {processingId === property.id ? '⏳' : '❌'} Reject
                </button>
                
                <button
                  onClick={() => handleApprove(property.id)}
                  disabled={processingId === property.id}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {processingId === property.id ? '⏳' : '✅'} Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DualContextPropertyManager;