'use client';

import React from 'react';
import AITitleSuggester from '@/components/AITitleSuggester';

interface Step1BasicInfoProps {
  formData: any;
  setFormData: (data: any) => void;
}

// Property type options
const RESIDENTIAL_TYPES = [
  { value: 'Single Family Home', label: 'House', icon: '🏠' },
  { value: 'Duplex', label: 'Duplex', icon: '🏘️' },
  { value: 'Apartment', label: 'Apartment', icon: '🏢' },
  { value: 'Townhouse', label: 'Townhouse', icon: '🏠' },
  { value: 'Condo', label: 'Condo', icon: '🏠' },
  { value: 'Villa', label: 'Villa', icon: '🏡' },
  { value: 'Bungalow', label: 'Bungalow', icon: '🏡' },
  { value: 'Cottage', label: 'Cottage', icon: '🏡' },
  { value: 'Multi-family', label: 'Multi-family', icon: '🏘️' },
  { value: 'Residential Land', label: 'Land', icon: '🌿' },
  { value: 'Residential Farmland', label: 'Farmland', icon: '🌾' },
];

const COMMERCIAL_TYPES = [
  { value: 'Office', label: 'Office', icon: '🏢' },
  { value: 'Retail', label: 'Retail', icon: '🏪' },
  { value: 'Warehouse', label: 'Warehouse', icon: '📦' },
  { value: 'Industrial', label: 'Industrial', icon: '🏭' },
  { value: 'Mixed Use', label: 'Mixed Use', icon: '🔄' },
  { value: 'Restaurant', label: 'Restaurant', icon: '🍽️' },
  { value: 'Medical', label: 'Medical', icon: '🏥' },
  { value: 'Commercial Land', label: 'Land', icon: '🌿' },
  { value: 'Agricultural Land', label: 'Agricultural', icon: '🚜' },
];

