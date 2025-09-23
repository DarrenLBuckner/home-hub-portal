"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  bedrooms: number;
  bathrooms: number;
  square_footage: number;
  images: string[];
  property_type: string;
  listing_type: string;
  is_featured: boolean;
  featured_type: 'basic' | 'premium' | 'platinum' | null;
  contact_info: {
    phone?: string;
    whatsapp?: string;
  };
}

interface ApiResponse {
  properties: Property[];
  featured_properties: Property[];
  total: number;
  featured_count: number;
}

export default function PropertiesHomepage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public/properties?limit=20');
      const data: ApiResponse = await response.json();
      
      if (response.ok) {
        setProperties(data.properties || []);
        setFeaturedProperties(data.featured_properties || []);
      } else {
        setError('Failed to fetch properties');
      }
    } catch (err) {
      setError('Error loading properties');
      console.error('Properties fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string = 'GYD') => {
    if (currency === 'GYD') {
      return `G$${price.toLocaleString()}`;
    }
    return `$${price.toLocaleString()} ${currency}`;
  };

  const getWhatsAppLink = (phone: string, property: Property) => {
    const message = encodeURIComponent(
      `Hi! I'm interested in your property: ${property.title} - ${formatPrice(property.price, property.currency)}`
    );
    const cleanPhone = phone.replace(/[^\d]/g, '');
    return `https://wa.me/${cleanPhone}?text=${message}`;
  };

  const getFeaturedBadge = (featuredType: string | null) => {
    switch (featuredType) {
      case 'platinum':
        return {
          badge: 'TOP PICK',
          bgColor: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
          textColor: 'text-white',
          borderColor: 'border-yellow-400',
          shadowColor: 'shadow-yellow-400/25'
        };
      case 'premium':
        return {
          badge: 'FEATURED',
          bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
          textColor: 'text-white',
          borderColor: 'border-blue-400',
          shadowColor: 'shadow-blue-400/25'
        };
      case 'basic':
        return {
          badge: 'FEATURED',
          bgColor: 'bg-gradient-to-r from-green-500 to-green-600',
          textColor: 'text-white',
          borderColor: 'border-green-400',
          shadowColor: 'shadow-green-400/25'
        };
      default:
        return null;
    }
  };

  const PropertyCard = ({ property, isFeatured = false }: { property: Property; isFeatured?: boolean }) => {
    const featuredStyle = getFeaturedBadge(property.featured_type);
    const imageUrl = property.images && property.images.length > 0 
      ? property.images[0] 
      : 'https://placehold.co/400x300?text=No+Image';

    return (
      <div className={`
        property-card bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-[1.02]
        ${isFeatured ? 'lg:col-span-2' : ''}
        ${featuredStyle ? `border-2 ${featuredStyle.borderColor} ${featuredStyle.shadowColor} shadow-lg` : 'border border-gray-200'}
      `}>
        {/* Image Container */}
        <div className="relative h-48 md:h-56 overflow-hidden">
          <Image
            src={imageUrl}
            alt={property.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {/* Featured Badge */}
          {featuredStyle && (
            <div className={`
              absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold tracking-wide
              ${featuredStyle.bgColor} ${featuredStyle.textColor} shadow-lg
            `}>
              {featuredStyle.badge}
            </div>
          )}
          
          {/* Property Type Icon */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2">
            <span className="text-xl">
              {property.property_type === 'house' ? '🏠' : 
               property.property_type === 'apartment' ? '🏢' : 
               property.property_type === 'condo' ? '🏬' : 
               property.property_type === 'commercial' ? '🏭' : 
               property.property_type === 'land' ? '🌳' : '🏠'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {/* Title and Price */}
          <div className="mb-3">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 line-clamp-2">
              {property.title}
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-xl md:text-2xl font-bold text-blue-600">
                {formatPrice(property.price, property.currency)}
              </span>
              <span className="text-sm text-gray-500 capitalize">
                For {property.listing_type}
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center text-gray-600 mb-3">
            <span className="mr-1">📍</span>
            <span className="text-sm">{property.location}</span>
          </div>

          {/* Property Details */}
          <div className="flex items-center gap-4 mb-4 text-sm text-gray-700">
            <span className="flex items-center gap-1">
              <span>🛏️</span> {property.bedrooms}
            </span>
            <span className="flex items-center gap-1">
              <span>🛁</span> {property.bathrooms}
            </span>
            <span className="flex items-center gap-1">
              <span>📏</span> {property.square_footage} sqft
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* WhatsApp Button - Prominent */}
            {property.contact_info?.whatsapp && (
              <a
                href={getWhatsAppLink(property.contact_info.whatsapp, property)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors duration-200 min-h-[44px] flex items-center justify-center"
              >
                <span className="mr-2">💬</span>
                WhatsApp
              </a>
            )}
            
            {/* Call Button */}
            {property.contact_info?.phone && (
              <a
                href={`tel:${property.contact_info.phone}`}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium text-center transition-colors duration-200 min-h-[44px] flex items-center justify-center"
              >
                <span className="mr-2">📞</span>
                Call
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading properties...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchProperties}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const regularProperties = properties.filter(p => !p.is_featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🏠</span>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                Portal Home Hub
              </h1>
            </Link>
            <Link 
              href="/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Featured Properties Section */}
        {featuredProperties.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                ⭐ Featured Properties
              </h2>
              <span className="text-sm text-gray-500">
                {featuredProperties.length} featured
              </span>
            </div>
            
            {/* Mobile: Horizontal Scroll */}
            <div className="md:hidden">
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
                {featuredProperties.map((property) => (
                  <div key={property.id} className="min-w-[280px] snap-start">
                    <PropertyCard property={property} isFeatured={true} />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Desktop: Grid */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {featuredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} isFeatured={true} />
              ))}
            </div>
          </section>
        )}

        {/* Regular Properties Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              All Properties
            </h2>
            <span className="text-sm text-gray-500">
              {properties.length} total
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>

        {/* Empty State */}
        {properties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Properties Available
            </h3>
            <p className="text-gray-600">
              Check back soon for new listings!
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Portal Home Hub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}