import { CountryCode } from './country-theme';

export function getCountryFromDomain(hostname: string): CountryCode {
  if (hostname.includes('jamaica')) {
    return 'JM';
  }
  if (hostname.includes('colombia')) {
    return 'CO';
  }

  return 'GY'; // Default to Guyana
}

// Client-side cookie reading function
export function getCountryFromCookies(): CountryCode {
  if (typeof window === 'undefined') return 'GY';
  
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith('country-code='))
    ?.split('=')[1];
    
  if (cookieValue === 'JM' || cookieValue === 'GY' || cookieValue === 'CO') {
    return cookieValue as CountryCode;
  }
  
  // Fallback to hostname detection
  return getCountryFromDomain(window.location.hostname);
}