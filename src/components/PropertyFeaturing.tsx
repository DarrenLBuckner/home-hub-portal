"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@/supabase';

interface FeaturingPrice {
  id: string;
  feature_type: string;
  duration_days: number;
  price_usd: number;
  price_gyd: number;
  visibility_boost: number;
  site_id: string;
}

interface FeaturingCredits {
  credits_balance: number;
  premium_credits: number;
  platinum_credits: number;
  monthly_basic_allowance: number;
  monthly_premium_allowance: number;
  monthly_platinum_allowance: number;
  credits_used_this_month: number;
  premium_used_this_month: number;
  platinum_used_this_month: number;
}

interface PropertyFeaturingProps {
  propertyId: string;
  propertyTitle: string;
  currentlyFeatured?: boolean;
  featuredUntil?: string;
  featuredType?: string;
  userType: 'fsbo' | 'landlord' | 'agent';
  siteId?: string;
  onFeaturingUpdate?: () => void;
}

const FEATURE_TYPE_INFO = {
  basic: {
    name: 'Basic Featured',
    color: 'blue',
    icon: '⭐',
    description: 'Highlighted in search results',
    benefits: ['Higher visibility', 'Featured badge', 'Priority sorting']
  },
  premium: {
    name: 'Premium Featured',
    color: 'purple',
    icon: '💎',
    description: 'Top placement and enhanced display',
    benefits: ['Top section placement', 'Enhanced property card', 'Premium badge', 'Higher visibility boost']
  },
  platinum: {
    name: 'Platinum Featured',
    color: 'yellow',
    icon: '👑',
    description: 'Maximum exposure and premium placement',
    benefits: ['Hero section placement', 'Premium styling', 'Platinum badge', 'Maximum visibility', 'Priority support']
  }
};

