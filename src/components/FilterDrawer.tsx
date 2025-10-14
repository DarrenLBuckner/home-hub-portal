'use client';

import { useState } from 'react';

interface FilterDrawerProps {
  onClose: () => void;
  filterType?: 'rent' | 'buy' | 'developments';
  onApplyFilters?: (filters: any) => void;
}

export function FilterDrawer({ onClose, filterType = 'rent', onApplyFilters }: FilterDrawerProps) {
  const [filters, setFilters] = useState({
    location: '',
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    bedrooms: '',
    bathrooms: '',
    petFriendly: false,
    furnished: false,
    pool: false,
    garage: false,
    security: false
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters(filters);
    }
    onClose();
  };

  const handleReset = () => {
    setFilters({
      location: '',
      minPrice: '',
      maxPrice: '',
      propertyType: '',
      bedrooms: '',
      bathrooms: '',
      petFriendly: false,
      furnished: false,
      pool: false,
      garage: false,
      security: false
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 bg-white rounded-t-2xl z-50 max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Filters</h2>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>
          
          {/* Filter Fields */}
          <div className="space-y-4">
            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <select 
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Regions</option>
                <option value="georgetown">Georgetown</option>
                <option value="new-amsterdam">New Amsterdam</option>
                <option value="linden">Linden</option>
                <option value="anna-regina">Anna Regina</option>
                <option value="region-1">Region 1 - Barima-Waini</option>
                <option value="region-2">Region 2 - Pomeroon-Supenaam</option>
                <option value="region-3">Region 3 - Essequibo Islands-West Demerara</option>
                <option value="region-4">Region 4 - Demerara-Mahaica</option>
                <option value="region-5">Region 5 - Mahaica-Berbice</option>
                <option value="region-6">Region 6 - East Berbice-Corentyne</option>
                <option value="region-7">Region 7 - Cuyuni-Mazaruni</option>
                <option value="region-8">Region 8 - Potaro-Siparuni</option>
                <option value="region-9">Region 9 - Upper Takutu-Upper Essequibo</option>
                <option value="region-10">Region 10 - Upper Demerara-Berbice</option>
              </select>
            </div>
            
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {filterType === 'rent' ? 'Monthly Rent (GYD)' : 'Price (GYD)'}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <input 
                  type="number" 
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            
            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <select 
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="studio">Studio</option>
                <option value="room">Room</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            
            {/* Beds/Baths */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <select 
                  value={filters.bedrooms}
                  onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <select 
                  value={filters.bathrooms}
                  onChange={(e) => handleFilterChange('bathrooms', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </div>
            </div>
            
            {/* Advanced Filters - Collapsible */}
            <details className="border-t pt-4">
              <summary className="font-medium cursor-pointer text-green-600 hover:text-green-700">
                + More Filters
              </summary>
              <div className="mt-4 space-y-3">
                {filterType === 'rent' && (
                  <>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={filters.petFriendly}
                        onChange={(e) => handleFilterChange('petFriendly', e.target.checked)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Pet Friendly</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={filters.furnished}
                        onChange={(e) => handleFilterChange('furnished', e.target.checked)}
                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-700">Furnished</span>
                    </label>
                  </>
                )}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filters.pool}
                    onChange={(e) => handleFilterChange('pool', e.target.checked)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-700">Pool</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filters.garage}
                    onChange={(e) => handleFilterChange('garage', e.target.checked)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-700">Garage</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={filters.security}
                    onChange={(e) => handleFilterChange('security', e.target.checked)}
                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-gray-700">Security</span>
                </label>
              </div>
            </details>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-8 flex gap-3">
            <button 
              onClick={handleReset}
              className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
            <button 
              onClick={onClose}
              className="flex-1 border-2 border-gray-300 py-3 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleApply}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 focus:ring-2 focus:ring-green-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}