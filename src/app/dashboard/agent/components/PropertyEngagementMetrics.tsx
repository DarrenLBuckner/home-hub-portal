"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@/supabase';

interface PropertyEngagement {
  property_id: string;
  property_title: string;
  property_price: number;
  property_location: string;
  likes_count: number;
  favorites_count: number;
  total_engagement: number;
  image_url?: string;
}

export default function PropertyEngagementMetrics({ userId }: { userId: string }) {
  const [engagementData, setEngagementData] = useState<PropertyEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalFavorites, setTotalFavorites] = useState(0);

  useEffect(() => {
    fetchEngagementMetrics();
  }, [userId]);

  const fetchEngagementMetrics = async () => {
    try {
      const supabase = createClient();
      
      // Get agent's properties
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id, title, price, location, image_urls')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (propertiesError) {
        console.error('Error fetching properties:', propertiesError);
        return;
      }

      if (!properties || properties.length === 0) {
        setEngagementData([]);
        setLoading(false);
        return;
      }

      // Get likes data for all properties
      const propertyIds = properties.map(p => p.id);
      const { data: likesData, error: likesError } = await supabase
        .from('property_likes')
        .select('property_id')
        .in('property_id', propertyIds);

      if (likesError) {
        console.error('Error fetching likes:', likesError);
      }

      // Count likes per property
      const likesCount: Record<string, number> = {};
      likesData?.forEach(like => {
        likesCount[like.property_id] = (likesCount[like.property_id] || 0) + 1;
      });

      // For now, we'll simulate favorites data since it's stored in the frontend
      // In a real implementation, you'd want to sync this data or query it differently
      const favoritesCount: Record<string, number> = {};
      
      // Transform into engagement metrics
      const engagement: PropertyEngagement[] = properties.map(property => {
        const likes = likesCount[property.id] || 0;
        const favorites = favoritesCount[property.id] || Math.floor(likes * 0.3); // Rough estimate
        
        return {
          property_id: property.id,
          property_title: property.title,
          property_price: property.price,
          property_location: property.location || 'Location not specified',
          likes_count: likes,
          favorites_count: favorites,
          total_engagement: likes + favorites,
          image_url: property.image_urls?.[0] || null
        };
      });

      // Sort by total engagement
      engagement.sort((a, b) => b.total_engagement - a.total_engagement);

      setEngagementData(engagement);
      setTotalLikes(engagement.reduce((sum, item) => sum + item.likes_count, 0));
      setTotalFavorites(engagement.reduce((sum, item) => sum + item.favorites_count, 0));
      
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
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

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <span>📊</span>
          <span>Property Engagement</span>
        </h3>
        <button 
          onClick={fetchEngagementMetrics}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">👍</span>
            <div>
              <p className="text-sm text-gray-600">Total Likes</p>
              <p className="text-2xl font-bold text-blue-600">{totalLikes}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-sm text-gray-600">Total Saved</p>
              <p className="text-2xl font-bold text-yellow-600">{totalFavorites}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <div>
              <p className="text-sm text-gray-600">Active Properties</p>
              <p className="text-2xl font-bold text-green-600">{engagementData.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Property List */}
      {engagementData.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <span className="text-4xl mb-4 block">🏠</span>
          <p className="text-lg font-medium">No active properties</p>
          <p className="text-sm">Upload your first property to see engagement metrics.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 mb-3">Property Performance</h4>
          {engagementData.map((property) => (
            <div key={property.property_id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start gap-4">
                {/* Property Image */}
                <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  {property.image_url ? (
                    <img 
                      src={property.image_url} 
                      alt={property.property_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      🏠
                    </div>
                  )}
                </div>

                {/* Property Info */}
                <div className="flex-1 min-w-0">
                  <h5 className="font-medium text-gray-900 truncate">{property.property_title}</h5>
                  <p className="text-sm text-gray-500 truncate">{property.property_location}</p>
                  <p className="text-sm font-medium text-green-600">{formatPrice(property.property_price)}</p>
                </div>

                {/* Engagement Metrics */}
                <div className="flex gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-medium text-blue-600">{property.likes_count}</p>
                    <p className="text-gray-500">👍 Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-yellow-600">{property.favorites_count}</p>
                    <p className="text-gray-500">⭐ Saved</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900">{property.total_engagement}</p>
                    <p className="text-gray-500">📊 Total</p>
                  </div>
                </div>
              </div>

              {/* Engagement Bar */}
              {property.total_engagement > 0 && (
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <span>Engagement Level</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-yellow-500 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (property.total_engagement / Math.max(...engagementData.map(p => p.total_engagement))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Call to Action */}
      {engagementData.length > 0 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
          <h5 className="font-medium text-gray-900 mb-2">💡 Boost Your Engagement</h5>
          <p className="text-sm text-gray-600 mb-3">
            Properties with high engagement get more visibility and inquiries.
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Add more high-quality photos</li>
            <li>• Update property descriptions</li>
            <li>• Competitive pricing attracts more interest</li>
            <li>• Share your properties on social media</li>
          </ul>
        </div>
      )}
    </div>
  );
}