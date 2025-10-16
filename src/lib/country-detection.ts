import { headers } from 'next/headers';
import { CountryCode } from './country-theme';

export async function getCountryFromHeaders(): Promise<CountryCode> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  
  if (host.includes('jamaica')) {
    return 'JM';
  }
  
  return 'GY'; // Default to Guyana
}

export function getCountryFromDomain(hostname: string): CountryCode {
  if (hostname.includes('jamaica')) {
    return 'JM';
  }
  
  return 'GY'; // Default to Guyana
}