"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/supabase';
import { useAdminData, getAdminDisplayName } from '@/hooks/useAdminData';
import DashboardHeader from '@/components/admin/DashboardHeader';
import { PremiumToggle } from '@/components/PremiumToggle';
import { VerificationToggle } from '@/components/VerificationToggle';

interface Agent {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  country_id: string | null;
  subscription_status: string | null;
  subscription_tier: string | null;
  is_verified_agent: boolean;
  is_premium_agent: boolean;
  verified_at: string | null;
  created_at: string;
  property_count?: number;
}

type FilterStatus = 'all' | 'verified' | 'unverified';

export default function AgentManagementPage() {
  const router = useRouter();
  const { adminData, permissions, isAdmin, isLoading: adminLoading } = useAdminData();

  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [error, setError] = useState<string | null>(null);
  const [premiumColumnMissing, setPremiumColumnMissing] = useState(false);
  const [setupSql, setSetupSql] = useState<string | null>(null);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    premium: 0,
  });

  useEffect(() => {
    if (adminLoading) return;

    if (!isAdmin) {
      router.push('/admin-login');
      return;
    }

    loadAgents();
  }, [adminLoading, isAdmin]);

  useEffect(() => {
    filterAgents();
  }, [agents, searchTerm, filterStatus]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query for agents
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('user_type', 'agent')
        .order('created_at', { ascending: false });

      // Apply country filter for non-super admins
      if (permissions && !permissions.canViewAllCountries && permissions.countryFilter) {
        query = query.eq('country_id', permissions.countryFilter);
      }

      const { data: agentsData, error: agentsError } = await query;

      if (agentsError) {
        throw new Error(agentsError.message);
      }

      // Get property counts for each agent
      const agentsWithCounts = await Promise.all(
        (agentsData || []).map(async (agent: Agent) => {
          const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', agent.id)
            .eq('status', 'active');

          return {
            ...agent,
            property_count: count || 0,
          };
        })
      );

      setAgents(agentsWithCounts);

      // Check if is_premium_agent column exists (will be undefined if missing)
      const hasPremiumColumn = agentsWithCounts.length === 0 ||
        agentsWithCounts.some(a => a.is_premium_agent !== undefined);

      if (!hasPremiumColumn) {
        setPremiumColumnMissing(true);
        setSetupSql('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium_agent BOOLEAN DEFAULT false;');
      } else {
        setPremiumColumnMissing(false);
        setSetupSql(null);
      }

      // Calculate stats
      const verified = agentsWithCounts.filter(a => a.is_verified_agent).length;
      const premium = agentsWithCounts.filter(a => a.is_premium_agent).length;
      setStats({
        total: agentsWithCounts.length,
        verified,
        unverified: agentsWithCounts.length - verified,
        premium,
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load agents';
      console.error('Error loading agents:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterAgents = () => {
    let filtered = [...agents];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (agent) =>
          agent.first_name?.toLowerCase().includes(search) ||
          agent.last_name?.toLowerCase().includes(search) ||
          agent.email?.toLowerCase().includes(search) ||
          `${agent.first_name} ${agent.last_name}`.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (filterStatus === 'verified') {
      filtered = filtered.filter((agent) => agent.is_verified_agent);
    } else if (filterStatus === 'unverified') {
      filtered = filtered.filter((agent) => !agent.is_verified_agent);
    }

    setFilteredAgents(filtered);
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        title="Agent Management"
        description="View and manage agent accounts and verification status"
        icon="👥"
        adminInfo={`Logged in as ${getAdminDisplayName(adminData)} (${adminData?.admin_level || 'Admin'})`}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Verified</p>
                <p className="text-2xl font-bold text-green-700">{stats.verified}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Not Verified</p>
                <p className="text-2xl font-bold text-gray-700">{stats.unverified}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl text-gray-400">○</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-amber-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Premium</p>
                <p className="text-2xl font-bold text-amber-700">{stats.premium}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⭐</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Column Setup Notice */}
        {premiumColumnMissing && setupSql && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold text-amber-800 mb-2">Database Setup Required</p>
                <p className="text-amber-700 text-sm mb-3">
                  The Premium Agent feature requires a database column that doesn&apos;t exist yet.
                  Run this SQL in your Supabase SQL Editor:
                </p>
                <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm mb-3 overflow-x-auto">
                  {setupSql}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(setupSql);
                    alert('SQL copied to clipboard!');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Copy SQL
                </button>
                <span className="text-amber-600 text-sm ml-3">Then refresh this page.</span>
              </div>
            </div>
          </div>
        )}

        {/* Territory Notice for non-super admins */}
        {permissions && !permissions.canViewAllCountries && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-blue-800 text-sm flex items-center">
              📍&nbsp;
              <strong>Territory Filter Active:</strong>&nbsp;
              Showing agents in {getCountryName(permissions.countryFilter || null)} only
            </p>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder="Search agents by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400">⚙️</span>
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('verified')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                  filterStatus === 'verified'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✓ Verified
              </button>
              <button
                onClick={() => setFilterStatus('unverified')}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                  filterStatus === 'unverified'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ○ Unverified
              </button>

              {/* Refresh Button */}
              <button
                onClick={loadAgents}
                disabled={loading}
                className="px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                🔄
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Agents List */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading agents...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-5xl text-gray-300 mb-4">👥</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Agents Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'There are no agents in the system yet.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    {adminData?.admin_level === 'super' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Territory
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verified
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Premium
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Properties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-700">
                                {agent.first_name?.charAt(0) || 'A'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {agent.first_name} {agent.last_name}
                              </span>
                              {agent.is_verified_agent && (
                                <span className="text-green-500 ml-1">✓</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{agent.email}</div>
                          </div>
                        </div>
                      </td>
                      {adminData?.admin_level === 'super' && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            📍 {getCountryName(agent.country_id)}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <VerificationToggle
                          agentId={agent.id}
                          initialValue={agent.is_verified_agent || false}
                          agentName={`${agent.first_name} ${agent.last_name}`}
                          onToggle={(newValue: boolean) => {
                            setAgents(prev => prev.map(a =>
                              a.id === agent.id ? { ...a, is_verified_agent: newValue } : a
                            ));
                            setStats(prev => ({
                              ...prev,
                              verified: newValue ? prev.verified + 1 : prev.verified - 1,
                              unverified: newValue ? prev.unverified - 1 : prev.unverified + 1,
                            }));
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PremiumToggle
                          agentId={agent.id}
                          initialValue={agent.is_premium_agent || false}
                          agentName={`${agent.first_name} ${agent.last_name}`}
                          onToggle={(newValue: boolean) => {
                            // Update local state
                            setAgents(prev => prev.map(a =>
                              a.id === agent.id ? { ...a, is_premium_agent: newValue } : a
                            ));
                            // Update stats
                            setStats(prev => ({
                              ...prev,
                              premium: newValue ? prev.premium + 1 : prev.premium - 1
                            }));
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          🏠 {agent.property_count || 0} active
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(agent.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/admin-dashboard/agents/${agent.id}`}>
                          <button className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            View →
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Results Count */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {filteredAgents.length} of {agents.length} agents
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
