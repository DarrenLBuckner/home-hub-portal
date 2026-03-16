'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/supabase';
// Inline SVG icons — no icon library in this repo
function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
}
function PencilIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
}
function PrinterIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>;
}
function EyeIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
}

type FilterTab = 'all' | 'sale' | 'rent' | 'lease' | 'under_contract' | 'sold' | 'rented' | 'pending' | 'draft';

interface Property {
  id: string;
  title: string;
  price: number;
  currency: string;
  listing_type: string;
  status: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  city: string;
  region: string;
  description: string;
  created_at: string;
  updated_at: string;
  views: number;
  home_size: number | null;
  lot_size: number | null;
  amenities: string[] | null;
  features: string[] | null;
}

const TAB_CONFIG: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'sale', label: 'Active For Sale' },
  { key: 'rent', label: 'Active For Rent' },
  { key: 'lease', label: 'Active For Lease' },
  { key: 'under_contract', label: 'Under Contract' },
  { key: 'sold', label: 'Sold' },
  { key: 'rented', label: 'Rented' },
  { key: 'pending', label: 'Pending Review' },
  { key: 'draft', label: 'Draft' },
];

const VALID_FILTERS: FilterTab[] = ['all', 'sale', 'rent', 'lease', 'sold', 'rented', 'under_contract', 'draft', 'pending'];

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  sold: 'bg-red-100 text-red-700',
  rented: 'bg-red-100 text-red-700',
  under_contract: 'bg-amber-100 text-amber-700',
  draft: 'bg-gray-100 text-gray-600',
  off_market: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-100 text-amber-700',
};

function matchesTab(property: Property, tab: FilterTab): boolean {
  switch (tab) {
    case 'all':
      return true;
    case 'sale':
      return property.status === 'active' && property.listing_type === 'sale';
    case 'rent':
      return property.status === 'active' && property.listing_type === 'rent';
    case 'lease':
      return property.status === 'active' && property.listing_type === 'lease';
    case 'under_contract':
      return property.status === 'under_contract';
    case 'sold':
      return property.status === 'sold';
    case 'rented':
      return property.status === 'rented';
    case 'pending':
      return property.status === 'pending';
    case 'draft':
      return property.status === 'draft';
    default:
      return true;
  }
}

