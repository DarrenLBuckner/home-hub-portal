"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/supabase';
// Inline SVG — no icon library in this repo
function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

interface Counts {
  forSale: number;
  forRent: number;
  forLease: number;
  sold: number;
  rented: number;
  underContract: number;
}

export default function PortfolioSummary({ userId }: { userId: string }) {
  const [counts, setCounts] = useState<Counts>({ forSale: 0, forRent: 0, forLease: 0, sold: 0, rented: 0, underContract: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCounts = async () => {
    try {
      const supabase = createClient();
      const { data: properties } = await supabase
        .from('properties')
        .select('status, listing_type')
        .eq('user_id', userId);

      if (properties) {
        setCounts({
          forSale: properties.filter(p => p.status === 'active' && p.listing_type === 'sale').length,
          forRent: properties.filter(p => p.status === 'active' && p.listing_type === 'rent').length,
          forLease: properties.filter(p => p.status === 'active' && p.listing_type === 'lease').length,
          sold: properties.filter(p => p.status === 'sold').length,
          rented: properties.filter(p => p.status === 'rented').length,
          underContract: properties.filter(p => p.status === 'under_contract').length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch portfolio counts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCounts(); }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCounts();
  };

  const cards: { label: string; count: number; color: string; border: string; filter: string; alwaysShow: boolean }[] = [
    { label: 'Active For Sale', count: counts.forSale, color: 'text-emerald-600', border: 'border-emerald-500', filter: 'sale', alwaysShow: true },
    { label: 'Active For Rent', count: counts.forRent, color: 'text-blue-600', border: 'border-blue-500', filter: 'rent', alwaysShow: true },
    { label: 'Active For Lease', count: counts.forLease, color: 'text-purple-600', border: 'border-purple-500', filter: 'lease', alwaysShow: false },
    { label: 'Sold', count: counts.sold, color: 'text-red-600', border: 'border-red-500', filter: 'sold', alwaysShow: false },
    { label: 'Rented', count: counts.rented, color: 'text-red-600', border: 'border-red-500', filter: 'rented', alwaysShow: false },
    { label: 'Under Contract', count: counts.underContract, color: 'text-amber-600', border: 'border-amber-500', filter: 'under_contract', alwaysShow: false },
  ];

  const visibleCards = cards.filter(c => c.alwaysShow || c.count > 0);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-gray-900">Portfolio Summary</h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {visibleCards.map((card) => (
          <Link
            key={card.filter}
            href={`/dashboard/agent/listings?filter=${card.filter}`}
            className={`bg-white border-t-4 ${card.border} rounded-lg p-4 hover:shadow-md transition-shadow`}
          >
            <p className={`text-3xl font-semibold ${card.color}`}>{card.count}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
