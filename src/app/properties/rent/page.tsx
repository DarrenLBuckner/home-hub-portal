'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FilterDrawer } from '@/components/FilterDrawer';

interface Property {
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
  images: string[];
  amenities: string[];
  listing_type: string;
  status: string;
  created_at: string;
}

export const metadata = {
  title: 'Properties for Rent - Guyana Home Hub', 
  description: 'Browse rental properties in Guyana. Find apartments, houses, and rooms for rent.',
  keywords: 'properties for rent, Guyana rentals, apartments for rent, houses for rent'
};

export default function RentPropertiesPage() {
  const [showFilters, setShowFilters] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  // Fetch rental properties
  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public/properties?site=guyana&listing_type=rent&limit=50');
      const data = await response.json();
      setProperties(data.properties || []);
    } catch (error) {
      console.error('Error fetching rental properties:', error);
      setProperties([]);
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
                {loading ? 'Loading...' : `${properties.length} Rentals Available`}
              </h1>
              <p className="text-gray-600 text-sm mt-1">Find your perfect rental property in Guyana</p>
            </div>
            <button
              onClick={() => setShowFilters(true)}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 focus:ring-2 focus:ring-green-500 flex items-center gap-2"
            >
              🔍 Filters
            </button>
          </div>
        </div>
      </div>

      {/* PROPERTIES FIRST - NO SCROLLING NEEDED */}
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
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏠</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Rental Properties Yet</h2>
            <p className="text-gray-600 mb-6">We're building our rental inventory. Check back soon!</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Want to list your rental property?</p>
              <Link href="/register/landlord" className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700">
                List Your Rental
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <div key={property.id} className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-shadow">
                {/* Property Image */}
                <div className="relative h-48 overflow-hidden rounded-t-xl">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-4xl">🏠</span>
                    </div>
                  )}
                  
                  {/* Rental Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded">
                      FOR RENT
                    </span>
                  </div>
                  
                  {/* Price Tag */}
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-white/90 text-gray-800 font-bold px-3 py-1 rounded-lg text-lg">
                      {formatPrice(property.price, property.currency)}/mo
                    </span>
                  </div>
                </div>

                {/* Property Info */}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                    {property.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    📍 {property.region ? `${property.region}, ` : ''}{property.location}
                  </p>

                  {/* Property Details */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    {property.bedrooms && (
                      <span className="flex items-center gap-1">
                        🛏️ {property.bedrooms} bed{property.bedrooms !== 1 ? 's' : ''}
                      </span>
                    )}
                    {property.bathrooms && (
                      <span className="flex items-center gap-1">
                        🚿 {property.bathrooms} bath{property.bathrooms !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Property Type */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {property.property_type}
                    </span>
                    
                    <Link 
                      href={`/properties/${property.id}`}
                      className="text-green-600 font-semibold text-sm hover:text-green-700"
                    >
                      View Details →
                    </Link>
                  </div>

                  {/* Amenities Preview */}
                  {property.amenities && property.amenities.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {property.amenities.slice(0, 3).map((amenity, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded"
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{property.amenities.length - 3} more
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
        {properties.length > 0 && properties.length >= 50 && (
          <div className="text-center mt-8">
            <button className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700">
              Load More Properties
            </button>
          </div>
        )}
      </div>

      {/* Filter Drawer - Hidden by default */}
      {showFilters && (
        <FilterDrawer 
          onClose={() => setShowFilters(false)}
          filterType="rent"
          onApplyFilters={handleApplyFilters}
        />
      )}
    </div>
  );
}