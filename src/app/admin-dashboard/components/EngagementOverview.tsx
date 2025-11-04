"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@/supabase';

interface EngagementData {
  total_properties: number;
  total_likes: number;
  total_agents: number;
  top_properties: Array<{
    property_id: string;
    title: string;
    price: number;
    location: string;
    country: string;
    agent_name: string;
    likes_count: number;
    total_engagement: number;
    image_url?: string;
  }>;
  country_breakdown: Array<{
    country: string;
    properties_count: number;
    total_likes: number;
    agents_count: number;
  }>;
}

export default function EngagementOverview() {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEngagementData();
  }, [selectedCountry]);

  const fetchEngagementData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      // Build URL with country filter
      let url = '/api/admin/engagement-overview';
      if (selectedCountry !== 'all') {
        url += `?country=${selectedCountry}`;
      }

      const response = await fetch(url);
      
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch data');
      }
    } catch (err) {
      console.error('Error fetching engagement data:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace('$', 'GYD ');
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'guyana': '🇬🇾',
      'jamaica': '🇯🇲',
      'barbados': '🇧🇧',
      'trinidad': '🇹🇹'
    };
    return flags[country] || '🌍';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load engagement data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={fetchEngagementData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Country Filter */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span>📊</span>
              <span>Platform Engagement</span>
            </h2>
            <p className="text-gray-600">Property likes and user engagement across the platform</p>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Country:</label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Countries</option>
              <option value="guyana">🇬🇾 Guyana</option>
              <option value="jamaica">🇯🇲 Jamaica</option>
              <option value="barbados">🇧🇧 Barbados</option>
              <option value="trinidad">🇹🇹 Trinidad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <span className="text-2xl">🏠</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{data.total_properties}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <span className="text-2xl">👍</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-green-600">{data.total_likes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-purple-600">{data.total_agents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <span className="text-2xl">🔥</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg Engagement</p>
              <p className="text-2xl font-bold text-yellow-600">
                {data.total_properties > 0 ? Math.round(data.total_likes / data.total_properties) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Properties */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🏆</span>
          <span>Top Performing Properties</span>
        </h3>
        
        {data.top_properties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-4 block">📈</span>
            <p>No engagement data yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.top_properties.slice(0, 5).map((property, index) => (
              <div key={property.property_id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                </div>
                
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  {property.image_url ? (
                    <img 
                      src={property.image_url} 
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      🏠
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">{property.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{getCountryFlag(property.country)} {property.location}</span>
                    <span>•</span>
                    <span>by {property.agent_name}</span>
                  </div>
                  <p className="text-sm font-medium text-green-600">{formatPrice(property.price)}</p>
                </div>
                
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-blue-600">{property.likes_count}</p>
                    <p className="text-gray-500">👍</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900">{property.total_engagement}</p>
                    <p className="text-gray-500">📊</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Country Breakdown */}
      {selectedCountry === 'all' && data.country_breakdown.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🌍</span>
            <span>Country Performance</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.country_breakdown.map((country) => (
              <div key={country.country} className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{getCountryFlag(country.country)}</span>
                  <h4 className="font-semibold capitalize">{country.country}</h4>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Properties:</span>
                    <span className="font-medium">{country.properties_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Likes:</span>
                    <span className="font-medium text-blue-600">{country.total_likes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agents:</span>
                    <span className="font-medium">{country.agents_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}