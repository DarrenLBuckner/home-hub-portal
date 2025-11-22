'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Professional Services Overview Component for Portal Home Hub
 * Features the same beautiful design as Guyana Home Hub
 */

interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  icon: string;
  category: string;
  serviceType?: 'free' | 'card' | 'banner';
  price: number;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress?: string;
  contactWebsite?: string;
  featuredImage?: string;
  galleryImages: string[];
}

interface ServicePackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  currency: string;
  savings: number;
  isFeatured: boolean;
  packageType: string;
  durationDays: number;
  includes: string[];
  includedServices: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    quantity: number;
  }>;
}

interface ServicesData {
  countryCode: string;
  countryName: string;
  services: Service[];
  servicesByCategory: Record<string, Service[]>;
  packages: ServicePackage[];
  featuredPackage: ServicePackage | null;
}

const getIconEmoji = (icon: string) => {
  const iconMap = {
    camera: '📸',
    drone: '🚁',
    cube: '🏠',
    lock: '🔐',
    package: '📦'
  };
  return iconMap[icon as keyof typeof iconMap] || '⭐';
};

const formatPrice = (price: number, currency: string) => {
  if (currency === 'GYD') {
    return `G$${price.toLocaleString()}`;
  }
  if (currency === 'JMD') {
    return `J$${price.toLocaleString()}`;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(price);
};

export default function ServicesOverview() {
  const [servicesData, setServicesData] = useState<ServicesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = '/api/services';
      console.log('🔍 Fetching services from Portal Home Hub API:', apiUrl);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Services data loaded:', data);
      
      setServicesData(data);
    } catch (err) {
      console.error('❌ Error fetching services:', err);
      setError('Failed to load services. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading professional services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Services</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchServices}
            className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!servicesData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl">
              Professional Real Estate Services
            </h1>
            <p className="mt-6 text-xl text-blue-100 sm:text-2xl">
              Everything you need to market your {servicesData.countryName} property professionally
            </p>
          </div>
        </div>
      </div>

      {/* Featured Package */}
      {servicesData.featuredPackage && (
        <div className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                ⭐ Most Popular
              </span>
              <h2 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
                {servicesData.featuredPackage.name}
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                {servicesData.featuredPackage.shortDescription}
              </p>
            </div>

            <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
              <div className="px-8 py-12 sm:px-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">
                    {formatPrice(servicesData.featuredPackage.price, servicesData.featuredPackage.currency)}
                  </div>
                  {servicesData.featuredPackage.savings > 0 && (
                    <div className="mt-2 text-lg text-blue-600 font-medium">
                      Save {formatPrice(servicesData.featuredPackage.savings, servicesData.featuredPackage.currency)}!
                    </div>
                  )}
                  <div className="mt-4 text-gray-600">
                    Complete in {servicesData.featuredPackage.durationDays} days
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Included:</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {servicesData.featuredPackage.includes.map((item, index) => (
                      <div key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">✓</span>
                        <span className="text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-10 text-center">
                  <button
                    onClick={() => {
                      // TODO: Implement lead capture modal or redirect to registration
                      alert('Lead capture coming soon! For now, please contact us directly.');
                    }}
                    className="inline-flex items-center rounded-md bg-blue-600 px-8 py-4 text-lg font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Get Started
                    <span className="ml-2">→</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Services */}
      <div className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Individual Services
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Choose exactly what you need for your property
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {servicesData.services.map((service, index) => (
              <div
                key={service.id}
                className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200 hover:shadow-lg hover:ring-gray-300 transition-all duration-200"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-2xl">
                      {getIconEmoji(service.icon)}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(service.price, service.currency)}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {service.category}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {service.name}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3">
                    {service.shortDescription}
                  </p>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        // TODO: Implement service detail modal or page
                        alert('Service details coming soon!');
                      }}
                      className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Learn More
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Implement booking flow with lead capture
                        alert('Booking system coming soon! Please contact us directly.');
                      }}
                      className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Packages */}
      {servicesData.packages.length > 1 && (
        <div className="py-16 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Service Packages
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Bundle services together and save money
              </p>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {servicesData.packages.map((pkg, index) => (
                <div
                  key={pkg.id}
                  className={`overflow-hidden rounded-xl bg-white shadow-sm ring-1 transition-all duration-200 hover:shadow-lg ${
                    pkg.isFeatured 
                      ? 'ring-blue-200 shadow-md' 
                      : 'ring-gray-200 hover:ring-gray-300'
                  }`}
                >
                  <div className="p-8">
                    {pkg.isFeatured && (
                      <div className="mb-4">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                          ⭐ Featured
                        </span>
                      </div>
                    )}

                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {pkg.name}
                    </h3>
                    
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900">
                        {formatPrice(pkg.price, pkg.currency)}
                      </div>
                      {pkg.savings > 0 && (
                        <div className="text-sm text-blue-600 font-medium">
                          Save {formatPrice(pkg.savings, pkg.currency)}
                        </div>
                      )}
                    </div>

                    <p className="text-gray-600 mb-6">
                      {pkg.shortDescription}
                    </p>

                    <div className="mb-6">
                      <div className="text-sm font-medium text-gray-700 mb-2">Included Services:</div>
                      <div className="space-y-1">
                        {pkg.includedServices.slice(0, 3).map(service => (
                          <div key={service.id} className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">{getIconEmoji(service.icon)}</span>
                            {service.name}
                            {service.quantity > 1 && (
                              <span className="ml-1">({service.quantity})</span>
                            )}
                          </div>
                        ))}
                        {pkg.includedServices.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{pkg.includedServices.length - 3} more services
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        // TODO: Implement package booking with lead capture
                        alert('Package booking coming soon!');
                      }}
                      className={`block w-full rounded-md px-4 py-2 text-center text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        pkg.isFeatured
                          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
                      }`}
                    >
                      View Package
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Section */}
      <div className="py-16 bg-blue-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-xl text-blue-100">
            Contact us today for a free consultation on your property marketing needs
          </p>
          <div className="mt-8 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-y-0 sm:space-x-6">
            <button
              onClick={() => {
                // TODO: Implement contact form or lead capture
                alert('Contact form coming soon! Please call us directly.');
              }}
              className="rounded-md bg-white px-8 py-3 text-lg font-semibold text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600"
            >
              Contact Us
            </button>
            {servicesData.services[0]?.contactPhone && (
              <a
                href={`tel:${servicesData.services[0].contactPhone}`}
                className="text-lg font-semibold text-white hover:text-blue-100"
              >
                📞 {servicesData.services[0].contactPhone}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}