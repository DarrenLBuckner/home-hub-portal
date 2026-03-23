'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/supabase';
import { User } from '@supabase/supabase-js';

// ── Constants ──────────────────────────────────────────────

const SUPER_ADMINS = ['mrdarrenbuckner@gmail.com'];

const REGION_MAP: Record<string, string> = {
  'GY-R4': 'East Bank Demerara',
  'GY-Georgetown': 'Georgetown',
  'GY-R3': 'West Demerara/Essequibo',
  'GY-R6': 'East Berbice-Corentyne',
  'GY-R2': 'Pomeroon-Supenaam',
  'GY-R4-Diamond': 'Diamond EBD',
};

const SALE_PRICE_BUCKETS = [
  { label: 'Under $10K', min: 0, max: 9999 },
  { label: '$10K–$50K', min: 10000, max: 49999 },
  { label: '$50K–$200K', min: 50000, max: 199999 },
  { label: '$200K–$500K', min: 200000, max: 499999 },
  { label: 'Over $500K', min: 500000, max: Infinity },
];

const RENT_PRICE_BUCKETS = [
  { label: 'Under $500/mo', min: 0, max: 499 },
  { label: '$500–$2K/mo', min: 500, max: 1999 },
  { label: '$2K–$5K/mo', min: 2000, max: 4999 },
  { label: '$5K–$10K/mo', min: 5000, max: 9999 },
  { label: 'Over $10K/mo', min: 10000, max: Infinity },
];

// ── Types ──────────────────────────────────────────────────

interface Property {
  id: string;
  title: string;
  status: string;
  property_type: string;
  listing_type: string;
  region: string;
  price: number;
  usd_price: number | null;
  currency: string;
  views: number | null;
  view_count_30d: number | null;
  amenities: string[] | null;
  created_at: string;
  first_listed_at: string | null;
  status_changed_at: string | null;
}

interface StatusCount {
  status: string;
  count: number;
}

interface TypeStat {
  property_type: string;
  listing_type: string;
  count: number;
  avg_usd: number;
  median_usd: number;
}

interface TransactionTypeStat {
  listing_type: string;
  count: number;
  avg_usd: number;
  median_usd: number;
}

interface RegionStat {
  code: string;
  name: string;
  listing_type: string;
  count: number;
  total_views: number;
  avg_usd: number;
}

interface TopViewed {
  title: string;
  region: string;
  property_type: string;
  listing_type: string;
  usd_price: number | null;
  price: number;
  currency: string;
  views: number;
  view_count_30d: number | null;
}

interface PriceBucket {
  label: string;
  count: number;
}

interface AmenityFreq {
  amenity: string;
  count: number;
  pct: number;
}

interface MonthCount {
  month: string;
  count: number;
}

interface CurrencySummary {
  currency: string;
  count: number;
  avg: number;
  median: number;
}

interface ReportData {
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  totalProperties: number;
  a_statusCounts: StatusCount[];
  b_typeStats: TypeStat[];
  b2_transactionStats: TransactionTypeStat[];
  c_regionStats: RegionStat[];
  d_topViewed: TopViewed[];
  e_saleBuckets: PriceBucket[];
  e_rentBuckets: PriceBucket[];
  f_amenityFreq: AmenityFreq[];
  g_monthlyNew: MonthCount[];
  h_soldInPeriod: Property[];
  i_currencySummary: CurrencySummary[];
}

// ── Helpers ────────────────────────────────────────────────

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function regionName(code: string): string {
  return REGION_MAP[code] || code || 'Unknown';
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtUsd(n: number): string {
  return '$' + fmt(Math.round(n));
}

function fmtListingType(lt: string): string {
  if (lt === 'rent') return 'For Rent';
  if (lt === 'sale') return 'For Sale';
  if (lt === 'lease') return 'For Lease';
  return lt || 'Unknown';
}

function quarterStart(): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3) * 3;
  return new Date(now.getFullYear(), q, 1).toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function toMonthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ── CSV / JSON export ──────────────────────────────────────

