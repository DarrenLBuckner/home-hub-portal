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
  onLocationChange: (field: 'country' | 'region', value: string, displayName?: string) => void;
  onCurrencyChange?: (currencyCode: string, currencySymbol: string) => void;
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
    <div className={`space-y-4 ${className}`}>
      {/* Country Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Country *
        </label>
        <select
          value={selectedCountry}
          onChange={(e) => handleCountryChange(e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 bg-white"
        >
          <option value="">Select country</option>
          {caribbeanCountries.length > 0 && (
            <optgroup label="Caribbean">
              {caribbeanCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag_emoji} {country.name}
                </option>
              ))}
            </optgroup>
          )}
          {africanCountries.length > 0 && (
            <optgroup label="Africa">
              {africanCountries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag_emoji} {country.name}
                </option>
              ))}
            </optgroup>
          )}
        </select>
        {showCurrencyInfo && selectedCountryData && (
          <p className="text-xs text-gray-500 mt-1">
            Currency: {selectedCountryData.currency_symbol} {selectedCountryData.currency_code}
          </p>
        )}
      </div>

      {/* City/Region Selection */}
      {selectedCountry && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City/Region *
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => {
              const region = regions.find(r => r.id === e.target.value);
              onLocationChange('region', e.target.value, region?.name);
            }}
            disabled={regionsLoading}
            className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 bg-white disabled:bg-gray-100"
          >
            <option value="">
              {regionsLoading ? 'Loading...' : 'Select city/region'}
            </option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
          {regions.length === 0 && !regionsLoading && selectedCountry && (
            <p className="text-xs text-amber-600 mt-1">
              Enter location in the neighborhood field below
            </p>
          )}
        </div>
      )}
    </div>
  );
}