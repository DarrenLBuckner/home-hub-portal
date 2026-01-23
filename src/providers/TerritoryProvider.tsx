'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

export interface Territory {
  countryCode: string;
  countryName: string;
  displayName: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  currency: string;
  currencySymbol: string;
  status: 'active' | 'pending' | 'suspended' | 'terminated';
  flagEmoji?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

interface TerritoryContextType {
  territory: Territory;
  isLoading: boolean;
  setLanguage: (lang: string) => void;
  currentLanguage: string;
}

// Default territory fallback (Guyana)
const defaultTerritory: Territory = {
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
};

const TerritoryContext = createContext<TerritoryContextType | null>(null);

interface TerritoryProviderProps {
  children: ReactNode;
  initialTerritory?: Territory;
}

export function TerritoryProvider({
  children,
  initialTerritory,
}: TerritoryProviderProps) {
  const [territory, setTerritory] = useState<Territory>(initialTerritory || defaultTerritory);
  const [isLoading, setIsLoading] = useState(!initialTerritory);
  const [currentLanguage, setCurrentLanguage] = useState(
    initialTerritory?.defaultLanguage || 'en'
  );

  // Load saved language preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('preferred-locale');
      if (savedLang && territory.supportedLanguages.includes(savedLang)) {
        setCurrentLanguage(savedLang);
      }
    }
  }, [territory.supportedLanguages]);

  // Fetch territory data from API if not provided
  useEffect(() => {
    if (initialTerritory) {
      setTerritory(initialTerritory);
      setIsLoading(false);
      return;
    }

    async function fetchTerritory() {
      try {
        const response = await fetch('/api/territory');
        if (response.ok) {
          const data = await response.json();
          setTerritory(data);
          setCurrentLanguage(data.defaultLanguage || 'en');
        }
      } catch (error) {
        console.error('Failed to fetch territory data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTerritory();
  }, [initialTerritory]);

  const setLanguage = (lang: string) => {
    if (territory.supportedLanguages.includes(lang)) {
      setCurrentLanguage(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferred-locale', lang);
      }
    }
  };

  return (
    <TerritoryContext.Provider value={{ territory, isLoading, setLanguage, currentLanguage }}>
      {children}
    </TerritoryContext.Provider>
  );
}

export function useTerritory() {
  const context = useContext(TerritoryContext);
  if (!context) {
    throw new Error('useTerritory must be used within TerritoryProvider');
  }
  return context;
}

// Helper hook to check if a language is supported
export function useIsLanguageSupported(lang: string): boolean {
  const { territory } = useTerritory();
  return territory.supportedLanguages.includes(lang);
}

// Helper hook to get formatted currency
export function useFormattedCurrency(amount: number): string {
  const { territory } = useTerritory();
  return `${territory.currencySymbol}${amount.toLocaleString()}`;
}