function downloadJSON(data: ReportData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${data.dateFrom}-to-${data.dateTo}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCSV(data: ReportData) {
  const sections: string[] = [];

  sections.push('=== Listings by Status ===');
  sections.push('Status,Count');
  data.a_statusCounts.forEach((r) => sections.push(`${r.status},${r.count}`));

  sections.push('');
  sections.push('=== By Property Type ===');
  sections.push('Type,Listing Type,Count,Avg USD,Median USD');
  data.b_typeStats.forEach((r) =>
    sections.push(`${r.property_type},${fmtListingType(r.listing_type)},${r.count},${Math.round(r.avg_usd)},${Math.round(r.median_usd)}`)
  );

  sections.push('');
  sections.push('=== Listings by Transaction Type ===');
  sections.push('Transaction Type,Count,Avg USD,Median USD');
  data.b2_transactionStats.forEach((r) =>
    sections.push(`${fmtListingType(r.listing_type)},${r.count},${Math.round(r.avg_usd)},${Math.round(r.median_usd)}`)
  );

  sections.push('');
  sections.push('=== By Region ===');
  sections.push('Region,Listing Type,Count,Total Views,Avg USD');
  data.c_regionStats.forEach((r) =>
    sections.push(`${r.name},${fmtListingType(r.listing_type)},${r.count},${r.total_views},${Math.round(r.avg_usd)}`)
  );

  sections.push('');
  sections.push('=== Top 10 Most Viewed ===');
  sections.push('Title,Region,Type,Listing,USD Price,Price,Currency,Views,Views 30d');
  data.d_topViewed.forEach((r) =>
    sections.push(
      `"${r.title}",${r.region},${r.property_type},${fmtListingType(r.listing_type)},${r.usd_price ?? ''},${r.price},${r.currency},${r.views},${r.view_count_30d ?? ''}`
    )
  );

  sections.push('');
  sections.push('=== For Sale Price Distribution (USD) ===');
  sections.push('Bucket,Count');
  data.e_saleBuckets.forEach((r) => sections.push(`${r.label},${r.count}`));

  sections.push('');
  sections.push('=== For Rent Price Distribution (USD monthly) ===');
  sections.push('Bucket,Count');
  data.e_rentBuckets.forEach((r) => sections.push(`${r.label},${r.count}`));

  sections.push('');
  sections.push('=== Amenity Frequency ===');
  sections.push('Amenity,Count,%');
  data.f_amenityFreq.forEach((r) => sections.push(`${r.amenity},${r.count},${r.pct}`));

  sections.push('');
  sections.push('=== New Listings per Month ===');
  sections.push('Month,Count');
  data.g_monthlyNew.forEach((r) => sections.push(`${r.month},${r.count}`));

  sections.push('');
  sections.push('=== Sold in Period ===');
  sections.push('Title,Region,Price,Currency,Sold Date');
  data.h_soldInPeriod.forEach((r) =>
    sections.push(`"${r.title}",${regionName(r.region)},${r.price},${r.currency},${r.status_changed_at || ''}`)
  );

  sections.push('');
  sections.push('=== Currency Summary ===');
  sections.push('Currency,Count,Avg,Median');
  data.i_currencySummary.forEach((r) =>
    sections.push(`${r.currency},${r.count},${Math.round(r.avg)},${Math.round(r.median)}`)
  );

  const blob = new Blob([sections.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `report-${data.dateFrom}-to-${data.dateTo}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Section Table Component ────────────────────────────────

function printSection(title: string, contentEl: HTMLElement) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>${title} — GHH Report</title><style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 2rem; color: #111; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 1.5rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 1rem; }
    .header img { height: 36px; }
    .header h1 { font-size: 1.1rem; font-weight: 600; margin: 0; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th { text-align: left; padding: 6px 10px; border-bottom: 2px solid #d1d5db; font-weight: 600; color: #4b5563; }
    td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background: #f9fafb; }
  </style></head><body>
    <div class="header">
      <img src="/logo.png" alt="GHH" onerror="this.style.display='none'" />
      <h1>${title}</h1>
    </div>
    ${contentEl.innerHTML}
    <script>window.onload=function(){window.print()}<\/script>
  </body></html>`);
  win.document.close();
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="bg-white rounded-lg shadow p-5 print-section">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <button
          onClick={() => ref.current && printSection(title, ref.current)}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 no-print"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 7.131H5.25" />
          </svg>
          Print Section
        </button>
      </div>
      <div ref={ref}>{children}</div>
    </section>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {headers.map((h) => (
              <th key={h} className="text-left px-3 py-2 border-b border-gray-200 font-medium text-gray-600">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-gray-800">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={headers.length} className="px-3 py-4 text-center text-gray-400">
                No data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────

export default function ReportExportPage() {
  const supabase = createClient();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Report state
  const [dateFrom, setDateFrom] = useState(quarterStart);
  const [dateTo, setDateTo] = useState(todayStr);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Auth check ─────────────────────────────────────────

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data: { user }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !user) {
        setAuthLoading(false);
        return;
      }
      setUser(user);

      // Check SUPER_ADMINS list
      const emailMatch = SUPER_ADMINS.includes(user.email?.toLowerCase() || '');

      // Check profiles.admin_level
      let profileMatch = false;
      const { data: profile } = await supabase
        .from('profiles')
        .select('admin_level')
        .eq('id', user.id)
        .single();

      if (profile && (profile.admin_level === 'owner' || profile.admin_level === 'super')) {
        profileMatch = true;
      }

      setAuthorized(emailMatch || profileMatch);
    } catch {
      setAuthorized(false);
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Run report ─────────────────────────────────────────

  async function runReport() {
    setLoading(true);
    setError('');
    setReport(null);

    try {
      // Fetch all properties in date range
      const from = `${dateFrom}T00:00:00.000Z`;
      const to = `${dateTo}T23:59:59.999Z`;

      const { data: properties, error: fetchErr } = await supabase
        .from('properties')
        .select(
          'id, title, status, property_type, listing_type, region, price, usd_price, currency, views, view_count_30d, amenities, created_at, first_listed_at, status_changed_at'
        )
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      const props: Property[] = (properties || []) as Property[];

      // (a) Listings by status
      const statusMap = new Map<string, number>();
      props.forEach((p) => statusMap.set(p.status, (statusMap.get(p.status) || 0) + 1));
      const a_statusCounts: StatusCount[] = Array.from(statusMap.entries())
        .map(([status, count]) => ({ status, count }))
        .sort((a, b) => b.count - a.count);

      // (b) By property_type split by listing_type
      const typeListingGroups = new Map<string, Property[]>();
      props.forEach((p) => {
        const key = `${p.property_type || 'Unknown'}|||${p.listing_type || 'unknown'}`;
        if (!typeListingGroups.has(key)) typeListingGroups.set(key, []);
        typeListingGroups.get(key)!.push(p);
      });
      const b_typeStats: TypeStat[] = Array.from(typeListingGroups.entries()).map(([key, items]) => {
        const [pt, lt] = key.split('|||');
        const prices = items.map((i) => i.usd_price ?? 0).filter((v) => v > 0);
        return {
          property_type: pt,
          listing_type: lt,
          count: items.length,
          avg_usd: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
          median_usd: median(prices),
        };
      }).sort((a, b) => a.property_type.localeCompare(b.property_type) || b.count - a.count);

      // (b2) Listings by transaction type (headline summary)
      const txGroups = new Map<string, Property[]>();
      props.forEach((p) => {
        const lt = p.listing_type || 'unknown';
        if (!txGroups.has(lt)) txGroups.set(lt, []);
        txGroups.get(lt)!.push(p);
      });
      const b2_transactionStats: TransactionTypeStat[] = Array.from(txGroups.entries()).map(([lt, items]) => {
        const prices = items.map((i) => i.usd_price ?? 0).filter((v) => v > 0);
        return {
          listing_type: lt,
          count: items.length,
          avg_usd: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
          median_usd: median(prices),
        };
      }).sort((a, b) => b.count - a.count);

      // (c) By region split by listing_type
      const regionListingGroups = new Map<string, Property[]>();
      props.forEach((p) => {
        const key = `${p.region || 'Unknown'}|||${p.listing_type || 'unknown'}`;
        if (!regionListingGroups.has(key)) regionListingGroups.set(key, []);
        regionListingGroups.get(key)!.push(p);
      });
      const c_regionStats: RegionStat[] = Array.from(regionListingGroups.entries()).map(([key, items]) => {
        const [code, lt] = key.split('|||');
        const prices = items.map((i) => i.usd_price ?? 0).filter((v) => v > 0);
        return {
          code,
          name: regionName(code),
          listing_type: lt,
          count: items.length,
          total_views: items.reduce((s, i) => s + (i.views || 0), 0),
          avg_usd: prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        };
      }).sort((a, b) => a.name.localeCompare(b.name) || b.count - a.count);

      // (d) Top 10 most viewed
      const d_topViewed: TopViewed[] = [...props]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10)
        .map((p) => ({
          title: p.title,
          region: regionName(p.region),
          property_type: p.property_type,
          listing_type: p.listing_type || 'unknown',
          usd_price: p.usd_price,
          price: p.price,
          currency: p.currency,
          views: p.views || 0,
          view_count_30d: p.view_count_30d,
        }));

      // (e) Price distribution — split by sale vs rent
      const saleProps = props.filter((p) => p.listing_type === 'sale');
      const rentProps = props.filter((p) => p.listing_type === 'rent' || p.listing_type === 'lease');

      const e_saleBuckets: PriceBucket[] = SALE_PRICE_BUCKETS.map((bucket) => ({
        label: bucket.label,
        count: saleProps.filter((p) => {
          const v = p.usd_price ?? 0;
          return v >= bucket.min && v <= bucket.max;
        }).length,
      }));

      const e_rentBuckets: PriceBucket[] = RENT_PRICE_BUCKETS.map((bucket) => ({
        label: bucket.label,
        count: rentProps.filter((p) => {
          const v = p.usd_price ?? 0;
          return v >= bucket.min && v <= bucket.max;
        }).length,
      }));

      // (f) Amenity frequency — try RPC first, fall back to client-side
      let f_amenityFreq: AmenityFreq[] = [];
      try {
        const { data: rpcData, error: rpcErr } = await supabase.rpc('get_amenity_frequency');
        if (!rpcErr && rpcData && Array.isArray(rpcData)) {
          const total = props.length || 1;
          f_amenityFreq = rpcData.map((r: { amenity: string; count: number }) => ({
            amenity: r.amenity,
            count: r.count,
            pct: Math.round((r.count / total) * 100),
          })).sort((a: AmenityFreq, b: AmenityFreq) => b.count - a.count);
        } else {
          throw new Error('RPC unavailable');
        }
      } catch {
        // Fallback: compute from fetched data
        const amenityMap = new Map<string, number>();
        props.forEach((p) => {
          (p.amenities || []).forEach((a) => amenityMap.set(a, (amenityMap.get(a) || 0) + 1));
        });
        const total = props.length || 1;
        f_amenityFreq = Array.from(amenityMap.entries())
          .map(([amenity, count]) => ({ amenity, count, pct: Math.round((count / total) * 100) }))
          .sort((a, b) => b.count - a.count);
      }

      // (g) New listings per month (first_listed_at, fallback created_at)
      const monthMap = new Map<string, number>();
      props.forEach((p) => {
        const key = toMonthKey(p.first_listed_at || p.created_at);
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      });
      const g_monthlyNew: MonthCount[] = Array.from(monthMap.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // (h) Sold in period — query separately with status_changed_at
      let h_soldInPeriod: Property[] = [];
      const { data: soldData } = await supabase
        .from('properties')
        .select(
          'id, title, status, property_type, listing_type, region, price, usd_price, currency, views, view_count_30d, amenities, created_at, first_listed_at, status_changed_at'
        )
        .eq('status', 'sold')
        .gte('status_changed_at', from)
        .lte('status_changed_at', to);

      if (soldData) h_soldInPeriod = soldData as Property[];

      // (i) Currency summary
      const gydProps = props.filter((p) => p.currency === 'GYD' && p.price > 0);
      const usdProps = props.filter((p) => p.currency === 'USD' && p.usd_price && p.usd_price > 0);

      const i_currencySummary: CurrencySummary[] = [];
      if (gydProps.length > 0) {
        const gydPrices = gydProps.map((p) => p.price);
        i_currencySummary.push({
          currency: 'GYD',
          count: gydProps.length,
          avg: gydPrices.reduce((a, b) => a + b, 0) / gydPrices.length,
          median: median(gydPrices),
        });
      }
      if (usdProps.length > 0) {
        const usdPrices = usdProps.map((p) => p.usd_price!);
        i_currencySummary.push({
          currency: 'USD',
          count: usdProps.length,
          avg: usdPrices.reduce((a, b) => a + b, 0) / usdPrices.length,
          median: median(usdPrices),
        });
      }

      setReport({
        dateFrom,
        dateTo,
        generatedAt: new Date().toISOString(),
        totalProperties: props.length,
        a_statusCounts,
        b_typeStats,
        b2_transactionStats,
        c_regionStats,
        d_topViewed,
        e_saleBuckets,
        e_rentBuckets,
        f_amenityFreq,
        g_monthlyNew,
        h_soldInPeriod,
        i_currencySummary,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Report generation failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  // ── Render: Loading ────────────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Render: Access Denied ──────────────────────────────

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-sm">
          <div className="text-red-500 text-5xl mb-4">&#x1F6AB;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 text-sm">Super admin privileges required to access this page.</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-5 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Page ───────────────────────────────────────

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white !important; font-size: 11pt; }
          nav, header, footer, .no-print { display: none !important; }
          .print-header { display: block !important; }
          .print-footer { display: block !important; position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding: 6px 0; }
          .print-section { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; border: 1px solid #e5e7eb; margin-bottom: 12pt; }
          .print-section h3 { font-size: 13pt; }
          table { font-size: 9pt; }
          th, td { padding: 3px 6px !important; }
        }
      `}</style>

      {/* Print-only header */}
      <div className="print-header hidden">
        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '4pt' }}>
          Guyana HomeHub &mdash; Diaspora Housing Index
        </h1>
        <p style={{ textAlign: 'center', fontSize: '10pt', color: '#666', marginBottom: '12pt' }}>
          {report ? `${report.dateFrom} to ${report.dateTo}` : ''} &bull; Generated{' '}
          {report ? new Date(report.generatedAt).toLocaleDateString() : ''}
        </p>
      </div>

      {/* Print-only footer */}
      <div className="print-footer hidden">
        Confidential &mdash; {report ? `${report.dateFrom} to ${report.dateTo}` : ''}
      </div>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header + controls */}
          <div className="no-print mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Report Export</h1>
            <p className="text-gray-500 text-sm">Diaspora Housing Index — {user?.email}</p>
          </div>

          {/* Date pickers + buttons */}
          <div className="bg-white rounded-lg shadow p-5 mb-6 no-print">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={runReport}
                disabled={loading}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Running...' : 'Run Report'}
              </button>

              {report && (
                <>
                  <button
                    onClick={() => downloadJSON(report)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Download JSON
                  </button>
                  <button
                    onClick={() => downloadCSV(report)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Download CSV
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Print Report
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 text-sm no-print">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-3 text-gray-500 text-sm">Generating report...</p>
            </div>
          )}

          {/* Report sections */}
          {report && (
            <div className="space-y-6">
              {/* Summary bar */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 no-print">
                {report.totalProperties} properties found between {report.dateFrom} and {report.dateTo}.
                Generated {new Date(report.generatedAt).toLocaleString()}.
              </div>

              {/* (a) Listings by Status */}
              <SectionCard title="a. Listings by Status">
                <DataTable
                  headers={['Status', 'Count']}
                  rows={report.a_statusCounts.map((r) => [r.status, fmt(r.count)])}
                />
              </SectionCard>

              {/* (b) By Property Type */}
              <SectionCard title="b. By Property Type">
                <DataTable
                  headers={['Type', 'Listing Type', 'Count', 'Avg USD', 'Median USD']}
                  rows={report.b_typeStats.map((r) => [
                    r.property_type,
                    fmtListingType(r.listing_type),
                    fmt(r.count),
                    fmtUsd(r.avg_usd),
                    fmtUsd(r.median_usd),
                  ])}
                />
              </SectionCard>

              {/* (b2) Listings by Transaction Type */}
              <SectionCard title="b2. Listings by Transaction Type">
                <DataTable
                  headers={['Transaction Type', 'Count', 'Avg USD', 'Median USD']}
                  rows={report.b2_transactionStats.map((r) => [
                    fmtListingType(r.listing_type),
                    fmt(r.count),
                    fmtUsd(r.avg_usd),
                    fmtUsd(r.median_usd),
                  ])}
                />
              </SectionCard>

              {/* (c) By Region */}
              <SectionCard title="c. By Region">
                <DataTable
                  headers={['Region', 'Listing Type', 'Count', 'Total Views', 'Avg USD']}
                  rows={report.c_regionStats.map((r) => [
                    r.name,
                    fmtListingType(r.listing_type),
                    fmt(r.count),
                    fmt(r.total_views),
                    fmtUsd(r.avg_usd),
                  ])}
                />
              </SectionCard>

              {/* (d) Top 10 Most Viewed */}
              <SectionCard title="d. Top 10 Most Viewed">
                <DataTable
                  headers={['Title', 'Region', 'Type', 'Listing', 'USD Price', 'Price', 'Currency', 'Views', '30d Views']}
                  rows={report.d_topViewed.map((r) => [
                    r.title,
                    r.region,
                    r.property_type,
                    fmtListingType(r.listing_type),
                    r.usd_price ? fmtUsd(r.usd_price) : '—',
                    fmt(r.price),
                    r.currency,
                    fmt(r.views),
                    r.view_count_30d !== null ? fmt(r.view_count_30d) : '—',
                  ])}
                />
              </SectionCard>

              {/* (e) Price Distribution — Sale */}
              <SectionCard title="e. For Sale — Price Distribution (USD)">
                <DataTable
                  headers={['Bucket', 'Count']}
                  rows={report.e_saleBuckets.map((r) => [r.label, fmt(r.count)])}
                />
              </SectionCard>

              {/* (e) Price Distribution — Rent */}
              <SectionCard title="e. For Rent — Price Distribution (USD monthly)">
                <DataTable
                  headers={['Bucket', 'Count']}
                  rows={report.e_rentBuckets.map((r) => [r.label, fmt(r.count)])}
                />
              </SectionCard>

              {/* (f) Amenity Frequency */}
              <SectionCard title="f. Amenity Frequency">
                <DataTable
                  headers={['Amenity', 'Count', '%']}
                  rows={report.f_amenityFreq.map((r) => [r.amenity, fmt(r.count), `${r.pct}%`])}
                />
              </SectionCard>

              {/* (g) New Listings per Month */}
              <SectionCard title="g. New Listings per Month">
                <DataTable
                  headers={['Month', 'Count']}
                  rows={report.g_monthlyNew.map((r) => [r.month, fmt(r.count)])}
                />
              </SectionCard>

              {/* (h) Sold in Period */}
              <SectionCard title="h. Sold in Period">
                <DataTable
                  headers={['Title', 'Region', 'Price', 'Currency', 'Sold Date']}
                  rows={report.h_soldInPeriod.map((r) => [
                    r.title,
                    regionName(r.region),
                    fmt(r.price),
                    r.currency,
                    r.status_changed_at ? new Date(r.status_changed_at).toLocaleDateString() : '—',
                  ])}
                />
              </SectionCard>

              {/* (i) Currency Summary */}
              <SectionCard title="i. Currency Summary">
                <DataTable
                  headers={['Currency', 'Count', 'Average', 'Median']}
                  rows={report.i_currencySummary.map((r) => [
                    r.currency,
                    fmt(r.count),
                    r.currency === 'USD' ? fmtUsd(r.avg) : `GY$${fmt(Math.round(r.avg))}`,
                    r.currency === 'USD' ? fmtUsd(r.median) : `GY$${fmt(Math.round(r.median))}`,
                  ])}
                />
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
