'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';

interface LocationSelectorProps {
  selectedCountry: string;
  selectedRegion: string;
  selectedCity: string;
  onLocationChange: (field: 'region' | 'city', value: string) => void;
  className?: string;
}

interface Region {
  id: string;
  name: string;
  type: string;
}

export default function LocationSelector({
  selectedCountry,
  selectedRegion,
  selectedCity,
  onLocationChange,
  className = ''
}: LocationSelectorProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch regions when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setRegions([]);
      setCities([]);
      return;
    }

    async function fetchRegions() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('regions')
          .select('id, name, type')
          .eq('country_code', selectedCountry)
          .is('parent_id', null) // Only top-level regions
          .eq('status', 'active')
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error fetching regions:', error);
          // Fallback for Guyana if database fails
          if (selectedCountry === 'GY') {
            setRegions([
              { id: 'GY-R4', name: 'Region 4 - Demerara-Mahaica', type: 'region' },
              { id: 'GY-R6', name: 'Region 6 - East Berbice-Corentyne', type: 'region' },
              { id: 'GY-R10', name: 'Region 10 - Upper Demerara-Berbice', type: 'region' }
            ]);
          }
        } else {
          setRegions(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch regions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRegions();
  }, [selectedCountry]);

  // Fetch cities when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setCities([]);
      return;
    }

    async function fetchCities() {
      try {
        const { data, error } = await supabase
          .from('regions')
          .select('id, name, type')
          .eq('parent_id', selectedRegion)
          .eq('status', 'active')
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching cities:', error);
          // Fallback cities for Georgetown region
          if (selectedRegion === 'GY-R4') {
            setCities([
              { id: 'GY-R4-C1', name: 'Georgetown', type: 'city' },
              { id: 'GY-R4-C8', name: 'Campbellville', type: 'city' },
              { id: 'GY-R4-C9', name: 'Kitty', type: 'city' }
            ]);
          }
        } else {
          setCities(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch cities:', error);
      }
    }

    fetchCities();
  }, [selectedRegion]);

  // Clear city when region changes
  useEffect(() => {
    if (selectedCity && !cities.find(c => c.id === selectedCity)) {
      onLocationChange('city', '');
    }
  }, [cities, selectedCity, onLocationChange]);

  // Get display labels based on country
  const getRegionLabel = () => {
    switch (selectedCountry) {
      case 'US': return 'State';
      case 'CA': return 'Province';
      case 'GY': return 'Administrative Region';
      case 'TT':
      case 'JM':
      case 'BB': return 'Parish/Region';
      default: return 'Region';
    }
  };

  const getCityLabel = () => {
    switch (selectedCountry) {
      case 'GY': return 'City/Town/Area';
      default: return 'City/Town';
    }
  };

  if (!selectedCountry) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-gray-100 p-4 rounded-lg text-center">
          <p className="text-gray-600">Please select a country first to choose location</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Region/State Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getRegionLabel()} *
        </label>
        <select
          value={selectedRegion}
          onChange={(e) => {
            onLocationChange('region', e.target.value);
            // Clear city when region changes
            onLocationChange('city', '');
          }}
          disabled={loading || regions.length === 0}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">
            {loading ? 'Loading...' : `Select ${getRegionLabel().toLowerCase()}`}
          </option>
          {regions.map((region) => (
            <option key={region.id} value={region.id}>
              {region.name}
            </option>
          ))}
        </select>
        {regions.length === 0 && !loading && (
          <p className="text-sm text-amber-600 mt-1">
            🚧 Regions for this country are being added. You can still manually enter location below.
          </p>
        )}
      </div>

      {/* City/Town Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getCityLabel()} *
        </label>
        {selectedRegion && cities.length > 0 ? (
          <select
            value={selectedCity}
            onChange={(e) => onLocationChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select {getCityLabel().toLowerCase()}</option>
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={selectedCity}
            onChange={(e) => onLocationChange('city', e.target.value)}
            placeholder={
              selectedRegion
                ? `Enter ${getCityLabel().toLowerCase()}`
                : `Please select ${getRegionLabel().toLowerCase()} first`
            }
            disabled={!selectedRegion && regions.length > 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
          />
        )}
        <p className="text-sm text-gray-500 mt-1">
          {selectedRegion 
            ? (cities.length > 0 
                ? `Choose from ${cities.length} areas in this ${getRegionLabel().toLowerCase()}`
                : 'Enter the city or town name manually'
              )
            : `Select ${getRegionLabel().toLowerCase()} to see available areas`
          }
        </p>
      </div>

      {/* Regional Information */}
      {selectedRegion && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="text-2xl mr-3">📍</div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">
                {regions.find(r => r.id === selectedRegion)?.name}
              </h3>
              <p className="text-sm text-blue-800">
                {cities.length > 0 
                  ? `${cities.length} cities/areas available in this ${getRegionLabel().toLowerCase()}`
                  : 'Enter your specific city or area manually'
                }
              </p>
              {selectedCountry === 'GY' && (
                <p className="text-xs text-blue-700 mt-1">
                  🇬🇾 Covers all administrative regions of Guyana with major cities and towns
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <h4 className="font-medium text-gray-900 text-sm mb-1">🔒 Location Privacy</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Your exact address remains private</li>
          <li>• Only general area shown in public listings</li>
          <li>• Specific details shared only with qualified buyers</li>
        </ul>
      </div>
    </div>
  );
}