// Global South Countries API Helper
// Focused on Caribbean and Africa markets

import { supabase } from '@/supabase';

export interface Country {
  id: string;
  name: string;
  code: string;
  currency_code: string;
  currency_symbol: string;
  region: string;
  flag_emoji: string;
  calling_code: string;
  status: string;
  display_order: number;
}

export interface Region {
  id: string;
  name: string;
  country_code: string;
  type: string;
  parent_id?: string;
  population?: number;
  is_capital: boolean;
  is_major_city: boolean;
  latitude?: number;
  longitude?: number;
  status: string;
  display_order: number;
}

/**
 * Get all active Global South countries
 */
export async function getGlobalSouthCountries(): Promise<Country[]> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching Global South countries:', error);
      return getGlobalSouthCountriesFallback();
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch Global South countries:', error);
    return getGlobalSouthCountriesFallback();
  }
}

/**
 * Get countries by region (Caribbean or Africa)
 */
export async function getCountriesByRegion(region: 'Caribbean' | 'Africa'): Promise<Country[]> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('region', region)
      .eq('status', 'active')
      .order('display_order', { ascending: true });

    if (error) {
      console.error(`Error fetching ${region} countries:`, error);
      return getGlobalSouthCountriesFallback().filter(c => c.region === region);
    }

    return data || [];
  } catch (error) {
    console.error(`Failed to fetch ${region} countries:`, error);
    return getGlobalSouthCountriesFallback().filter(c => c.region === region);
  }
}

/**
 * Get regions/cities for a specific country
 */
export async function getRegionsByCountry(countryCode: string): Promise<Region[]> {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('country_code', countryCode)
      .eq('status', 'active')
      .order('is_capital', { ascending: false }) // Capitals first
      .order('is_major_city', { ascending: false }) // Major cities next
      .order('population', { ascending: false }); // Then by population

    if (error) {
      console.error(`Error fetching regions for ${countryCode}:`, error);
      return getRegionsFallback(countryCode);
    }

    return data || [];
  } catch (error) {
    console.error(`Failed to fetch regions for ${countryCode}:`, error);
    return getRegionsFallback(countryCode);
  }
}

/**
 * Get major cities only for a country
 */
export async function getMajorCitiesByCountry(countryCode: string): Promise<Region[]> {
  try {
    const { data, error } = await supabase
      .from('regions')
      .select('*')
      .eq('country_code', countryCode)
      .eq('status', 'active')
      .or('is_capital.eq.true,is_major_city.eq.true')
      .order('is_capital', { ascending: false })
      .order('population', { ascending: false });

    if (error) {
      console.error(`Error fetching major cities for ${countryCode}:`, error);
      return getRegionsFallback(countryCode).filter(r => r.is_capital || r.is_major_city);
    }

    return data || [];
  } catch (error) {
    console.error(`Failed to fetch major cities for ${countryCode}:`, error);
    return getRegionsFallback(countryCode).filter(r => r.is_capital || r.is_major_city);
  }
}

/**
 * Get country by code
 */
export async function getCountryByCode(countryCode: string): Promise<Country | null> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('*')
      .eq('code', countryCode)
      .eq('status', 'active')
      .single();

    if (error) {
      console.error(`Error fetching country ${countryCode}:`, error);
      return getGlobalSouthCountriesFallback().find(c => c.code === countryCode) || null;
    }

    return data;
  } catch (error) {
    console.error(`Failed to fetch country ${countryCode}:`, error);
    return getGlobalSouthCountriesFallback().find(c => c.code === countryCode) || null;
  }
}

/**
 * Fallback Global South countries data
 */
