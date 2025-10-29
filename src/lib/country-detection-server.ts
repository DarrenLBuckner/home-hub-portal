import { cookies } from 'next/headers';
import { CountryCode } from './country-theme';

export async function getCountryFromHeaders(): Promise<CountryCode> {
  try {
    const cookieStore = await cookies();
    const countryCookie = cookieStore.get('country-code');
    
    if (countryCookie?.value === 'JM' || countryCookie?.value === 'GY') {
      return countryCookie.value as CountryCode;
    }
  } catch (error) {
    console.log('Could not read cookies, falling back to GY');
  }
  
  return 'GY'; // Default to Guyana
}

export function getCountryFromDomain(hostname: string): CountryCode {
  if (hostname.includes('jamaica')) {
    return 'JM';
  }
  
  return 'GY'; // Default to Guyana
}