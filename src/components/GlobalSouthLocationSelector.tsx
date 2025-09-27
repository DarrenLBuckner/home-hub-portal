'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/supabase';
import { getCurrencySymbol, getCurrencyCode } from '@/lib/currency';

interface Country {
  id: string;
  name: string;
  code: string;
  currency_code: string;
  currency_symbol: string;
  region: string;
  flag_emoji: string;
}

interface Region {
  id: string;
  name: string;
  type: string;
  is_capital: boolean;
  is_major_city: boolean;
  population?: number;
}

interface GlobalSouthLocationSelectorProps {
  selectedCountry: string;
  selectedRegion: string;
  onLocationChange: (field: 'country' | 'region', value: string) => void;
  onCurrencyChange?: (currencyCode: string, currencySymbol: string) => void;
  required?: boolean;
  className?: string;
  showCurrencyInfo?: boolean;
}

export default function GlobalSouthLocationSelector({
  selectedCountry,
  selectedRegion,
  onLocationChange,
  onCurrencyChange,
  className = '',
  showCurrencyInfo = true
}: GlobalSouthLocationSelectorProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionsLoading, setRegionsLoading] = useState(false);

  // Fetch Global South countries
  useEffect(() => {
    async function fetchCountries() {
      try {
        const { data, error } = await supabase
          .from('countries')
          .select('*')
          .eq('status', 'active')
          .order('display_order', { ascending: true });

        if (error) {
          console.error('Error fetching countries:', error);
          // Fallback Global South countries
          setCountries([
            { id: 'GY', name: 'Guyana', code: 'GY', currency_code: 'GYD', currency_symbol: 'GY$', region: 'Caribbean', flag_emoji: '🇬🇾' },
            { id: 'TT', name: 'Trinidad and Tobago', code: 'TT', currency_code: 'TTD', currency_symbol: 'TT$', region: 'Caribbean', flag_emoji: '🇹🇹' },
            { id: 'JM', name: 'Jamaica', code: 'JM', currency_code: 'JMD', currency_symbol: 'J$', region: 'Caribbean', flag_emoji: '🇯🇲' },
            { id: 'BB', name: 'Barbados', code: 'BB', currency_code: 'BBD', currency_symbol: 'Bds$', region: 'Caribbean', flag_emoji: '🇧🇧' },
            { id: 'GH', name: 'Ghana', code: 'GH', currency_code: 'GHS', currency_symbol: 'GH₵', region: 'Africa', flag_emoji: '🇬🇭' },
            { id: 'NG', name: 'Nigeria', code: 'NG', currency_code: 'NGN', currency_symbol: '₦', region: 'Africa', flag_emoji: '🇳🇬' },
            { id: 'KE', name: 'Kenya', code: 'KE', currency_code: 'KES', currency_symbol: 'KSh', region: 'Africa', flag_emoji: '🇰🇪' }
          ]);
        } else {
          setCountries(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch countries:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCountries();
  }, []);

  // Fetch regions when country changes
  useEffect(() => {
    if (!selectedCountry) {
      setRegions([]);
      return;
    }

    async function fetchRegions() {
      setRegionsLoading(true);
      try {
        const { data, error } = await supabase
          .from('regions')
          .select('id, name, type, is_capital, is_major_city, population')
          .eq('country_code', selectedCountry)
          .eq('status', 'active')
          .order('is_capital', { ascending: false }) // Show capitals first
          .order('is_major_city', { ascending: false }) // Then major cities
          .order('population', { ascending: false }); // Then by population

        if (error) {
          console.error('Error fetching regions:', error);
          // Fallback regions for Guyana
          if (selectedCountry === 'GY') {
            setRegions([
              { id: 'GY-R4-Georgetown', name: 'Georgetown', type: 'city', is_capital: true, is_major_city: true, population: 118363 },
              { id: 'GY-R10-Linden', name: 'Linden', type: 'city', is_capital: false, is_major_city: true, population: 27277 },
              { id: 'GY-R6-NewAmsterdam', name: 'New Amsterdam', type: 'city', is_capital: false, is_major_city: true, population: 17329 }
            ]);
          }
        } else {
          setRegions(data || []);
        }
      } catch (error) {
        console.error('Failed to fetch regions:', error);
      } finally {
        setRegionsLoading(false);
      }
    }

    fetchRegions();
  }, [selectedCountry]);

  // Handle country change and currency update
  const handleCountryChange = (countryCode: string) => {
    onLocationChange('country', countryCode);
    onLocationChange('region', ''); // Clear region
    
    // Update currency if callback provided
    if (onCurrencyChange && countryCode) {
      const currencyCode = getCurrencyCode(countryCode);
      const currencySymbol = getCurrencySymbol(countryCode);
      onCurrencyChange(currencyCode, currencySymbol);
    }
  };

  const selectedCountryData = countries.find(c => c.code === selectedCountry);
  const selectedRegionData = regions.find(r => r.id === selectedRegion);

  // Group countries by region
  const caribbeanCountries = countries.filter(c => c.region === 'Caribbean');
  const africanCountries = countries.filter(c => c.region === 'Africa');

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Country Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country *
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        >
          <option value="">Select a country</option>
          
          {/* Caribbean Section */}
          {caribbeanCountries.length > 0 && (
            <optgroup label="🏝️ Caribbean">
              {caribbeanCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag_emoji} {country.name}
                </option>
              ))}
            </optgroup>
          )}
          
          {/* Africa Section */}
          {africanCountries.length > 0 && (
            <optgroup label="🌍 Africa">
              {africanCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag_emoji} {country.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        
        {/* Country Info */}
        {selectedCountryData && (
          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
            <span className="flex items-center">
              <span className="mr-1">🌍</span>
              {selectedCountryData.region}
            </span>
            {showCurrencyInfo && (
              <span className="flex items-center">
                <span className="mr-1">💰</span>
                {selectedCountryData.currency_symbol} {selectedCountryData.currency_code}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Region/City Selection */}
      {selectedCountry && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City/Region *
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => onLocationChange('region', e.target.value)}
            disabled={regionsLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            <option value="">
              {regionsLoading ? 'Loading cities...' : 'Select city or region'}
            </option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.is_capital && '👑 '}
                {region.is_major_city && !region.is_capital && '🏙️ '}
                {region.name}
                {region.population && ` (${region.population.toLocaleString()})`}
              </option>
            ))}
          </select>
          
          {/* Region Info */}
          {selectedRegionData && (
            <div className="mt-2 text-sm text-gray-600">
              {selectedRegionData.is_capital && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mr-2">
                  👑 Capital City
                </span>
              )}
              {selectedRegionData.is_major_city && !selectedRegionData.is_capital && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                  🏙️ Major City
                </span>
              )}
              {selectedRegionData.population && (
                <span className="text-gray-500">
                  Population: {selectedRegionData.population.toLocaleString()}
                </span>
              )}
            </div>
          )}
          
          {regions.length === 0 && !regionsLoading && selectedCountry && (
            <p className="text-sm text-amber-600 mt-1">
              🚧 Cities for this country are being added. Please enter manually in the address field.
            </p>
          )}
        </div>
      )}

      {/* Global South Focus Info */}
      {selectedCountryData && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-start">
            <div className="text-2xl mr-3">
              {selectedCountryData.region === 'Caribbean' ? '🏝️' : '🌍'}
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-1">
                {selectedCountryData.region} Market Focus
              </h3>
              <p className="text-sm text-gray-700">
                {selectedCountryData.region === 'Caribbean' 
                  ? 'Part of our Caribbean expansion serving the diaspora and local markets with culturally relevant real estate solutions.'
                  : 'Expanding to African markets with mobile-first, locally adapted property listing and discovery tools.'
                }
              </p>
              {regions.length > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  📍 {regions.length} cities and regions available
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
          <li>• Exact addresses remain private until contact</li>
          <li>• Only general area shown in public listings</li>
          <li>• Optimized for Global South mobile users</li>
        </ul>
      </div>
    </div>
  );
}