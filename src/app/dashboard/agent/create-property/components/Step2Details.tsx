'use client';

import React from 'react';
import LotDimensions from '@/components/LotDimensions';
import { DimensionUnit } from '@/lib/lotCalculations';
import AIDescriptionAssistant from '@/components/AIDescriptionAssistant';

interface Step2DetailsProps {
  formData: any;
  setFormData: (data: any) => void;
}

// Value/label pairs for consistent data storage and display
const RESIDENTIAL_AMENITIES = [
  { value: 'AC', label: 'Air Conditioning' },
  { value: 'Pool', label: 'Swimming Pool' },
  { value: 'Garden', label: 'Garden/Yard' },
  { value: 'Garage', label: 'Garage' },
  { value: 'Security', label: 'Security System' },
  { value: 'Balcony', label: 'Balcony/Patio' },
  { value: 'Laundry', label: 'Laundry Room' },
  { value: 'Generator', label: 'Backup Generator' },
  { value: 'Water Tank', label: 'Water Tank' },
  { value: 'Gated', label: 'Gated/Fenced' },
  { value: 'Furnished', label: 'Fully Furnished' },
  { value: 'Internet', label: 'Internet Ready' },
  { value: 'Parking', label: 'Parking' },
  { value: 'Solar', label: 'Solar Panels' },
];

const COMMERCIAL_AMENITIES = [
  { value: 'AC', label: 'Air Conditioning' },
  { value: 'Security', label: 'Security System' },
  { value: 'Generator', label: 'Backup Generator' },
  { value: 'Water Tank', label: 'Water Tank' },
  { value: 'Conference', label: 'Conference Room' },
  { value: 'Kitchen', label: 'Kitchen/Break Room' },
  { value: 'Reception', label: 'Reception Area' },
  { value: 'Storage', label: 'Storage' },
  { value: 'Fiber Internet', label: 'Fiber Internet' },
  { value: 'CCTV', label: 'CCTV' },
  { value: 'Handicap', label: 'Handicap Accessible' },
  { value: 'Elevator', label: 'Elevator Access' },
];

