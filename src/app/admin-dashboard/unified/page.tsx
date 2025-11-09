"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import { useAdminData, getAdminDisplayName } from '@/hooks/useAdminData';
import UniversalPropertyManager from '@/components/UniversalPropertyManager';
import EngagementOverview from '../components/EngagementOverview';

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

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  admin_level?: string;
  created_at: string;
  updated_at: string;
}

export default function UnifiedAdminDashboard() {
  const router = useRouter();
  const { adminData, permissions, isAdmin, isLoading: adminLoading, error: adminError } = useAdminData();
  
  // State management
  const [activeSection, setActiveSection] = useState<'dashboard' | 'properties' | 'system'>('dashboard');
  const [pendingProperties, setPendingProperties] = useState<Property[]>([]);
  const [approvedProperties, setApprovedProperties] = useState<Property[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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

  // Authentication & authorization
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
    if (permissions?.canAccessUserManagement) {
      loadUsers();
    }
  }, [adminLoading, adminError, isAdmin, router, permissions]);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading dashboard data...');
      
      // Build query with profiles data for pending properties
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
        .in('status', ['pending', 'draft']);

      // Apply country filter for non-super admins
      if (permissions && !permissions.canViewAllCountries && permissions.countryFilter) {
        propertiesQuery = propertiesQuery.eq('country_id', permissions.countryFilter);
      }

      const { data: properties, error: propertiesError } = await propertiesQuery;

      if (propertiesError) {
        console.error('Properties error:', propertiesError);
        setError('Failed to load properties');
        return;
      }

      setPendingProperties(properties || []);

      // Load approved/active properties
      let approvedQuery = supabase
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
        .eq('status', 'active');

      // Apply same country filter
      if (permissions && !permissions.canViewAllCountries && permissions.countryFilter) {
        approvedQuery = approvedQuery.eq('country_id', permissions.countryFilter);
      }

      const { data: approvedProps, error: approvedError } = await approvedQuery;

      if (approvedError) {
        console.error('Approved properties error:', approvedError);
      } else {
        setApprovedProperties(approvedProps || []);
      }

      // Load statistics
      const { data: stats, error: statsError } = await supabase
        .from('properties')
        .select('status, created_at, user_id, listed_by_type');

      if (statsError) {
        console.error('Stats error:', statsError);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const todaySubmissions = stats?.filter((p: any) => 
        p.created_at.startsWith(today)
      ).length || 0;

      let byUserType = { fsbo: 0, agent: 0, landlord: 0 };
      
      if (stats) {
        stats.forEach((property: any) => {
          if (property.status === 'active') {
            if (property.listed_by_type === 'owner') byUserType.fsbo++;
            else if (property.listed_by_type === 'agent') byUserType.agent++;
            else if (property.listed_by_type === 'landlord') byUserType.landlord++;
          }
        });
      }

      setStatistics({
        totalPending: properties?.length || 0,
        todaySubmissions,
        byUserType,
        totalActive: stats?.filter((p: any) => p.status === 'active').length || 0,
        totalRejected: stats?.filter((p: any) => p.status === 'rejected').length || 0,
      });

    } catch (error) {
      console.error('Dashboard load error:', error);
      setError('Failed to load dashboard data');
    }
  };

  const loadUsers = async () => {
    if (!permissions?.canAccessUserManagement) return;

    try {
      let usersQuery = supabase
        .from('profiles')
        .select('id, email, first_name, last_name, user_type, admin_level, created_at, updated_at');

      // Apply country filter for non-super admins
      if (!permissions.canViewAllCountries && permissions.countryFilter) {
        usersQuery = usersQuery.eq('country_id', permissions.countryFilter);
      }

      const { data: usersData, error: usersError } = await usersQuery;

      if (usersError) {
        console.error('Users error:', usersError);
        return;
      }

      setUsers(usersData || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const approveProperty = async (propertyId: string) => {
    setProcessingPropertyId(propertyId);
    setError('');
    
    try {
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
        const property = pendingProperties.find(p => p.id === propertyId);
        alert(`✅ Property "${property?.title}" has been approved and is now active!`);
        await loadDashboardData();
      } else {
        setError(result.error || 'Failed to approve property');
      }
    } catch (error) {
      console.error('❌ Network error during approval:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingPropertyId(null);
  };

  const rejectProperty = async (propertyId: string, reason: string) => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setProcessingPropertyId(propertyId);
    setError('');
    
    try {
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
        const property = pendingProperties.find(p => p.id === propertyId);
        alert(`❌ Property "${property?.title}" has been rejected.\nReason: ${reason}`);
        setShowRejectModal(null);
        setRejectReason("");
        await loadDashboardData();
      } else {
        setError(result.error || 'Failed to reject property');
      }
    } catch (error) {
      console.error('❌ Network error during rejection:', error);
      setError('Network error occurred. Please try again.');
    }
    setProcessingPropertyId(null);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/admin-login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/admin-login');
    }
  };

  const getEditUrl = (property: Property) => {
    const baseUrl = `/admin-dashboard/property/${property.id}`;
    return baseUrl;
  };

  const displayUserType = (dbValue: string) => {
    const map: { [key: string]: string } = {
      'owner': 'FSBO',
      'agent': 'Agent', 
      'landlord': 'Landlord'
    };
    return map[dbValue] || dbValue;
  };

  // Mobile Property Card Component
  const MobilePropertyCard = ({ property }: { property: Property }) => {
    const primaryImage = property.property_media?.find(media => media.is_primary);
    
    return (
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow">
        {/* Property Image */}
        <div className="relative h-48 bg-gray-200">
          {primaryImage ? (
            <img 
              src={primaryImage.media_url} 
              alt={property.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <div className="text-center">
                <div className="text-4xl mb-2">🏠</div>
                <p className="text-gray-500 text-sm">No Image</p>
              </div>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className="px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
              ⏳ PENDING REVIEW
            </span>
          </div>
        </div>

        {/* Property Details */}
        <div className="p-4">
          {/* Title & Price */}
          <div className="mb-3">
            <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
              {property.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-green-600">
                ${property.price?.toLocaleString() || 'N/A'}
              </span>
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {displayUserType(property.listed_by_type)}
              </span>
            </div>
          </div>

          {/* Property Info */}
          <div className="grid grid-cols-3 gap-3 text-center mb-4">
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-xs font-medium text-blue-800">🛏️ Beds</div>
              <div className="text-sm font-bold text-blue-900">{property.bedrooms || 'N/A'}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-xs font-medium text-blue-800">🚿 Baths</div>
              <div className="text-sm font-bold text-blue-900">{property.bathrooms || 'N/A'}</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <div className="text-xs font-medium text-blue-800">🏠 Type</div>
              <div className="text-xs font-bold text-blue-900">{property.property_type || 'N/A'}</div>
            </div>
          </div>

          {/* Location */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-800 mb-1">📍 Location</h4>
            <p className="text-sm text-gray-600">
              {property.city}, {property.region}
            </p>
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

          {/* Action Buttons */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => approveProperty(property.id)}
                disabled={processingPropertyId === property.id}
                className="w-full px-4 py-3 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processingPropertyId === property.id ? '⏳' : '✅'} Approve
              </button>
              <button
                onClick={() => setShowRejectModal(property.id)}
                disabled={processingPropertyId === property.id}
                className="w-full px-4 py-3 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                ❌ Reject
              </button>
            </div>
            
            <Link href={getEditUrl(property)} className="block">
              <button className="w-full px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
                ✏️ Edit Property
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Navigation Component
  const NavigationTabs = () => (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center space-x-1 overflow-x-auto py-2">
          {/* PRIORITY 1: Dashboard - Quick Overview */}
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            📊 Dashboard
          </button>
          
          {/* PRIORITY 2: Properties - Core Daily Work */}
          <button
            onClick={() => setActiveSection('properties')}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === 'properties'
                ? 'bg-green-600 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            🏠 Properties
          </button>

          {/* PRIORITY 3: Pricing - Business Critical (grouped with properties) */}
          {permissions?.canAccessPricingManagement && (
            <button
              onClick={() => setActiveSection('pricing')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === 'pricing'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              � Pricing
            </button>
          )}

          {/* PRIORITY 4: User Management - Administrative Tasks */}
          {permissions?.canAccessUserManagement && (
            <button
              onClick={() => setActiveSection('users')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === 'users'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              � Users
            </button>
          )}

          {/* PRIORITY 5: System Settings - Advanced/Less Frequent (Super Admin Only) */}
          {permissions?.canAccessSystemSettings && (
            <button
              onClick={() => setActiveSection('system')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === 'system'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              🛠️ System
            </button>
          )}
        </div>
      </div>
    </div>
  );

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🎯 Unified Admin Dashboard</h1>
              <p className="text-sm text-gray-600">
                All-in-one admin control center • {getAdminDisplayName(adminData)} • {permissions?.displayRole || 'Admin'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadDashboardData}
                className="px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <NavigationTabs />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Dashboard Section */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Statistics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border border-yellow-200">
                <div className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">Pending</div>
                <div className="text-3xl font-black text-yellow-900 mb-1">{statistics.totalPending}</div>
                <div className="text-xs text-yellow-700">Need Review</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-4 border border-blue-200">
                <div className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Today</div>
                <div className="text-3xl font-black text-blue-900 mb-1">{statistics.todaySubmissions}</div>
                <div className="text-xs text-blue-700">New Submissions</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                <div className="text-xs font-bold text-green-800 uppercase tracking-wide mb-1">Active</div>
                <div className="text-3xl font-black text-green-900 mb-1">{statistics.totalActive}</div>
                <div className="text-xs text-green-700">Live Properties</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200">
                <div className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-1">FSBO</div>
                <div className="text-3xl font-black text-purple-900 mb-1">{statistics.byUserType.fsbo}</div>
                <div className="text-xs text-purple-700">Owner Sales</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-4 border border-red-200">
                <div className="text-xs font-bold text-red-800 uppercase tracking-wide mb-1">Rejected</div>
                <div className="text-3xl font-black text-red-900 mb-1">{statistics.totalRejected}</div>
                <div className="text-xs text-red-700">Need Fixes</div>
              </div>
            </div>

            {/* Dashboard Overview - Quick Access to All Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Pending Properties Quick Access */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-yellow-900">🏠 Complete Property Management</h3>
                  <div className="text-2xl font-black text-yellow-600">{statistics.totalPending}</div>
                </div>
                <p className="text-sm text-yellow-800 mb-4">Manage all properties: pending, active, rejected</p>
                <button
                  onClick={() => setActiveSection('properties')}
                  className="w-full px-4 py-2 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Manage Properties →
                </button>
              </div>

              {/* User Management Quick Access */}
              {permissions?.canAccessUserManagement && (
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-blue-900">👥 User Management</h3>
                    <div className="text-2xl font-black text-blue-600">{users.length}</div>
                  </div>
                  <p className="text-sm text-blue-800 mb-4">
                    {permissions.canViewAllCountries 
                      ? 'Manage all users across all countries' 
                      : `Manage users in ${permissions.countryFilter}`}
                  </p>
                  <Link href="/admin-dashboard/user-management">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      Manage Users →
                    </button>
                  </Link>
                </div>
              )}

              {/* Pricing Management Quick Access */}
              {permissions?.canAccessPricingManagement && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-green-900">💰 Pricing Control</h3>
                    <div className="text-xl text-green-600">$</div>
                  </div>
                  <p className="text-sm text-green-800 mb-4">
                    {permissions.canViewAllCountries 
                      ? 'Manage pricing for all countries and user types'
                      : `Manage pricing for ${permissions.countryFilter}`}
                  </p>
                  <Link href="/admin-dashboard/pricing">
                    <button className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors">
                      Manage Pricing →
                    </button>
                  </Link>
                </div>
              )}

              {/* System Settings for Super Admin */}
              {permissions?.canAccessSystemSettings && (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-red-900">🔧 System Settings</h3>
                    <div className="text-xl text-red-600">⚡</div>
                  </div>
                  <p className="text-sm text-red-800 mb-4">Global system configuration and advanced settings</p>
                  <button
                    onClick={() => setActiveSection('system')}
                    className="w-full px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
                  >
                    System Config →
                  </button>
                </div>
              )}

              {/* Active Properties Summary */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">✅ Live Properties</h3>
                  <div className="text-2xl font-black text-green-600">{statistics.totalActive}</div>
                </div>
                <p className="text-sm text-gray-800 mb-4">Properties currently live on the platform</p>
                <button
                  onClick={() => setActiveSection('properties')}
                  className="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View All Properties →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Properties Section */}
        {activeSection === 'properties' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">🏠 Complete Property Management</h2>
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

        {/* System Section */}
        {activeSection === 'system' && permissions?.canAccessSystemSettings && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">🛠️ System Administration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">🛠️</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
                  <p className="text-gray-600 mb-4 text-sm">Core system configuration and management</p>
                  <Link href="/admin-dashboard/system-settings">
                    <button className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors">
                      Open System Settings
                    </button>
                  </Link>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="text-center">
                  <div className="text-3xl mb-3">🩺</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Diagnostics</h3>
                  <p className="text-gray-600 mb-4 text-sm">System health monitoring and diagnostics</p>
                  <Link href="/admin-dashboard/diagnostic">
                    <button className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors">
                      Open Diagnostics
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">❌ Reject Property</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a clear reason for rejecting this property. This will help the owner understand what needs to be fixed.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] mb-4"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectProperty(showRejectModal, rejectReason)}
                disabled={!rejectReason.trim() || processingPropertyId === showRejectModal}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-bold disabled:opacity-50"
              >
                {processingPropertyId === showRejectModal ? '⏳ Processing...' : '❌ Reject Property'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 left-4 right-4 bg-red-600 text-white p-4 rounded-xl shadow-lg z-50">
          <div className="flex items-center justify-between">
            <span className="font-medium">{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-4 text-red-200 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}