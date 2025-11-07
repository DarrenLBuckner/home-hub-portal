'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FilterDrawer } from '@/components/FilterDrawer';

interface Development {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  location: string;
  region: string;
  property_type: string;
  bedrooms: number;
  bathrooms: number;
  house_size_value: number;
  land_size_value: number;
  images: string[];
  amenities: string[];
  listing_type: string;
  status: string;
  created_at: string;
  development_name?: string;
  total_units?: number;
  units_available?: number;
}

export default function DevelopmentsPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [developments, setDevelopments] = useState<Development[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  // Fetch development properties
  useEffect(() => {
    fetchDevelopments();
  }, [filters]);

  const fetchDevelopments = async () => {
    try {
      setLoading(true);
      // For now, fetch all properties and filter for developments/new builds
      const response = await fetch('/api/public/properties?site=guyana&limit=50');
      const data = await response.json();
      
      // Filter for development-type properties or new builds
      const developmentProperties = data.properties?.filter((property: any) => 
        property.property_type === 'Development' || 
        property.title?.toLowerCase().includes('development') ||
        property.title?.toLowerCase().includes('new build') ||
        property.description?.toLowerCase().includes('development') ||
        property.amenities?.includes('New Construction')
      ) || [];
      
      setDevelopments(developmentProperties);
    } catch (error) {
      console.error('Error fetching developments:', error);
      setDevelopments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (newFilters: any) => {
    setFilters(newFilters);
  };

  const formatPrice = (price: number, currency: string) => {
    const symbol = currency === 'USD' ? '$' : currency === 'GYD' ? 'GY$' : currency;
    return `${symbol}${price?.toLocaleString() || 0}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header - ALWAYS VISIBLE */}
      <div className="sticky top-0 bg-white z-30 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {loading ? 'Loading...' : `${developments.length} Developments`}
              </h1>
              <p className="text-gray-600 text-sm mt-1">New construction and development projects in Guyana</p>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 flex items-center gap-2"
            >
              🔍 Filters
            </button>
          </div>
        </div>
      </div>

      {/* DEVELOPMENTS FIRST - NO SCROLLING NEEDED */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border animate-pulse">
                <div className="h-48 bg-gray-300 rounded-t-xl"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : developments.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏗️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Developments Available</h2>
            <p className="text-gray-600 mb-6">We're working on bringing you the latest development projects. Check back soon!</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Are you a developer?</p>
              <Link href="/register/select-country" className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700">
                List Your Development
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {developments.map((development) => (
              <div key={development.id} className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow">
                {/* Development Image */}
                <div className="relative h-48 overflow-hidden rounded-t-xl">
                  {development.images && development.images.length > 0 ? (
                    <Image
                      src={development.images[0]}
                      alt={development.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-4xl">🏗️</span>
                    </div>
                  )}
                  
                  {/* Development Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded">
                      NEW DEVELOPMENT
                    </span>
                  </div>
                  
                  {/* Price Tag */}
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-white/90 text-gray-800 font-bold px-3 py-1 rounded-lg text-lg">
                      From {formatPrice(development.price, development.currency)}
                    </span>
                  </div>
                  
                  {/* Units Available */}
                  {development.units_available && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-white/90 text-gray-700 text-xs font-semibold px-2 py-1 rounded">
                        {development.units_available} units left
                      </span>
                    </div>
                  )}
                </div>

                {/* Development Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                    {development.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    📍 {development.region ? `${development.region}, ` : ''}{development.location}
                  </p>

                  {/* Development Details */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    {development.bedrooms && (
                      <span className="flex items-center gap-1">
                        🛏️ {development.bedrooms} bed{development.bedrooms !== 1 ? 's' : ''}
                      </span>
                    )}
                    {development.bathrooms && (
                      <span className="flex items-center gap-1">
                        🚿 {development.bathrooms} bath{development.bathrooms !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Property Type and Size */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {development.property_type}
                    </span>
                    
                    {development.house_size_value && (
                      <span className="text-xs text-gray-600">
                        📐 {development.house_size_value.toLocaleString()} sq ft
                      </span>
                    )}
                  </div>

                  {/* Development Status */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded font-semibold">
                        🚧 Under Construction
                      </span>
                    </div>
                  </div>

                  {/* View Details Link */}
                  <Link 
                    href={`/properties/${development.id}`}
                    className="block w-full text-center bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    View Development
                  </Link>

                  {/* Amenities Preview */}
                  {development.amenities && development.amenities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {development.amenities.slice(0, 3).map((amenity, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                        {development.amenities.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{development.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {developments.length > 0 && developments.length >= 50 && (
          <div className="text-center mt-8">
            <button className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700">
              Load More Developments
            </button>
          </div>
        )}
      </div>

      {/* Filter Drawer - Hidden by default */}
      {showFilters && (
        <FilterDrawer 
          onClose={() => setShowFilters(false)}
          filterType="developments"
          onApplyFilters={handleApplyFilters}
        />
      )}
    </div>
  );
}