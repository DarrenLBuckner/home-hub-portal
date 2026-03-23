'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/supabase';
import { User } from '@supabase/supabase-js';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ── Constants ──────────────────────────────────────────────

const SUPER_ADMINS = ['mrdarrenbuckner@gmail.com'];

// ── Types ──────────────────────────────────────────────────

interface ContactSummary {
  whatsapp: number;
  phone: number;
  email: number;
  request_viewing: number;
}

interface TopContactedProperty {
  property_id: string;
  title: string;
  city: string;
  listing_type: string;
  agent_name: string;
  whatsapp: number;
  phone: number;
  email: number;
  request_viewing: number;
  total: number;
}

interface TopViewedProperty {
  property_id: string;
  title: string;
  city: string;
  listing_type: string;
  agent_name: string;
  total_views: number;
  last_viewed: string;
}

interface ViewDay {
  date: string;
  count: number;
}

interface ReportData {
  contactSummary: ContactSummary;
  topContacted: TopContactedProperty[];
  topViewed: TopViewedProperty[];
  viewsOverTime: ViewDay[];
}

// ── Helpers ────────────────────────────────────────────────

function thirtyDaysAgo(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function fmtListingType(lt: string): string {
  if (lt === 'rent') return 'For Rent';
  if (lt === 'sale') return 'For Sale';
  if (lt === 'lease') return 'For Lease';
  return lt || '—';
}

// ── CSV Export ─────────────────────────────────────────────

function downloadContactedCSV(data: TopContactedProperty[], dateFrom: string, dateTo: string) {
  const rows: string[] = [];
  rows.push('Property Title,City,Listing Type,Agent Name,WhatsApp,Viewing Req,Phone,Email,Total');
  data.forEach(r =>
    rows.push(`"${r.title}","${r.city}",${fmtListingType(r.listing_type)},"${r.agent_name}",${r.whatsapp},${r.request_viewing},${r.phone},${r.email},${r.total}`)
  );
  triggerDownload(rows.join('\n'), `top-contacted-${dateFrom}-to-${dateTo}.csv`);
}

function downloadViewedCSV(data: TopViewedProperty[], dateFrom: string, dateTo: string) {
  const rows: string[] = [];
  rows.push('Property Title,City,Listing Type,Agent Name,Total Views,Last Viewed');
  data.forEach(r =>
    rows.push(`"${r.title}","${r.city}",${fmtListingType(r.listing_type)},"${r.agent_name}",${r.total_views},${r.last_viewed ? new Date(r.last_viewed).toLocaleDateString() : '—'}`)
  );
  triggerDownload(rows.join('\n'), `top-viewed-${dateFrom}-to-${dateTo}.csv`);
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Section Components ─────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-lg shadow p-5 print-section">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {headers.map(h => (
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-5 text-center">
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────

export default function EngagementReportPage() {
  const supabase = createClient();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Report state
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgo);
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

      const emailMatch = SUPER_ADMINS.includes(user.email?.toLowerCase() || '');

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
      const res = await fetch(`/api/admin/engagement?from=${dateFrom}&to=${dateTo}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      const data: ReportData = await res.json();
      setReport(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }

  // ── Access denied / loading ────────────────────────────

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────

  const contactTotal = report
    ? report.contactSummary.whatsapp + report.contactSummary.phone + report.contactSummary.email + report.contactSummary.request_viewing
    : 0;
  const hasContactData = contactTotal > 0;

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-section { page-break-inside: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header + controls */}
          <div className="mb-6 no-print">
            <h1 className="text-2xl font-bold text-gray-900">Engagement Report</h1>
            <p className="text-sm text-gray-500 mt-1">Agent Contact Activity &amp; Property Views</p>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={runReport}
                disabled={loading}
                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Run Report'}
              </button>

              {report && (
                <>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Print Report
                  </button>
                  <button
                    onClick={() => downloadContactedCSV(report.topContacted, dateFrom, dateTo)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    CSV: Contacted
                  </button>
                  <button
                    onClick={() => downloadViewedCSV(report.topViewed, dateFrom, dateTo)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    CSV: Viewed
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

              {/* Section A — Contact Activity Summary */}
              <SectionCard title="A. Contact Activity Summary">
                {!hasContactData && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-amber-800 text-sm">
                    Contact tracking is now active. Data will appear as buyers interact with listings.
                  </div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="WhatsApp Clicks" value={hasContactData ? fmt(report.contactSummary.whatsapp) : '--'} />
                  <StatCard label="Viewing Requests" value={hasContactData ? fmt(report.contactSummary.request_viewing) : '--'} />
                  <StatCard label="Phone Clicks" value={hasContactData ? fmt(report.contactSummary.phone) : '--'} />
                  <StatCard label="Email Clicks" value={hasContactData ? fmt(report.contactSummary.email) : '--'} />
                </div>
              </SectionCard>

              {/* Section B — Top 10 Most Contacted Properties */}
              <SectionCard title="B. Top 10 Most Contacted Properties">
                <DataTable
                  headers={['Property Title', 'City', 'Listing Type', 'Agent Name', 'WhatsApp', 'Viewing Req', 'Phone', 'Email', 'Total']}
                  rows={report.topContacted.map(r => [
                    r.title,
                    r.city,
                    fmtListingType(r.listing_type),
                    r.agent_name,
                    fmt(r.whatsapp),
                    fmt(r.request_viewing),
                    fmt(r.phone),
                    fmt(r.email),
                    fmt(r.total),
                  ])}
                />
              </SectionCard>

              {/* Section C — Top 10 Most Viewed Properties */}
              <SectionCard title="C. Top 10 Most Viewed Properties">
                <DataTable
                  headers={['Property Title', 'City', 'Listing Type', 'Agent Name', 'Total Views', 'Last Viewed']}
                  rows={report.topViewed.map(r => [
                    r.title,
                    r.city,
                    fmtListingType(r.listing_type),
                    r.agent_name,
                    fmt(r.total_views),
                    r.last_viewed ? new Date(r.last_viewed).toLocaleDateString() : '—',
                  ])}
                />
              </SectionCard>

              {/* Section D — Views Over Time */}
              <SectionCard title="D. Views Over Time">
                {report.viewsOverTime.length > 0 ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report.viewsOverTime}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          tickFormatter={d => {
                            const parts = d.split('-');
                            return `${parts[1]}/${parts[2]}`;
                          }}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={d => new Date(d + 'T00:00:00').toLocaleDateString()}
                          formatter={(value) => [fmt(Number(value)), 'Views']}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No view data for this date range.</p>
                )}
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
