'use client';

import React, { useState, useEffect } from 'react';
import DashboardHeader from '@/components/admin/DashboardHeader';

/**
 * Admin Advertising Management Dashboard
 * Comprehensive advertising management for all Portal Home Hub countries
 */

interface Advertiser {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  business_type: string;
  country_code: string;
  status: 'pending' | 'approved' | 'active' | 'suspended' | 'banned';
  is_verified: boolean;
  created_at: string;
}

interface Campaign {
  id: string;
  advertiser_id: string;
  name: string;
  description: string;
  campaign_type: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  target_countries: string[];
  total_budget: number;
  daily_budget: number;
  bid_amount: number;
  billing_model: string;
  status: 'draft' | 'pending' | 'approved' | 'active' | 'paused' | 'completed' | 'rejected';
  advertiser: {
    company_name: string;
  };
}

interface AdPlacement {
  id: string;
  name: string;
  slug: string;
  page_type: string;
  position: string;
  country_code: string;
  base_price: number;
  is_active: boolean;
}

interface AnalyticsData {
  totalImpressions: number;
  totalClicks: number;
  totalRevenue: number;
  activeCampaigns: number;
  activeAdvertisers: number;
  clickThroughRate: number;
}

export default function AdminAdvertisingPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'advertisers' | 'campaigns' | 'placements' | 'analytics'>('overview');
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  const countries = [
    { code: 'all', name: 'All Countries' },
    { code: 'GY', name: 'Guyana' },
    { code: 'JM', name: 'Jamaica' },
    { code: 'BB', name: 'Barbados' },
    { code: 'TT', name: 'Trinidad and Tobago' },
    { code: 'US', name: 'United States' }
  ];

  const businessTypes = [
    { value: 'real-estate', label: 'Real Estate' },
    { value: 'mortgage', label: 'Mortgage & Finance' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'home-services', label: 'Home Services' },
    { value: 'construction', label: 'Construction' },
    { value: 'legal', label: 'Legal Services' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchData();
  }, [selectedCountry, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const endpoints = {
        overview: ['/api/admin/advertising/overview', '/api/admin/advertising/analytics'],
        advertisers: ['/api/admin/advertising/advertisers'],
        campaigns: ['/api/admin/advertising/campaigns'],
        placements: ['/api/admin/advertising/placements'],
        analytics: ['/api/admin/advertising/analytics']
      };

      const currentEndpoints = endpoints[activeTab] || [endpoints.overview[0]];
      const queries = currentEndpoints.map(endpoint => {
        const url = selectedCountry === 'all' ? endpoint : `${endpoint}?country=${selectedCountry}`;
        return fetch(url);
      });

      const responses = await Promise.all(queries);
      const data = await Promise.all(responses.map(r => r.json()));

      if (activeTab === 'advertisers' || activeTab === 'overview') {
        setAdvertisers(data[0]?.advertisers || []);
      }
      if (activeTab === 'campaigns' || activeTab === 'overview') {
        setCampaigns(data[0]?.campaigns || []);
      }
      if (activeTab === 'placements' || activeTab === 'overview') {
        setPlacements(data[0]?.placements || []);
      }
      if (activeTab === 'analytics' || activeTab === 'overview') {
        setAnalytics(data[data.length - 1]?.analytics || null);
      }
    } catch (error) {
      console.error('Error fetching advertising data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveAdvertiser = async (advertiserId: string) => {
    try {
      const response = await fetch(`/api/admin/advertising/advertisers/${advertiserId}/approve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error approving advertiser:', error);
    }
  };

  const handleApproveCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/admin/advertising/campaigns/${campaignId}/approve`, {
        method: 'POST'
      });
      
      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error approving campaign:', error);
    }
  };

  const formatCurrency = (amount: number, country: string = 'GY') => {
    const currencies = {
      'GY': { code: 'GYD', symbol: 'G$' },
      'JM': { code: 'JMD', symbol: 'J$' },
      'BB': { code: 'BBD', symbol: 'B$' },
      'TT': { code: 'TTD', symbol: 'TT$' },
      'US': { code: 'USD', symbol: '$' }
    };
    
    const currency = currencies[country as keyof typeof currencies] || currencies.GY;
    return `${currency.symbol}${amount.toLocaleString()}`;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      suspended: 'bg-red-100 text-red-800',
      banned: 'bg-red-200 text-red-900',
      draft: 'bg-gray-100 text-gray-800',
      paused: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-200 text-green-900',
      rejected: 'bg-red-100 text-red-800'
    };
    
    return colors[status as keyof typeof colors] || colors.pending;
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Impressions</h3>
            <p className="text-2xl font-bold text-blue-600">{analytics.totalImpressions.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Clicks</h3>
            <p className="text-2xl font-bold text-green-600">{analytics.totalClicks.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Click Rate</h3>
            <p className="text-2xl font-bold text-purple-600">{(analytics.clickThroughRate * 100).toFixed(2)}%</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
            <p className="text-2xl font-bold text-green-700">{formatCurrency(analytics.totalRevenue, selectedCountry === 'all' ? 'US' : selectedCountry)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Campaigns</h3>
            <p className="text-2xl font-bold text-blue-700">{analytics.activeCampaigns}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Active Advertisers</h3>
            <p className="text-2xl font-bold text-indigo-600">{analytics.activeAdvertisers}</p>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
          </div>
          <div className="p-6">
            {advertisers.filter(a => a.status === 'pending').slice(0, 5).map((advertiser) => (
              <div key={advertiser.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{advertiser.company_name}</p>
                  <p className="text-sm text-gray-500">{advertiser.business_type} • {advertiser.country_code}</p>
                </div>
                <button
                  onClick={() => handleApproveAdvertiser(advertiser.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performing Placements */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Placements</h3>
          </div>
          <div className="p-6">
            {placements.filter(p => p.is_active).slice(0, 5).map((placement) => (
              <div key={placement.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{placement.name}</p>
                  <p className="text-sm text-gray-500">{placement.page_type} • {placement.position} • {placement.country_code}</p>
                </div>
                <p className="text-sm font-medium text-green-600">{formatCurrency(placement.base_price, placement.country_code)}/click</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAdvertisers = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Advertisers Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {advertisers.map((advertiser) => (
                <tr key={advertiser.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{advertiser.company_name}</div>
                      <div className="text-sm text-gray-500">{advertiser.website}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{advertiser.contact_name}</div>
                      <div className="text-sm text-gray-500">{advertiser.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {businessTypes.find(bt => bt.value === advertiser.business_type)?.label || advertiser.business_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{advertiser.country_code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(advertiser.status)}`}>
                      {advertiser.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {advertiser.status === 'pending' && (
                      <button
                        onClick={() => handleApproveAdvertiser(advertiser.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 mr-2"
                      >
                        Approve
                      </button>
                    )}
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Campaign Management</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Advertiser</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{campaign.description?.substring(0, 50)}...</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {campaign.advertiser?.company_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {campaign.campaign_type.replace('-', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{formatCurrency(campaign.total_budget)}</div>
                      <div className="text-sm text-gray-500">Daily: {formatCurrency(campaign.daily_budget)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {campaign.status === 'pending' && (
                      <button
                        onClick={() => handleApproveCampaign(campaign.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 mr-2"
                      >
                        Approve
                      </button>
                    )}
                    <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Standardized Header with Back Button */}
      <DashboardHeader
        title="Advertising Management"
        description="Manage advertisers, campaigns, and revenue across all Portal Home Hub sites"
        icon="📺"
        adminInfo="Multi-country advertising dashboard"
      />
      
      <div className="max-w-7xl mx-auto p-6">

        {/* Country Filter */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Country</label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {countries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'advertisers', label: 'Advertisers' },
              { key: 'campaigns', label: 'Campaigns' },
              { key: 'placements', label: 'Ad Placements' },
              { key: 'analytics', label: 'Analytics' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'advertisers' && renderAdvertisers()}
            {activeTab === 'campaigns' && renderCampaigns()}
            {activeTab === 'placements' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Ad Placements management coming soon...</p>
              </div>
            )}
            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <p className="text-gray-500">Advanced analytics coming soon...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}