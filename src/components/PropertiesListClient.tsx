'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';


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
  house_size_value?: number;
  land_size_value?: number;
  images: string[];
  amenities: string[];
  listing_type: string;
  status: string;
  created_at: string;
  available_from?: string | null;
}

function getAvailabilityBadge(property: Property): { text: string; classes: string } | null {
  if (property.listing_type !== 'rent' && property.listing_type !== 'lease' && property.listing_type !== 'short_term_rent') return null;
  if (!property.available_from) return { text: 'Available Now', classes: 'bg-green-500 text-white' };
  const date = new Date(property.available_from);
  if (date <= new Date()) return { text: 'Available Now', classes: 'bg-green-500 text-white' };
  const label = date.toLocaleString('default', { month: 'short', year: 'numeric' });
  return { text: `Available ${label}`, classes: 'bg-amber-500 text-white' };
}

interface PropertiesListClientProps {
  initialProperties: Property[];
  listingType: 'sale' | 'rent';
}

export default function PropertiesListClient({ 
  initialProperties, 
  listingType 
}: PropertiesListClientProps) {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(initialProperties);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedPropertyType, setSelectedPropertyType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000000 });
  const [bedroomFilter, setBedroomFilter] = useState('any');
  const [bathroomFilter, setBathroomFilter] = useState('any');
  const [sortBy, setSortBy] = useState('newest');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch properties from API on component mount
  useEffect(() => {
    async function fetchProperties() {
      try {
        setLoading(true);
        setError(null);
        
        // Get country from middleware cookie
        const countryCode = document.cookie
          .split('; ')
          .find(row => row.startsWith('country-code='))
          ?.split('=')[1] || 'GY';
        
        // Map country code to site ID for API
        const siteId = countryCode === 'JM' ? 'jamaica' : 'guyana';
        
        console.log(`🔍 Fetching properties - Site: ${siteId}, Listing Type: ${listingType}, Country Code: ${countryCode}`);
        
        // Fetch properties from API - only residential properties for rent/sale pages
        const response = await fetch(
          `/api/public/properties?site=${siteId}&listing_type=${listingType}&property_category=residential&limit=100&bust=${Date.now()}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch properties: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`✅ Loaded ${data.properties?.length || 0} properties for ${siteId}`);
        
        setProperties(data.properties || []);
        setFilteredProperties(data.properties || []);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError(err instanceof Error ? err.message : 'Failed to load properties');
        // Fallback to initialProperties if provided
        if (initialProperties.length > 0) {
          setProperties(initialProperties);
          setFilteredProperties(initialProperties);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchProperties();
  }, [listingType]); // Re-fetch if listingType changes

  // Update properties when initialProperties change (fallback)
  useEffect(() => {
    if (initialProperties.length > 0 && properties.length === 0) {
      setProperties(initialProperties);
      setFilteredProperties(initialProperties);
    }
  }, [initialProperties, properties.length]);

  // Get unique regions and property types from properties
  const regions = [...new Set(properties.map(p => p.region))].filter(Boolean).sort();
  const propertyTypes = [...new Set(properties.map(p => p.property_type))].filter(Boolean).sort();

  // Apply filters
  useEffect(() => {
    let filtered = properties.filter(property => {
      // Search term filter
      const matchesSearch = searchTerm === '' || 
        property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Region filter
      const matchesRegion = selectedRegion === 'all' || property.region === selectedRegion;

      // Property type filter
      const matchesPropertyType = selectedPropertyType === 'all' || property.property_type === selectedPropertyType;

      // Price range filter
      const matchesPrice = property.price >= priceRange.min && property.price <= priceRange.max;

      // Bedroom filter
      const matchesBedrooms = bedroomFilter === 'any' || 
        (bedroomFilter === '4+' ? property.bedrooms >= 4 : property.bedrooms === parseInt(bedroomFilter));

      // Bathroom filter
      const matchesBathrooms = bathroomFilter === 'any' || 
        (bathroomFilter === '3+' ? property.bathrooms >= 3 : property.bathrooms === parseInt(bathroomFilter));

      return matchesSearch && matchesRegion && matchesPropertyType && 
             matchesPrice && matchesBedrooms && matchesBathrooms;
    });

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      default:
        break;
    }

    setFilteredProperties(filtered);
  }, [properties, searchTerm, selectedRegion, selectedPropertyType, priceRange, bedroomFilter, bathroomFilter, sortBy]);

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency === 'GYD' ? 'USD' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace('$', currency === 'GYD' ? 'G$' : '$');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRegion('all');
    setSelectedPropertyType('all');
    setPriceRange({ min: 0, max: 10000000 });
    setBedroomFilter('any');
    setBathroomFilter('any');
    setSortBy('newest');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedRegion !== 'all') count++;
    if (selectedPropertyType !== 'all') count++;
    if (priceRange.min > 0 || priceRange.max < 10000000) count++;
    if (bedroomFilter !== 'any') count++;
    if (bathroomFilter !== 'any') count++;
    return count;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Properties for {listingType === 'sale' ? 'Sale' : 'Rent'}
          </h1>
          <p className="text-xl text-emerald-100 max-w-2xl">
            {listingType === 'sale' 
              ? 'Discover your dream home in Guyana. Browse our extensive collection of houses, apartments, and land for sale.'
              : 'Find the perfect rental property in Guyana. Browse apartments, houses, and rooms available for rent.'
            }
          </p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by location, title, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Filter Button */}
            <div className="flex gap-4">
              <button
                onClick={() => setIsFilterOpen(true)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.121A1 1 0 013 6.414V4z" />
                </svg>
                Filter
                {getActiveFiltersCount() > 0 && (
                  <span className="bg-emerald-800 text-xs px-2 py-1 rounded-full">
                    {getActiveFiltersCount()}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {getActiveFiltersCount() > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  Search: "{searchTerm}"
                  <button onClick={() => setSearchTerm('')} className="ml-1 hover:bg-emerald-200 rounded-full p-1">×</button>
                </span>
              )}
              {selectedRegion !== 'all' && (
                <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  Region: {selectedRegion}
                  <button onClick={() => setSelectedRegion('all')} className="ml-1 hover:bg-emerald-200 rounded-full p-1">×</button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Loading properties...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-bold text-red-800 mb-2">Error Loading Properties</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Results Section */}
      {!loading && !error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredProperties.length} Properties Found
            </h2>
          </div>

        {/* Properties Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div key={property.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                {/* Property Image */}
                <div className="relative h-48 bg-gray-200">
                  {property.images && property.images.length > 0 ? (
                    <Image
                      src={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span className="bg-emerald-600 text-white px-2 py-1 rounded text-sm font-medium capitalize">
                      For {listingType}
                    </span>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {property.title}
                    </h3>
                    <p className="text-gray-600 text-sm">{property.location}, {property.region}</p>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {property.description}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatPrice(property.price, property.currency)}
                    </div>
                    <div className="text-sm text-gray-500 capitalize">
                      {property.property_type}
                    </div>
                  </div>

                  {/* Availability badge — card body, Zillow/Property24 style */}
                  {(() => {
                    const badge = getAvailabilityBadge(property);
                    if (!badge) return null;
                    return (
                      <div className="mb-3">
                        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${badge.classes}`}>
                          {badge.text}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Property Features */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                    {property.bedrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16" />
                        </svg>
                        {property.bedrooms} bed
                      </span>
                    )}
                    {property.bathrooms > 0 && (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M7 21V10a4 4 0 118 0v11M7 10V9a2 2 0 114 0v1" />
                        </svg>
                        {property.bathrooms} bath
                      </span>
                    )}
                  </div>

                  {/* View Details Button */}
                  <Link 
                    href={`/properties/${property.id}`}
                    className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg hover:bg-emerald-700 transition-colors text-center font-medium block"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
            <button
              onClick={clearFilters}
              className="text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
      )}

      {/* Filter Drawer */}
      {isFilterOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Filter Properties</h2>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Region Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Regions</option>
                  {regions.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              {/* Property Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
                <select
                  value={selectedPropertyType}
                  onChange={(e) => setSelectedPropertyType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Types</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: G${priceRange.min.toLocaleString()} - G${priceRange.max.toLocaleString()}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min || ''}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) || 0 }))}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max === 10000000 ? '' : priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) || 10000000 }))}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Bedrooms Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <select
                  value={bedroomFilter}
                  onChange={(e) => setBedroomFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="any">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4+">4+</option>
                </select>
              </div>

              {/* Bathrooms Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <select
                  value={bathroomFilter}
                  onChange={(e) => setBathroomFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="any">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3+">3+</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 py-2 px-4 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}