export default function Step1BasicInfo({ formData, setFormData }: Step1BasicInfoProps) {
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Get currency information from formData (set in Step3)
  const getCurrencySymbol = (currency: string) => {
    const currencyMap: Record<string, string> = {
      'GYD': 'GY$',
      'TTD': 'TT$',
      'JMD': 'J$',
      'BBD': 'Bds$',
      'GHS': 'GH₵',
      'NGN': '₦',
      'KES': 'KSh'
    };
    return currencyMap[currency] || 'GY$';
  };

  const currencyCode = formData.currency || 'GYD';
  const currencySymbol = getCurrencySymbol(currencyCode);

  const isCommercial = formData.property_category === 'commercial';
  const propertyTypes = isCommercial ? COMMERCIAL_TYPES : RESIDENTIAL_TYPES;

  const handleCategoryChange = (category: 'residential' | 'commercial') => {
    setFormData((prev: any) => ({
      ...prev,
      property_category: category,
      property_type: '', // Reset type when category changes
      listing_type: 'sale', // Reset to sale
      // Reset commercial fields when switching to residential
      ...(category === 'residential' ? {
        commercial_type: '',
        floor_size_sqft: '',
        building_floor: '',
        number_of_floors: '',
        parking_spaces: '',
        loading_dock: false,
        elevator_access: false,
        climate_controlled: false,
        commercial_garage_entrance: false,
      } : {})
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">
        📋 Basic Information
      </h2>

      {/* Title */}
      <div>
        <label className="block text-base font-bold text-gray-900 mb-3">
          Property Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Beautiful 3-bedroom family home in Georgetown"
          className="w-full px-4 py-3 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 bg-white placeholder-gray-600 text-base"
          maxLength={100}
        />
        <p className="text-sm text-gray-500 mt-1">{formData.title?.length || 0}/100 characters</p>

        {/* AI Title Suggester */}
        <AITitleSuggester
          propertyData={{
            propertyType: formData.property_type || '',
            propertyCategory: formData.property_category || 'residential',
            listingType: formData.listing_type || 'sale',
            bedrooms: formData.bedrooms || '',
            bathrooms: formData.bathrooms || '',
            commercialType: formData.commercial_type || '',
            floorSize: formData.floor_size_sqft || '',
            price: formData.price || '',
            location: formData.city || formData.region || '',
            neighborhood: formData.neighborhood || '',
            features: formData.amenities || [],
          }}
          onTitleSelected={(title) => handleChange('title', title)}
          currentTitle={formData.title || ''}
        />
      </div>

      {/* Property Category - Large touch-friendly buttons */}
      <div>
        <label className="block text-base font-bold text-gray-900 mb-3">
          Property Category *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* Residential Button */}
          <button
            type="button"
            onClick={() => handleCategoryChange('residential')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              !isCommercial
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏠</span>
              <div>
                <div className="font-semibold text-gray-900">Residential</div>
                <div className="text-xs text-gray-500">Homes, Apartments, Land</div>
              </div>
            </div>
          </button>

          {/* Commercial Button */}
          <button
            type="button"
            onClick={() => handleCategoryChange('commercial')}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              isCommercial
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏢</span>
              <div>
                <div className="font-semibold text-gray-900">Commercial</div>
                <div className="text-xs text-gray-500">Office, Retail, Industrial</div>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Property Type - Mobile-optimized grid */}
      <div>
        <label className="block text-base font-bold text-gray-900 mb-3">
          Property Type *
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {propertyTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => {
                handleChange('property_type', type.value);
                // Auto-sync commercial_type for commercial properties
                if (isCommercial) {
                  handleChange('commercial_type', type.value);
                }
              }}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                formData.property_type === type.value
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className="text-xs font-medium text-gray-700 truncate">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Listing Type */}
      <div>
        <label className="block text-base font-bold text-gray-900 mb-3">
          Listing Type *
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {/* For Sale - Always available */}
          <button
            type="button"
            onClick={() => handleChange('listing_type', 'sale')}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              formData.listing_type === 'sale'
                ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-xl mb-1">🏷️</div>
            <div className="text-sm font-medium">For Sale</div>
          </button>

          {/* For Rent - Only for Residential */}
          {!isCommercial && (
            <button
              type="button"
              onClick={() => handleChange('listing_type', 'rent')}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                formData.listing_type === 'rent'
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xl mb-1">🔑</div>
              <div className="text-sm font-medium">For Rent</div>
            </button>
          )}

          {/* For Lease - Only for Commercial */}
          {isCommercial && (
            <button
              type="button"
              onClick={() => handleChange('listing_type', 'lease')}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                formData.listing_type === 'lease'
                  ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xl mb-1">📋</div>
              <div className="text-sm font-medium">For Lease</div>
            </button>
          )}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="block text-base font-bold text-gray-900 mb-3">
          💰 {formData.listing_type === 'rent' ? 'Monthly Rent' :
               formData.listing_type === 'lease' ? 'Monthly Lease Rate' :
               'Asking Price'} ({currencySymbol}) *
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={formData.price}
          onChange={(e) => {
            // Only allow numbers and remove any non-digit characters
            const value = e.target.value.replace(/[^0-9]/g, '');
            handleChange('price', value);
          }}
          placeholder="e.g., 25000000"
          className="w-full px-4 py-3 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 bg-white placeholder-gray-600 text-base"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.price && !isNaN(Number(formData.price)) && Number(formData.price) > 0
            ? `${Number(formData.price).toLocaleString()} ${currencyCode}`
            : `Enter the ${formData.listing_type === 'rent' || formData.listing_type === 'lease' ? 'monthly rate' : 'asking price'} for your property${formData.currency ? ` in ${currencyCode}` : ''}`
          }
        </p>
        {!formData.currency && (
          <p className="text-sm text-blue-600 mt-1">
            Select your country in Step 3 to see the appropriate currency
          </p>
        )}
      </div>

      {/* Info box */}
      <div className={`p-4 rounded-lg border ${isCommercial ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
        <div className="flex items-start gap-3">
          <div className={`text-lg ${isCommercial ? 'text-blue-500' : 'text-green-500'}`}>
            {isCommercial ? '🏢' : '📋'}
          </div>
          <div>
            <h4 className={`font-medium mb-1 ${isCommercial ? 'text-blue-900' : 'text-green-900'}`}>
              {isCommercial ? 'Commercial Property' : "What's Next?"}
            </h4>
            <p className={`text-sm ${isCommercial ? 'text-blue-800' : 'text-green-800'}`}>
              {isCommercial
                ? "In the next step, you'll add commercial-specific details like floor size, parking spaces, and building features."
                : "After you provide the basic info above, you'll add property details and select amenities. Then our AI can help create an amazing description!"
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