export default function Step2Details({ formData, setFormData }: Step2DetailsProps) {
  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityChange = (value: string) => {
    const currentAmenities = formData.amenities || [];
    if (currentAmenities.includes(value)) {
      handleChange('amenities', currentAmenities.filter((a: string) => a !== value));
    } else {
      handleChange('amenities', [...currentAmenities, value]);
    }
  };

  const isLandProperty = ['land', 'residential land', 'commercial land'].includes(formData.property_type?.toLowerCase());
  const isCommercial = formData.property_category === 'commercial';

  const amenitiesList = isCommercial ? COMMERCIAL_AMENITIES : RESIDENTIAL_AMENITIES;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">
        🏠 Property Details
      </h2>

      {/* Beds & Baths - Only for residential non-land */}
      {!isLandProperty && !isCommercial && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">
              Bedrooms *
            </label>
            <input
              type="number"
              min="0"
              max="20"
              value={formData.bedrooms}
              onChange={(e) => handleChange('bedrooms', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 text-lg"
              placeholder="3"
              required
            />
          </div>
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">
              Bathrooms *
            </label>
            <input
              type="number"
              min="0"
              max="20"
              step="0.5"
              value={formData.bathrooms}
              onChange={(e) => handleChange('bathrooms', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 text-lg"
              placeholder="2"
              required
            />
          </div>
        </div>
      )}

      {/* Commercial-specific fields */}
      {isCommercial && (
        <div className="space-y-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h3 className="font-semibold text-blue-800 flex items-center gap-2">
            🏢 Commercial Details
          </h3>

          {/* Commercial Type */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">
              Commercial Type *
            </label>
            <select
              value={formData.commercial_type || ''}
              onChange={(e) => handleChange('commercial_type', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 text-base"
              required
            >
              <option value="">Select type</option>
              <option value="Office">Office</option>
              <option value="Retail">Retail</option>
              <option value="Industrial">Industrial</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Mixed Use">Mixed Use</option>
              <option value="Restaurant">Restaurant</option>
              <option value="Medical">Medical</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Floor Size & Parking */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor Size (sq ft)
              </label>
              <input
                type="number"
                value={formData.floor_size_sqft || ''}
                onChange={(e) => handleChange('floor_size_sqft', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                placeholder="2500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parking Spaces
              </label>
              <input
                type="number"
                value={formData.parking_spaces || ''}
                onChange={(e) => handleChange('parking_spaces', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                placeholder="10"
              />
            </div>
          </div>

          {/* Building Floor & Total Floors */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor/Level
              </label>
              <input
                type="text"
                value={formData.building_floor || ''}
                onChange={(e) => handleChange('building_floor', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                placeholder="Ground, 2nd, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Floors
              </label>
              <input
                type="number"
                value={formData.number_of_floors || ''}
                onChange={(e) => handleChange('number_of_floors', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                placeholder="3"
              />
            </div>
          </div>

          {/* Commercial Features - Large touch targets */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Commercial Features
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'loading_dock', label: 'Loading Dock', icon: '🚛' },
                { key: 'elevator_access', label: 'Elevator', icon: '🛗' },
                { key: 'climate_controlled', label: 'Climate Control', icon: '❄️' },
                { key: 'commercial_garage_entrance', label: 'Garage Entry', icon: '🚗' },
              ].map((feature) => (
                <label
                  key={feature.key}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData[feature.key]
                      ? 'border-blue-500 bg-blue-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!formData[feature.key]}
                    onChange={(e) => handleChange(feature.key, e.target.checked)}
                    className="sr-only"
                  />
                  <span className="text-lg">{feature.icon}</span>
                  <span className="text-sm font-medium">{feature.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Availability - All listing types */}
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
            <h4 className="font-medium text-emerald-800 mb-3">
              {formData.listing_type === 'sale' ? 'When is this property available?' : 'Availability'}
            </h4>
            <div className="space-y-3">
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability_type"
                    checked={!formData.available_from}
                    onChange={() => handleChange('available_from', '')}
                    className="text-emerald-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {formData.listing_type === 'sale' ? 'On the market now' : 'Available Now'}
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="availability_type"
                    checked={!!formData.available_from}
                    onChange={() => handleChange('available_from', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])}
                    className="text-emerald-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {formData.listing_type === 'sale' ? 'Coming soon — set a date' : 'Available from a date'}
                  </span>
                </label>
              </div>
              {!!formData.available_from && (
                <div>
                  <input
                    type="date"
                    value={formData.available_from || ''}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleChange('available_from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.listing_type === 'sale'
                      ? 'Your listing will show as "Coming Soon" until this date'
                      : 'Your listing stays active — clients see when it becomes available'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lease Terms - Only for lease listings */}
          {formData.listing_type === 'lease' && (
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-3">Lease Terms</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lease Term (Years)
                  </label>
                  <select
                    value={formData.lease_term_years || ''}
                    onChange={(e) => handleChange('lease_term_years', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select term</option>
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="5">5 Years</option>
                    <option value="10">10 Years</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lease Type
                  </label>
                  <select
                    value={formData.lease_type || ''}
                    onChange={(e) => handleChange('lease_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select type</option>
                    <option value="Triple Net (NNN)">Triple Net (NNN)</option>
                    <option value="Gross Lease">Gross Lease</option>
                    <option value="Modified Gross">Modified Gross</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Land-specific fields */}
      {isLandProperty && (
        <div className="space-y-4 p-4 bg-green-50 rounded-xl border border-green-200">
          <h3 className="font-semibold text-green-800 flex items-center gap-2">
            🌿 Land Details
          </h3>

          {/* Lot Dimensions */}
          <LotDimensions
            length={formData.lot_length || ''}
            width={formData.lot_width || ''}
            unit={(formData.lot_dimension_unit as DimensionUnit) || 'ft'}
            onLengthChange={(length) => handleChange('lot_length', length)}
            onWidthChange={(width) => handleChange('lot_width', width)}
            onUnitChange={(unit) => handleChange('lot_dimension_unit', unit)}
            onAreaCalculated={(areaSqFt) => {
              const newValue = areaSqFt.toString();
              if (formData.land_size_value !== newValue) {
                handleChange('land_size_value', newValue);
                handleChange('land_size_unit', 'sq ft');
              }
            }}
          />

          {/* Zoning */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zoning Type
            </label>
            <select
              value={formData.zoning_type || ''}
              onChange={(e) => handleChange('zoning_type', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-300 focus:border-green-500 rounded-lg text-gray-900"
            >
              <option value="">Select zoning</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Agricultural">Agricultural</option>
              <option value="Mixed Use">Mixed Use</option>
              <option value="Industrial">Industrial</option>
              <option value="Unzoned">Unzoned</option>
            </select>
          </div>
        </div>
      )}

      {/* House/Building Size - For non-land properties */}
      {!isLandProperty && (
        <div>
          <label className="block text-base font-bold text-gray-900 mb-2">
            {isCommercial ? 'Building Size' : 'Home Size'}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.house_size_value}
              onChange={(e) => handleChange('house_size_value', e.target.value)}
              placeholder="2000"
              className="flex-1 px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
            />
            <select
              value={formData.house_size_unit}
              onChange={(e) => handleChange('house_size_unit', e.target.value)}
              className="px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
            >
              <option value="sq ft">sq ft</option>
              <option value="sq m">sq m</option>
            </select>
          </div>
        </div>
      )}

      {/* Lot Dimensions - For non-land residential (BEFORE Lot Size for better UX) */}
      {!isLandProperty && !isCommercial && (
        <LotDimensions
          length={formData.lot_length || ''}
          width={formData.lot_width || ''}
          unit={(formData.lot_dimension_unit as DimensionUnit) || 'ft'}
          onLengthChange={(length) => handleChange('lot_length', length)}
          onWidthChange={(width) => handleChange('lot_width', width)}
          onUnitChange={(unit) => handleChange('lot_dimension_unit', unit)}
          onAreaCalculated={(areaSqFt) => {
            const newValue = areaSqFt.toString();
            if (formData.land_size_value !== newValue) {
              handleChange('land_size_value', newValue);
              handleChange('land_size_unit', 'sq ft');
            }
          }}
        />
      )}

      {/* Land/Lot Size - Show for all properties (auto-calculated from dimensions above) */}
      <div>
        <label className="block text-base font-bold text-gray-900 mb-2">
          {isLandProperty ? 'Total Land Area' : 'Lot Size'}
          {!isLandProperty && !isCommercial && formData.lot_length && formData.lot_width && !formData.land_size_na && (
            <span className="text-green-600 text-sm font-normal ml-2">Auto-calculated from dimensions above</span>
          )}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={formData.land_size_na ? '' : formData.land_size_value}
            onChange={(e) => handleChange('land_size_value', e.target.value)}
            placeholder={formData.land_size_na ? 'N/A' : '8000'}
            disabled={formData.land_size_na}
            className={`flex-1 px-4 py-3 border-2 rounded-lg text-gray-900 ${
              formData.land_size_na
                ? 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-400'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          />
          <select
            value={formData.land_size_unit}
            onChange={(e) => handleChange('land_size_unit', e.target.value)}
            disabled={formData.land_size_na}
            className={`px-4 py-3 border-2 rounded-lg text-gray-900 ${
              formData.land_size_na
                ? 'border-gray-200 bg-gray-100 cursor-not-allowed text-gray-400'
                : 'border-gray-300 focus:border-blue-500'
            }`}
          >
            <option value="sq ft">sq ft</option>
            <option value="sq m">sq m</option>
            <option value="acres">acres</option>
            <option value="hectares">hectares</option>
          </select>
        </div>
        {/* N/A Checkbox - for apartment/unit rentals where land size doesn't apply */}
        {!isLandProperty && (
          <label className="flex items-center gap-2 mt-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.land_size_na || false}
              onChange={(e) => {
                handleChange('land_size_na', e.target.checked);
                if (e.target.checked) {
                  // Clear the values when N/A is checked
                  handleChange('land_size_value', '');
                  handleChange('lot_length', '');
                  handleChange('lot_width', '');
                }
              }}
              className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600 group-hover:text-gray-800">
              Not applicable (e.g., apartment/unit rentals)
            </span>
          </label>
        )}
      </div>

      {/* Year Built - Only for buildings, not land */}
      {!isLandProperty && (
        <div>
          <label className="block text-base font-bold text-gray-900 mb-2">
            Year Built
          </label>
          <input
            type="number"
            value={formData.year_built}
            onChange={(e) => handleChange('year_built', e.target.value)}
            placeholder="2020"
            min="1800"
            max={new Date().getFullYear()}
            className="w-full md:w-1/2 px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
          />
        </div>
      )}

      {/* Helpful hint about amenities and AI */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-lg">💡</div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Pro Tip: Select amenities first!</h4>
            <p className="text-sm text-blue-800">
              The more amenities you select, the better our AI will generate your property description.
              Each amenity gives the AI more context to create compelling, detailed descriptions.
            </p>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-base font-bold text-gray-900 mb-3">
          {isCommercial ? 'Building Amenities' : 'Property Amenities'}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {amenitiesList.map(({ value, label }) => (
            <label
              key={value}
              className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                formData.amenities?.includes(value)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.amenities?.includes(value) || false}
                onChange={() => handleAmenityChange(value)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{label}</span>
            </label>
          ))}
        </div>
        {formData.amenities?.length > 0 && (
          <p className="text-sm text-green-600 mt-2">
            {formData.amenities.length} amenities selected
          </p>
        )}
      </div>

      {/* Property Description */}
      <div className="border-t pt-6 mt-6">
        <label className="block text-base font-bold text-gray-900 mb-3">
          📝 Property Description *
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder={isCommercial
            ? "Describe the commercial space, its features, location advantages, and ideal business uses..."
            : "Write at least 30-50 words about your property... OR use the AI assistant below for professional descriptions!"
          }
          rows={6}
          maxLength={2000}
          className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 placeholder-gray-400"
          required
        />
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>
            {(formData.description || '').trim().split(/\s+/).filter((word: string) => word.length > 0).length < 30
              ? `Add ${30 - (formData.description || '').trim().split(/\s+/).filter((word: string) => word.length > 0).length} more words for better AI results`
              : 'Great! You can edit the AI description above to make corrections'}
          </span>
          <span className={(formData.description || '').trim().split(/\s+/).filter((word: string) => word.length > 0).length >= 30 ? 'text-green-600' : 'text-amber-600'}>
            {(formData.description || '').trim().split(/\s+/).filter((word: string) => word.length > 0).length} words • {(formData.description || '').length}/2000 characters
          </span>
        </div>
      </div>

      {/* AI Description Assistant */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <div className="mb-3 text-sm text-blue-800">
          <span className="font-medium">🤖 AI Power Boost:</span> You've selected {(formData.amenities || []).length} amenities above - this gives the AI more context to create amazing descriptions!
        </div>
        <AIDescriptionAssistant
          propertyData={{
            title: formData.title || '',
            propertyType: formData.property_type || 'Property',
            bedrooms: formData.bedrooms?.toString() || '',
            bathrooms: formData.bathrooms?.toString() || '',
            price: formData.price?.toString() || '',
            location: formData.city || formData.region || '',
            squareFootage: formData.house_size_value ? `${formData.house_size_value} ${formData.house_size_unit || 'sq ft'}` : '',
            features: formData.amenities || [],
            rentalType: formData.listing_type === 'rent' ? 'rent' : formData.listing_type === 'lease' ? 'lease' : 'sale'
          }}
          currentDescription={formData.description || ''}
          onDescriptionGenerated={(description) => handleChange('description', description)}
        />
      </div>
    </div>
  );
}