export default function PropertyFeaturing({ 
  propertyId, 
  propertyTitle, 
  currentlyFeatured = false,
  featuredUntil,
  featuredType,
  userType,
  siteId = 'portal',
  onFeaturingUpdate 
}: PropertyFeaturingProps) {
  const [prices, setPrices] = useState<FeaturingPrice[]>([]);
  const [credits, setCredits] = useState<FeaturingCredits | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<{
    type: string;
    duration: number;
    price: FeaturingPrice;
  } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'credits'>('stripe');

  useEffect(() => {
    loadFeaturingPrices();
    if (userType === 'agent') {
      loadFeaturingCredits();
    }
  }, [siteId, userType]);

  const loadFeaturingPrices = async () => {
    try {
      const response = await fetch(`/api/featuring/prices?site=${siteId}`);
      const data = await response.json();
      if (response.ok) {
        setPrices(data.prices || []);
      }
    } catch (error) {
      console.error('Failed to load featuring prices:', error);
    }
  };

  const loadFeaturingCredits = async () => {
    try {
      const response = await fetch('/api/featuring/credits');
      const data = await response.json();
      if (response.ok) {
        setCredits(data.credits);
      }
    } catch (error) {
      console.error('Failed to load featuring credits:', error);
    }
  };

  const handleFeaturingPurchase = async () => {
    if (!selectedFeature) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/featuring/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: propertyId,
          feature_type: selectedFeature.type,
          duration_days: selectedFeature.duration,
          payment_method: paymentMethod,
          site_id: siteId,
          currency: siteId === 'guyana' ? 'GYD' : 'USD'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully featured property for ${selectedFeature.duration} days!`);
        setShowModal(false);
        setSelectedFeature(null);
        
        // Refresh credits if used
        if (paymentMethod === 'credits') {
          loadFeaturingCredits();
        }
        
        // Notify parent component
        onFeaturingUpdate?.();
        
        // Auto-hide success message
        setTimeout(() => setSuccess(''), 5000);
      } else {
        setError(data.error || 'Failed to purchase featuring');
      }
    } catch (error) {
      setError('Network error occurred');
      console.error('Featuring purchase error:', error);
    }

    setLoading(false);
  };

  const formatPrice = (price: FeaturingPrice) => {
    const currency = siteId === 'guyana' ? 'GYD' : 'USD';
    const amount = currency === 'GYD' ? price.price_gyd : price.price_usd;
    const symbol = currency === 'GYD' ? 'GY$' : '$';
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  const getFeaturingStatus = () => {
    if (!currentlyFeatured) return null;
    
    const until = featuredUntil ? new Date(featuredUntil) : null;
    const daysLeft = until ? Math.ceil((until.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
    
    return { daysLeft, type: featuredType };
  };

  const featuringStatus = getFeaturingStatus();

  // Group prices by feature type
  const pricesByType = prices.reduce((acc, price) => {
    if (!acc[price.feature_type]) {
      acc[price.feature_type] = [];
    }
    acc[price.feature_type].push(price);
    return acc;
  }, {} as Record<string, FeaturingPrice[]>);

  const canUseCredits = (featureType: string) => {
    if (!credits || userType !== 'agent') return false;
    
    switch (featureType) {
      case 'basic':
        return credits.credits_balance > 0;
      case 'premium':
        return credits.premium_credits > 0;
      case 'platinum':
        return credits.platinum_credits > 0;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Featuring Status */}
      {featuringStatus && (
        <div className={`p-4 rounded-lg border-2 ${
          featuringStatus.type === 'platinum' ? 'border-yellow-300 bg-yellow-50' :
          featuringStatus.type === 'premium' ? 'border-purple-300 bg-purple-50' :
          'border-blue-300 bg-blue-50'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">
                {FEATURE_TYPE_INFO[featuringStatus.type as keyof typeof FEATURE_TYPE_INFO]?.icon}
              </span>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {FEATURE_TYPE_INFO[featuringStatus.type as keyof typeof FEATURE_TYPE_INFO]?.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {featuringStatus.daysLeft > 0 
                    ? `${featuringStatus.daysLeft} days remaining`
                    : 'Expires today'
                  }
                </p>
              </div>
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
              ACTIVE
            </span>
          </div>
        </div>
      )}

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-800 text-sm">{success}</div>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* Feature Property Button */}
      {!currentlyFeatured && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Boost Your Property's Visibility</h4>
              <p className="text-sm text-gray-600">
                Featured properties get more views and inquiries
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🚀 Feature This Property
            </button>
          </div>
        </div>
      )}

      {/* Credits Display for Agents */}
      {userType === 'agent' && credits && (
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <h4 className="font-semibold text-indigo-900 mb-2">Your Feature Credits</h4>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <div className="font-bold text-blue-600">{credits.credits_balance}</div>
              <div className="text-gray-600">Basic</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-purple-600">{credits.premium_credits}</div>
              <div className="text-gray-600">Premium</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-yellow-600">{credits.platinum_credits}</div>
              <div className="text-gray-600">Platinum</div>
            </div>
          </div>
        </div>
      )}

      {/* Featuring Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Feature Your Property</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-1">{propertyTitle}</h4>
                <p className="text-gray-600 text-sm">Choose a featuring option to boost visibility</p>
              </div>

              {/* Featuring Options */}
              <div className="grid gap-4 mb-6">
                {Object.entries(pricesByType).map(([featureType, typePrices]) => {
                  const featureInfo = FEATURE_TYPE_INFO[featureType as keyof typeof FEATURE_TYPE_INFO];
                  if (!featureInfo) return null;

                  return (
                    <div key={featureType} className={`border-2 rounded-lg p-4 ${
                      featureType === 'platinum' ? 'border-yellow-200 bg-yellow-50' :
                      featureType === 'premium' ? 'border-purple-200 bg-purple-50' :
                      'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{featureInfo.icon}</span>
                          <div>
                            <h4 className="font-bold text-lg text-gray-900">{featureInfo.name}</h4>
                            <p className="text-gray-600 text-sm">{featureInfo.description}</p>
                          </div>
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {featureInfo.benefits.map((benefit, index) => (
                            <span
                              key={index}
                              className="text-xs px-2 py-1 bg-white rounded-full border border-gray-200"
                            >
                              ✓ {benefit}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Duration Options */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {typePrices.map((price) => (
                          <button
                            key={price.id}
                            onClick={() => setSelectedFeature({
                              type: featureType,
                              duration: price.duration_days,
                              price
                            })}
                            className={`p-3 border-2 rounded-lg text-left transition-all ${
                              selectedFeature?.type === featureType && selectedFeature?.duration === price.duration_days
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-semibold text-gray-900">
                              {price.duration_days} Days
                            </div>
                            <div className="text-lg font-bold text-blue-600">
                              {formatPrice(price)}
                            </div>
                            {canUseCredits(featureType) && (
                              <div className="text-xs text-green-600 mt-1">
                                ✓ Can use credits
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Payment Method Selection */}
              {selectedFeature && (
                <div className="border-t pt-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Payment Method</h4>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="stripe"
                        checked={paymentMethod === 'stripe'}
                        onChange={(e) => setPaymentMethod('stripe')}
                        className="text-blue-600"
                      />
                      <div>
                        <div className="font-medium">💳 Credit/Debit Card</div>
                        <div className="text-sm text-gray-600">
                          Pay {formatPrice(selectedFeature.price)} securely with Stripe
                        </div>
                      </div>
                    </label>

                    {userType === 'agent' && canUseCredits(selectedFeature.type) && (
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="credits"
                          checked={paymentMethod === 'credits'}
                          onChange={(e) => setPaymentMethod('credits')}
                          className="text-blue-600"
                        />
                        <div>
                          <div className="font-medium">🎟️ Feature Credits</div>
                          <div className="text-sm text-gray-600">
                            Use 1 {selectedFeature.type} credit (
                            {selectedFeature.type === 'basic' ? credits?.credits_balance :
                             selectedFeature.type === 'premium' ? credits?.premium_credits :
                             credits?.platinum_credits} available)
                          </div>
                        </div>
                      </label>
                    )}
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedFeature(null);
                      }}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFeaturingPurchase}
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 
                       paymentMethod === 'credits' ? 'Use Credits' : 
                       `Pay ${formatPrice(selectedFeature.price)}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}