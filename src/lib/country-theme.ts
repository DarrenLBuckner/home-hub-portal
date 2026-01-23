export type CountryCode = 'GY' | 'JM' | 'CO';

export interface CountryTheme {
  code: CountryCode;
  name: string;
  currency: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  assets: {
    logo: string;
    favicon: string;
    hero: string;
  };
}

export const countryThemes: Record<CountryCode, CountryTheme> = {
  GY: {
    code: 'GY',
    name: 'Guyana Home Hub',
    currency: 'GYD',
    colors: {
      primary: '#2563eb',
      secondary: '#059669',
      accent: '#dc2626',
      background: '#ffffff',
      text: '#171717'
    },
    assets: {
      logo: '/logos/guyana-logo.png',
      favicon: '/favicons/guyana-favicon.ico',
      hero: '/images/guyana-hero.jpg'
    }
  },
  JM: {
    code: 'JM',
    name: 'Jamaica Home Hub',
    currency: 'JMD',
    colors: {
      primary: '#009639',
      secondary: '#FFD700',
      accent: '#0077BE',
      background: '#ffffff',
      text: '#000000'
    },
    assets: {
      logo: '/logos/jamaica-logo.png',
      favicon: '/favicons/jamaica-favicon.ico',
      hero: '/images/jamaica-hero.jpg'
    }
  },
  CO: {
    code: 'CO',
    name: 'Colombia HomeHub',
    currency: 'COP',
    colors: {
      primary: '#1a365d',      // Deep blue (from spec)
      secondary: '#2b6cb0',    // Lighter blue (from spec)
      accent: '#FCD116',       // Colombian yellow
      background: '#ffffff',
      text: '#1a202c'
    },
    assets: {
      logo: '/logos/colombia-logo.png',
      favicon: '/favicons/colombia-favicon.ico',
      hero: '/images/colombia-hero.jpg'
    }
  }
};

export function getCountryFromDomain(hostname: string): CountryCode {
  if (hostname.includes('jamaica')) return 'JM';
  if (hostname.includes('colombia')) return 'CO';
  return 'GY'; // Default to Guyana
}