function getGlobalSouthCountriesFallback(): Country[] {
  return [
    // Caribbean
    {
      id: 'GY',
      name: 'Guyana',
      code: 'GY',
      currency_code: 'GYD',
      currency_symbol: 'GY$',
      region: 'Caribbean',
      flag_emoji: '🇬🇾',
      calling_code: '+592',
      status: 'active',
      display_order: 1
    },
    {
      id: 'TT',
      name: 'Trinidad and Tobago',
      code: 'TT',
      currency_code: 'TTD',
      currency_symbol: 'TT$',
      region: 'Caribbean',
      flag_emoji: '🇹🇹',
      calling_code: '+1-868',
      status: 'active',
      display_order: 2
    },
    {
      id: 'JM',
      name: 'Jamaica',
      code: 'JM',
      currency_code: 'JMD',
      currency_symbol: 'J$',
      region: 'Caribbean',
      flag_emoji: '🇯🇲',
      calling_code: '+1-876',
      status: 'active',
      display_order: 3
    },
    {
      id: 'BB',
      name: 'Barbados',
      code: 'BB',
      currency_code: 'BBD',
      currency_symbol: 'Bds$',
      region: 'Caribbean',
      flag_emoji: '🇧🇧',
      calling_code: '+1-246',
      status: 'active',
      display_order: 4
    },
    // Africa
    {
      id: 'GH',
      name: 'Ghana',
      code: 'GH',
      currency_code: 'GHS',
      currency_symbol: 'GH₵',
      region: 'Africa',
      flag_emoji: '🇬🇭',
      calling_code: '+233',
      status: 'active',
      display_order: 5
    },
    {
      id: 'NG',
      name: 'Nigeria',
      code: 'NG',
      currency_code: 'NGN',
      currency_symbol: '₦',
      region: 'Africa',
      flag_emoji: '🇳🇬',
      calling_code: '+234',
      status: 'active',
      display_order: 6
    },
    {
      id: 'KE',
      name: 'Kenya',
      code: 'KE',
      currency_code: 'KES',
      currency_symbol: 'KSh',
      region: 'Africa',
      flag_emoji: '🇰🇪',
      calling_code: '+254',
      status: 'active',
      display_order: 7
    }
  ];
}

/**
 * Fallback regions data for specific countries
 */
function getRegionsFallback(countryCode: string): Region[] {
  const fallbackData: Record<string, Region[]> = {
    'GY': [
      {
        id: 'GY-R4-Georgetown',
        name: 'Georgetown',
        country_code: 'GY',
        type: 'city',
        population: 118363,
        is_capital: true,
        is_major_city: true,
        status: 'active',
        display_order: 1
      },
      {
        id: 'GY-R10-Linden',
        name: 'Linden',
        country_code: 'GY',
        type: 'city',
        population: 27277,
        is_capital: false,
        is_major_city: true,
        status: 'active',
        display_order: 2
      },
      {
        id: 'GY-R6-NewAmsterdam',
        name: 'New Amsterdam',
        country_code: 'GY',
        type: 'city',
        population: 17329,
        is_capital: false,
        is_major_city: true,
        status: 'active',
        display_order: 3
      }
    ],
    'TT': [
      {
        id: 'TT-PortOfSpain',
        name: 'Port of Spain',
        country_code: 'TT',
        type: 'city',
        population: 37074,
        is_capital: true,
        is_major_city: true,
        status: 'active',
        display_order: 1
      },
      {
        id: 'TT-SanFernando',
        name: 'San Fernando',
        country_code: 'TT',
        type: 'city',
        population: 48838,
        is_capital: false,
        is_major_city: true,
        status: 'active',
        display_order: 2
      }
    ]
  };

  return fallbackData[countryCode] || [];
}

/**
 * Get region statistics for a country
 */
export async function getRegionStats(countryCode: string): Promise<{
  total: number;
  capitals: number;
  majorCities: number;
  totalPopulation: number;
}> {
  try {
    const regions = await getRegionsByCountry(countryCode);
    
    return {
      total: regions.length,
      capitals: regions.filter(r => r.is_capital).length,
      majorCities: regions.filter(r => r.is_major_city).length,
      totalPopulation: regions.reduce((sum, r) => sum + (r.population || 0), 0)
    };
  } catch (error) {
    console.error(`Failed to get region stats for ${countryCode}:`, error);
    return { total: 0, capitals: 0, majorCities: 0, totalPopulation: 0 };
  }
}

/**
 * Search regions by name
 */
export async function searchRegions(query: string, countryCode?: string): Promise<Region[]> {
  try {
    let queryBuilder = supabase
      .from('regions')
      .select('*')
      .ilike('name', `%${query}%`)
      .eq('status', 'active')
      .limit(20);

    if (countryCode) {
      queryBuilder = queryBuilder.eq('country_code', countryCode);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.error('Error searching regions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to search regions:', error);
    return [];
  }
}