function formatPrice(price: number, currency: string): string {
  const symbol = currency === 'GYD' ? 'G$' : '$';
  return `${symbol}${price.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatListingType(type: string): string {
  if (!type) return '';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function ListingsContent() {
  const searchParams = useSearchParams();
  const filterParam = searchParams.get('filter') as FilterTab | null;
  const initialTab: FilterTab = filterParam && VALID_FILTERS.includes(filterParam) ? filterParam : 'all';

  const [activeTab, setActiveTab] = useState<FilterTab>(initialTab);
  const [properties, setProperties] = useState<Property[]>([]);
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [printProperty, setPrintProperty] = useState<Property | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Fetch agent name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name')
        .eq('id', user.id)
        .single();

      if (profile) {
        setAgentName(profile.display_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Agent');
      }

      // Fetch all properties
      const { data: props } = await supabase
        .from('properties')
        .select('id, title, price, currency, listing_type, status, property_type, bedrooms, bathrooms, city, region, description, created_at, updated_at, views, home_size, lot_size, amenities, features')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setProperties(props || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Compute which tabs have listings
  const tabCounts: Record<FilterTab, number> = {
    all: properties.length,
    sale: properties.filter((p) => matchesTab(p, 'sale')).length,
    rent: properties.filter((p) => matchesTab(p, 'rent')).length,
    lease: properties.filter((p) => matchesTab(p, 'lease')).length,
    under_contract: properties.filter((p) => matchesTab(p, 'under_contract')).length,
    sold: properties.filter((p) => matchesTab(p, 'sold')).length,
    rented: properties.filter((p) => matchesTab(p, 'rented')).length,
    pending: properties.filter((p) => matchesTab(p, 'pending')).length,
    draft: properties.filter((p) => matchesTab(p, 'draft')).length,
  };

  const visibleTabs = TAB_CONFIG.filter((t) => tabCounts[t.key] > 0);
  const filtered = properties.filter((p) => matchesTab(p, activeTab));

  const handlePrint = (property: Property) => {
    setPrintProperty(property);
    setTimeout(() => {
      window.print();
      setPrintProperty(null);
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading listings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Print-only record */}
      {printProperty && (
        <div className="print-record hidden" style={{ display: 'none' }}>
          <div style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', maxWidth: '700px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '18pt', borderBottom: '2px solid #059669', paddingBottom: '8px', marginBottom: '4px' }}>
              Guyana HomeHub &mdash; Property Record
            </h1>
            <p style={{ fontSize: '10pt', color: '#666', marginBottom: '24px' }}>
              {agentName} | Printed: {formatDate(new Date().toISOString())}
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
              <tbody>
                {[
                  ['Title', printProperty.title],
                  ['Status', formatStatus(printProperty.status)],
                  ['Listing Type', formatListingType(printProperty.listing_type)],
                  ['Property Type', printProperty.property_type ? formatListingType(printProperty.property_type) : '-'],
                  ['Price', formatPrice(printProperty.price, printProperty.currency)],
                  ['Bedrooms', printProperty.bedrooms != null ? String(printProperty.bedrooms) : '-'],
                  ['Bathrooms', printProperty.bathrooms != null ? String(printProperty.bathrooms) : '-'],
                  ['Home Size', printProperty.home_size != null ? `${printProperty.home_size.toLocaleString()} sq ft` : '-'],
                  ['Lot Size', printProperty.lot_size != null ? `${printProperty.lot_size.toLocaleString()} sq ft` : '-'],
                  ['Location', [printProperty.city, printProperty.region].filter(Boolean).join(', ') || '-'],
                  ['Date Listed', formatDate(printProperty.created_at)],
                  ['Last Updated', formatDate(printProperty.updated_at)],
                  ['Views', String(printProperty.views || 0)],
                ].map(([label, value], i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '6px 12px 6px 0', fontWeight: 'bold', width: '35%', verticalAlign: 'top' }}>{label}</td>
                    <td style={{ padding: '6px 0', verticalAlign: 'top' }}>{value}</td>
                  </tr>
                ))}
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 12px 6px 0', fontWeight: 'bold', width: '35%', verticalAlign: 'top' }}>Description</td>
                  <td style={{ padding: '6px 0', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>{printProperty.description || '-'}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 12px 6px 0', fontWeight: 'bold', width: '35%', verticalAlign: 'top' }}>Amenities</td>
                  <td style={{ padding: '6px 0', verticalAlign: 'top' }}>
                    {printProperty.amenities && printProperty.amenities.length > 0 ? printProperty.amenities.join(', ') : '-'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '6px 12px 6px 0', fontWeight: 'bold', width: '35%', verticalAlign: 'top' }}>Features</td>
                  <td style={{ padding: '6px 0', verticalAlign: 'top' }}>
                    {printProperty.features && printProperty.features.length > 0 ? printProperty.features.join(', ') : '-'}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginTop: '32px', borderTop: '1px solid #ccc', paddingTop: '8px', fontSize: '9pt', color: '#999' }}>
              Property ID: {printProperty.id} | Generated by Portal HomeHub | portalhomehub.com
            </div>
          </div>
        </div>
      )}

      {/* Print CSS */}
      <style>{`
        @media print {
          nav, header, footer, .no-print, [data-print="hide"] { display: none !important; }
          .print-record { display: block !important; }
          body { font-family: Arial, sans-serif; font-size: 11pt; }
          .print-record { page-break-inside: avoid; }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 no-print" data-print="hide">
        {/* Back link */}
        <div className="mb-4">
          <Link href="/dashboard/agent" className="text-emerald-600 hover:underline text-sm">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">My Listings</h1>
            <p className="text-sm text-gray-500">Your full property portfolio</p>
          </div>
          <Link
            href="/dashboard/agent/create-property"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors self-start sm:self-auto"
          >
            <PlusIcon className="w-4 h-4" />
            Add New Property
          </Link>
        </div>

        {/* Tabs */}
        {visibleTabs.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-6 border-b pb-3">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.label} ({tabCounts[tab.key]})
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500 mb-4">No listings found in this category.</p>
            <Link
              href="/dashboard/agent/create-property"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create Your First Listing
            </Link>
          </div>
        )}

        {/* Desktop table (hidden on mobile) */}
        {filtered.length > 0 && (
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Beds/Baths</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Date Listed</th>
                    <th className="px-4 py-3">Views</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 max-w-[200px]">
                        <span className="font-semibold text-gray-900 truncate block">{p.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600'}`}>
                          {formatStatus(p.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {formatListingType(p.listing_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {formatPrice(p.price, p.currency)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {p.bedrooms != null || p.bathrooms != null ? (
                          <>
                            {p.bedrooms != null && <span>{p.bedrooms} bd</span>}
                            {p.bedrooms != null && p.bathrooms != null && <span> / </span>}
                            {p.bathrooms != null && <span>{p.bathrooms} ba</span>}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {[p.city, p.region].filter(Boolean).join(', ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {p.views > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <EyeIcon className="w-3.5 h-3.5" />
                            {p.views}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/agent/edit-property/${p.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handlePrint(p)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <PrinterIcon className="w-3.5 h-3.5" />
                            Print Record
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile cards (hidden on desktop) */}
        {filtered.length > 0 && (
          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{p.title}</h3>
                  <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[p.status] || 'bg-gray-100 text-gray-600'}`}>
                    {formatStatus(p.status)}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {formatListingType(p.listing_type)}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{formatPrice(p.price, p.currency)}</span>
                </div>

                <div className="text-xs text-gray-500 space-y-1 mb-3">
                  {(p.bedrooms != null || p.bathrooms != null) && (
                    <p>
                      {p.bedrooms != null && <span>{p.bedrooms} bed</span>}
                      {p.bedrooms != null && p.bathrooms != null && <span> / </span>}
                      {p.bathrooms != null && <span>{p.bathrooms} bath</span>}
                    </p>
                  )}
                  {(p.city || p.region) && (
                    <p>{[p.city, p.region].filter(Boolean).join(', ')}</p>
                  )}
                  <p>Listed {formatDate(p.created_at)}</p>
                  {p.views > 0 && (
                    <p className="inline-flex items-center gap-1">
                      <EyeIcon className="w-3 h-3" />
                      {p.views} views
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/agent/edit-property/${p.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                  <button
                    onClick={() => handlePrint(p)}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <PrinterIcon className="w-3.5 h-3.5" />
                    Print Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading listings...</p>
          </div>
        </div>
      }
    >
      <ListingsContent />
    </Suspense>
  );
}
