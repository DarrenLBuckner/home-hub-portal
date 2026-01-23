// src/app/api/territory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// In-memory cache for territory data
interface CachedTerritory {
  data: TerritoryData;
  expiry: number;
}

interface TerritoryData {
  countryCode: string;
  countryName: string;
  displayName: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  currency: string;
  currencySymbol: string;
  status: string;
  flagEmoji?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const territoryCache = new Map<string, CachedTerritory>();

// Default territories for fallback
const defaultTerritories: Record<string, TerritoryData> = {
  GY: {
    countryCode: 'GY',
    countryName: 'Guyana',
    displayName: 'Guyana HomeHub',
    defaultLanguage: 'en',
    supportedLanguages: ['en'],
    currency: 'GYD',
    currencySymbol: '$',
    status: 'active',
    flagEmoji: '🇬🇾',
    primaryColor: '#2563eb',
    secondaryColor: '#059669',
  },
  JM: {
    countryCode: 'JM',
    countryName: 'Jamaica',
    displayName: 'Jamaica HomeHub',
    defaultLanguage: 'en',
    supportedLanguages: ['en'],
    currency: 'JMD',
    currencySymbol: '$',
    status: 'pending',
    flagEmoji: '🇯🇲',
    primaryColor: '#009639',
    secondaryColor: '#FFD700',
  },
  CO: {
    countryCode: 'CO',
    countryName: 'Colombia',
    displayName: 'Colombia HomeHub',
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    currency: 'COP',
    currencySymbol: '$',
    status: 'pending',
    flagEmoji: '🇨🇴',
    primaryColor: '#1a365d',
    secondaryColor: '#2b6cb0',
  },
};

function getCountryFromHostname(hostname: string): string {
  const lowerHost = hostname.toLowerCase();
  if (lowerHost.includes('jamaica')) return 'JM';
  if (lowerHost.includes('colombia')) return 'CO';
  return 'GY'; // Default to Guyana
}

export async function GET(request: NextRequest) {
  try {
    const hostname = request.headers.get('host') || '';
    const countryCode = getCountryFromHostname(hostname);

    // Check cache first
    const cached = territoryCache.get(countryCode);
    if (cached && Date.now() < cached.expiry) {
      return NextResponse.json(cached.data);
    }

    // Fetch from database
    const supabase = await createClient();
    const { data: territory, error } = await supabase
      .from('territories')
      .select(`
        country_code,
        country_name,
        display_name,
        default_language,
        supported_languages,
        currency,
        currency_symbol,
        status,
        flag_emoji,
        primary_color,
        secondary_color
      `)
      .eq('country_code', countryCode)
      .single();

    if (error || !territory) {
      // Return default territory if database fetch fails
      console.log(`Territory not found in database for ${countryCode}, using default`);
      const defaultData = defaultTerritories[countryCode] || defaultTerritories.GY;
      return NextResponse.json(defaultData);
    }

    // Transform database response to API format
    const territoryData: TerritoryData = {
      countryCode: territory.country_code,
      countryName: territory.country_name,
      displayName: territory.display_name,
      defaultLanguage: territory.default_language,
      supportedLanguages: territory.supported_languages || ['en'],
      currency: territory.currency,
      currencySymbol: territory.currency_symbol,
      status: territory.status,
      flagEmoji: territory.flag_emoji,
      primaryColor: territory.primary_color,
      secondaryColor: territory.secondary_color,
    };

    // Cache the result
    territoryCache.set(countryCode, {
      data: territoryData,
      expiry: Date.now() + CACHE_TTL,
    });

    return NextResponse.json(territoryData);
  } catch (error) {
    console.error('Error fetching territory:', error);
    // Return Guyana default on error
    return NextResponse.json(defaultTerritories.GY);
  }
}
