'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { CountryCode, CountryTheme, countryThemes } from '@/lib/country-theme';
import { getCountryFromCookies, getCountryFromDomain } from '@/lib/country-detection';

interface CountryThemeContextType {
  country: CountryCode;
  theme: CountryTheme;
  setCountry: (country: CountryCode) => void;
}

const CountryThemeContext = createContext<CountryThemeContextType | null>(null);

export function CountryThemeProvider({ 
  children, 
  initialCountry 
}: { 
  children: React.ReactNode;
  initialCountry: CountryCode;
}) {
  const [country, setCountry] = useState<CountryCode>(initialCountry);
  const theme = countryThemes[country];

  // Client-side country detection and correction
  useEffect(() => {
    const clientCountry = getCountryFromCookies();
    const hostnameCountry = getCountryFromDomain(window.location.hostname);
    
    console.log(`🔍 CLIENT: Cookie country: ${clientCountry}, Hostname country: ${hostnameCountry}, Current: ${country}`);
    
    // If hostname suggests different country than current, switch to hostname country
    if (hostnameCountry !== country) {
      console.log(`🔄 CLIENT: Switching from ${country} to ${hostnameCountry} based on hostname`);
      setCountry(hostnameCountry);
      
      // Update cookie to match hostname
      document.cookie = `country-code=${hostnameCountry}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
  }, [country]);

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-country', country);
    
    // Update CSS variables
    const root = document.documentElement.style;
    root.setProperty('--primary', theme.colors.primary);
    root.setProperty('--secondary', theme.colors.secondary);
    root.setProperty('--accent', theme.colors.accent);
    root.setProperty('--background', theme.colors.background);
    root.setProperty('--foreground', theme.colors.text);
    
    console.log(`🎨 THEME: Applied ${country} theme - Primary: ${theme.colors.primary}`);
  }, [country, theme]);

  return (
    <CountryThemeContext.Provider value={{ country, theme, setCountry }}>
      {children}
    </CountryThemeContext.Provider>
  );
}

export const useCountryTheme = () => {
  const context = useContext(CountryThemeContext);
  if (!context) {
    throw new Error('useCountryTheme must be used within CountryThemeProvider');
  }
  return context;
};