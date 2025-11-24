'use client';

import { useState, useEffect } from 'react';

export interface PricingPlan {
  id: string;
  plan_name: string;
  user_type: string;
  plan_type: string;
  price: number;
  price_display: number;
  price_formatted: string;
  max_properties: number | null;
  listing_duration_days: number;
  featured_listings_included: number;
  features: any;
  is_popular: boolean;
  display_order: number;
}

export interface Country {
  id: string;
  name: string;
  currency_code: string;
  currency_symbol: string;
}

export interface PricingSummary {
  agent: {
    starting: string | null;
    suffix: string;
  };
  landlord: {
    range: string | null;
    suffix: string;
  };
  fsbo: {
    range: string | null;
    suffix: string;
  };
}

export interface UsePricingResult {
  plans: PricingPlan[];
  country: Country | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export interface UsePricingSummaryResult {
  summary: PricingSummary | null;
  country: Country | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePricing(countryId: string = 'GY', userType?: string): UsePricingResult {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL('/api/pricing', window.location.origin);
      url.searchParams.set('country_id', countryId);
      if (userType) {
        url.searchParams.set('user_type', userType);
      }

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing plans');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch pricing plans');
      }

      setPlans(data.plans || []);
      setCountry(data.country || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching pricing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, [countryId, userType]);

  return {
    plans,
    country,
    loading,
    error,
    refetch: fetchPricing
  };
}

export function usePricingSummary(countryId: string = 'GY'): UsePricingSummaryResult {
  const [summary, setSummary] = useState<PricingSummary | null>(null);
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL('/api/pricing/summary', window.location.origin);
      url.searchParams.set('country_id', countryId);

      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error('Failed to fetch pricing summary');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch pricing summary');
      }

      setSummary(data.summary || null);
      setCountry(data.country || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Error fetching pricing summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [countryId]);

  return {
    summary,
    country,
    loading,
    error,
    refetch: fetchSummary
  };
}