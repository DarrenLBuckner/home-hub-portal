"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface FeaturingPrice {
  site_id: string;
  feature_type: string;
  is_active: boolean;
  price_gyd: number;
  duration_days: number;
  description?: string;
}

function PricingContent() {
  const searchParams = useSearchParams();
  const site = searchParams?.get('site') || 'portal';
  const [prices, setPrices] = useState<FeaturingPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchPrices() {
      try {
        setLoading(true);
        
        // First try to get prices for the specific site (only active ones)
        const { data: siteRows, error: siteError } = await supabase
          .from('featuring_prices')
          .select('*')
          .eq('site_id', site)
          .eq('is_active', true)  // <<< IMPORTANT: Only active prices
          .order('duration_days', { ascending: true });

        if (siteError) {
          console.error('Error fetching site prices:', siteError);
          throw siteError;
        }

        // If no site-specific prices found, fallback to portal baseline (active only)
        const finalPrices = siteRows?.length ? siteRows : (
          await supabase.from('featuring_prices')
            .select('*')
            .eq('site_id', 'portal')
            .eq('is_active', true)  // <<< IMPORTANT: Only active prices
            .order('duration_days', { ascending: true })
        ).data;

        setPrices(finalPrices || []);
      } catch (err) {
        console.error('Failed to fetch pricing:', err);
        setError('Failed to load pricing information');
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, [site, supabase]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-GY', {
      style: 'currency',
      currency: 'GYD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getSiteDisplayName = (siteId: string) => {
    const siteNames: { [key: string]: string } = {
      'jamaica': 'Jamaica',
      'guyana': 'Guyana',
      'portal': 'Portal'
    };
    return siteNames[siteId] || siteId.charAt(0).toUpperCase() + siteId.slice(1);
  };

  const getFeatureDisplayName = (featureType: string) => {
    const featureNames: { [key: string]: string } = {
      'basic': 'Basic Feature',
      'premium': 'Premium Feature', 
      'platinum': 'Platinum Feature'
    };
    return featureNames[featureType] || featureType.charAt(0).toUpperCase() + featureType.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pricing information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold">Error</div>
            <p className="mt-2 text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {getSiteDisplayName(site)} Property Featuring
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Boost your property visibility with our featuring options. Get more views and inquiries.
          </p>
          {site !== 'portal' && (
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              ✅ Live Market - {getSiteDisplayName(site)}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        {prices.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {prices.map((price, index) => (
              <div
                key={`${price.site_id}-${price.feature_type}`}
                className={`relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ${
                  price.feature_type === 'premium' ? 'ring-2 ring-blue-500 transform scale-105' : ''
                }`}
              >
                {price.feature_type === 'premium' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {getFeatureDisplayName(price.feature_type)}
                  </h3>
                  
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(price.price_gyd)}
                    </span>
                    <span className="text-gray-600 ml-2">
                      for {price.duration_days} days
                    </span>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Featured placement</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Increased visibility</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-700">Priority in search results</span>
                    </div>
                    {price.feature_type === 'platinum' && (
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Premium badge</span>
                      </div>
                    )}
                  </div>

                  <button className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300">
                    Select {getFeatureDisplayName(price.feature_type)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-500 text-lg">
              {site === 'portal' ? (
                'No pricing information available.'
              ) : (
                <>
                  No pricing available for {getSiteDisplayName(site)} yet.
                  <br />
                  <span className="text-sm mt-2 inline-block">
                    This market is not yet live. Please check back later.
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Need Help?</h3>
            <p className="text-gray-600">
              Contact our support team for assistance with property featuring options.
            </p>
            <div className="mt-4">
              <a
                href="mailto:support@portalhomehub.com"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                support@portalhomehub.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}