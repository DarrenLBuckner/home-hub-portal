'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { CountryCode, CountryTheme, countryThemes } from '@/lib/country-theme';

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