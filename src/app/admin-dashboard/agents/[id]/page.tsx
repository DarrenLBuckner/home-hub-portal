"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/supabase';
import { useAdminData, getAdminDisplayName } from '@/hooks/useAdminData';
import DashboardHeader from '@/components/admin/DashboardHeader';
import AgentVerificationStatus from '@/components/AgentVerificationStatus';

interface AgentProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  user_type: string;
  country_id: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  property_limit: number | null;
  is_verified_agent: boolean;
  verified_by: string | null;
  verified_at: string | null;
  approval_status: string | null;
  approval_date: string | null;
  created_at: string;
  updated_at: string;
}

interface AgentVetting {
  id: string;
  company_name: string | null;
  license_number: string | null;
  license_type: string | null;
  years_experience: string | null;
  specialties: string | null;
  target_region: string | null;
  promo_code: string | null;
  is_founding_member: boolean;
  status: string;
  submitted_at: string | null;
}

interface PropertyCount {
  active: number;
  pending: number;
  rejected: number;
  total: number;
}

interface PropertyStatus {
  status: string;
}

export default function AgentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params?.id as string;

  const { adminData, isAdmin, isLoading: adminLoading } = useAdminData();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentProfile, setAgentProfile] = useState<AgentProfile | null>(null);
  const [agentVetting, setAgentVetting] = useState<AgentVetting | null>(null);
  const [propertyCount, setPropertyCount] = useState<PropertyCount>({ active: 0, pending: 0, rejected: 0, total: 0 });

  useEffect(() => {
    if (adminLoading) return;

    if (!isAdmin) {
      router.push('/admin-login');
      return;
    }

    if (agentId) {
      loadAgentData();
    }
  }, [adminLoading, isAdmin, agentId]);

  const loadAgentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load agent profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', agentId)
        .single();

      if (profileError) {
        throw new Error('Agent not found');
      }

      if (profile.user_type !== 'agent') {
        throw new Error('This user is not an agent');
      }

      setAgentProfile(profile);

      // Load agent vetting data if available
      const { data: vetting } = await supabase
        .from('agent_vetting')
        .select('*')
        .eq('user_id', agentId)
        .single();

      if (vetting) {
        setAgentVetting(vetting);
      }

      // Load property counts
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('status')
        .eq('user_id', agentId);

      if (!propError && properties) {
        const counts = {
          active: properties.filter((p: PropertyStatus) => p.status === 'active').length,
          pending: properties.filter((p: PropertyStatus) => p.status === 'pending').length,
          rejected: properties.filter((p: PropertyStatus) => p.status === 'rejected').length,
          total: properties.length,
        };
        setPropertyCount(counts);
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load agent data';
      console.error('Error loading agent data:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getCountryName = (countryId: string | null) => {
    const countries: Record<string, string> = {
      'GY': 'Guyana',
      'JM': 'Jamaica',
      'TT': 'Trinidad & Tobago',
      'BB': 'Barbados',
      'LC': 'Saint Lucia',
      'GD': 'Grenada',
      'VC': 'Saint Vincent',
      'AG': 'Antigua & Barbuda',
      'DM': 'Dominica',
      'KN': 'Saint Kitts & Nevis',
      'BS': 'Bahamas',
      'BZ': 'Belize',
      'SR': 'Suriname',
    };
    return countries[countryId || ''] || countryId || 'Unknown';
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading agent details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader
          title="Agent Not Found"
          description="Unable to load agent details"
          icon="⚠️"
          backUrl="/admin-dashboard/agents"
          backText="← Back to Agents"
        />
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-900 mb-2">Error Loading Agent</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <Link href="/admin-dashboard/agents">
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Return to Agent List
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const agentName = agentProfile ? `${agentProfile.first_name} ${agentProfile.last_name}`.trim() : 'Agent';

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title={agentName}
        description="Agent Profile and Verification Management"
        icon="👤"
        backUrl="/admin-dashboard/agents"
        backText="← Back to Agents"
        adminInfo={`Logged in as ${getAdminDisplayName(adminData)} (${adminData?.admin_level || 'Admin'})`}
        statusBadge={
          agentProfile?.is_verified_agent ? (
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center">
              ✓ Verified
            </span>
          ) : (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
              Not Verified
            </span>
          )
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Verification Status Card */}
            <AgentVerificationStatus
              agentId={agentId}
              agentName={agentName}
              onVerificationChange={() => loadAgentData()}
            />

            {/* Basic Information Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">👤</span>
                  Basic Information
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Full Name</label>
                    <p className="text-gray-900 font-medium">{agentName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      📧 Email
                    </label>
                    <p className="text-gray-900">{agentProfile?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      📞 Phone
                    </label>
                    <p className="text-gray-900">{agentProfile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center">
                      📍 Territory
                    </label>
                    <p className="text-gray-900">{getCountryName(agentProfile?.country_id || null)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Details Card (from vetting) */}
            {agentVetting && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="mr-2">🏢</span>
                    Professional Details
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agentVetting.company_name && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company Name</label>
                        <p className="text-gray-900">{agentVetting.company_name}</p>
                      </div>
                    )}
                    {agentVetting.license_number && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">License Number</label>
                        <p className="text-gray-900">{agentVetting.license_number}</p>
                      </div>
                    )}
                    {agentVetting.license_type && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">License Type</label>
                        <p className="text-gray-900">{agentVetting.license_type}</p>
                      </div>
                    )}
                    {agentVetting.years_experience && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                        <p className="text-gray-900">{agentVetting.years_experience}</p>
                      </div>
                    )}
                    {agentVetting.specialties && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Specialties</label>
                        <p className="text-gray-900">{agentVetting.specialties}</p>
                      </div>
                    )}
                    {agentVetting.target_region && (
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-500">Target Regions</label>
                        <p className="text-gray-900">{agentVetting.target_region}</p>
                      </div>
                    )}
                  </div>

                  {/* Founding Member Badge */}
                  {agentVetting.is_founding_member && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-2xl">🏆</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-amber-900">Founding Member</h4>
                          {agentVetting.promo_code && (
                            <p className="text-sm text-amber-700">Promo Code: {agentVetting.promo_code}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Subscription Status Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className={`font-medium ${
                    agentProfile?.subscription_status === 'active'
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}>
                    {agentProfile?.subscription_status || 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tier</label>
                  <p className="text-gray-900 capitalize">{agentProfile?.subscription_tier || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Property Limit</label>
                  <p className="text-gray-900">{agentProfile?.property_limit || 'Unlimited'}</p>
                </div>
              </div>
            </div>

            {/* Property Statistics Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">🏠</span>
                  Properties
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-700">{propertyCount.active}</div>
                    <div className="text-xs text-green-600">Active</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-yellow-700">{propertyCount.pending}</div>
                    <div className="text-xs text-yellow-600">Pending</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-700">{propertyCount.rejected}</div>
                    <div className="text-xs text-red-600">Rejected</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-700">{propertyCount.total}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Timeline Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">🕐</span>
                  Timeline
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center">
                    📅 Account Created
                  </label>
                  <p className="text-gray-900">{formatDate(agentProfile?.created_at || null)}</p>
                </div>
                {agentProfile?.approval_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approved On</label>
                    <p className="text-gray-900">{formatDate(agentProfile.approval_date)}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-gray-900">{formatDate(agentProfile?.updated_at || null)}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="p-4 space-y-2">
                <Link href={`/admin-dashboard/users?search=${agentProfile?.email}`}>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    View in User Management
                  </button>
                </Link>
                <Link href={`/admin-dashboard?search=${agentProfile?.email}`}>
                  <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                    View Agent's Properties
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
