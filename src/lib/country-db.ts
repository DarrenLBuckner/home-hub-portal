import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type CountryCode = 'GY' | 'JM';

export async function getCountryCode(): Promise<CountryCode> {
  const headersList = await headers();
  const countryHeader = headersList.get('x-country-code');
  return (countryHeader as CountryCode) || 'GY';
}

export async function getCountrySupabase() {
  const supabase = await createClient();
  const country = await getCountryCode();
  
  // Return enhanced client with country filtering helpers
  return {
    ...supabase,
    country,
    
    // Helper for regions filtered by country
    getRegions: () => supabase
      .from('regions')
      .select('*')
      .eq('country_code', country),
    
    // Helper for pricing plans filtered by country
    getPricingPlans: (userType?: string) => {
      let query = supabase
        .from('pricing_plans')
        .select('*')
        .like('plan_name', `%${country === 'JM' ? 'Jamaica' : 'Guyana'}%`);
      
      if (userType) {
        query = query.eq('user_type', userType);
      }
      
      return query;
    },
    
    // Helper for properties (when we add country filtering)
    getProperties: () => supabase
      .from('properties')
      .select('*')
      // TODO: Add country filtering when properties table is updated
    };
}

// Client-side country detection (for components)
export function getCountryFromDomain(): CountryCode {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('jamaica') || hostname.includes('jm')) {
      return 'JM';
    }
  }
  return 'GY';
}