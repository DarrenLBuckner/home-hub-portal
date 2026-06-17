'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/supabase';

// Inline SVG icons — no icon library in this repo (matches listings/page.tsx)
function WhatsAppIcon({ className }: { className?: string }) {
  return <svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.515 5.26l-.999 3.648 3.742-.957zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>;
}
function PhoneIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
}
function CloseIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
}
function InboxIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
}

// Status workflow — kept as free text in the DB (default 'new'); validated here.
const STATUS_FLOW = ['new', 'contacted', 'qualified', 'won', 'lost'] as const;
type LeadStatus = (typeof STATUS_FLOW)[number];

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-amber-100 text-amber-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-600',
};

type FilterTab = 'all' | LeadStatus;
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

interface Lead {
  id: string;
  agent_slug: string | null;
  type: string | null; // 'seller' | 'referral'
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  listing_intent: string | null;
  property_type: string | null;
  region: string | null;
  location: string | null;
  asking_price: string | null;
  timeline: string | null;
  message: string | null;
  referred_name: string | null;
  referred_contact: string | null;
  territory: string | null;
  source: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
}

const LEAD_COLUMNS =
  'id, agent_slug, type, name, phone, whatsapp, email, listing_intent, property_type, region, location, asking_price, timeline, message, referred_name, referred_contact, territory, source, status, created_at, updated_at';

function digitsOnly(value: string | null | undefined): string {
  return (value || '').replace(/\D/g, '');
}

function titleCase(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function isReferral(lead: Lead): boolean {
  return (lead.type || '').toLowerCase() === 'referral';
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// Native relative-time — no date library in this repo.
function relativeTime(dateStr: string): string {
  const then = new Date(dateStr).getTime();
  const diffMs = Date.now() - then;
  const min = Math.round(diffMs / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AgentLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selected, setSelected] = useState<Lead | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = '/login';
        return;
      }

      // No manual agent_id filter: RLS (listing_inquiries_agent_select =
      // agent_id = auth.uid()) is the security boundary and auto-scopes this
      // to the logged-in agent's own leads.
      const { data } = await supabase
        .from('listing_inquiries')
        .select(LEAD_COLUMNS)
        .order('created_at', { ascending: false });

      setLeads((data as Lead[]) || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  async function updateStatus(lead: Lead, next: LeadStatus) {
    if (!STATUS_FLOW.includes(next) || lead.status === next) return;
    setSavingId(lead.id);
    const supabase = createClient();
    const updatedAt = new Date().toISOString();
    // RLS listing_inquiries_agent_update (agent_id = auth.uid()) authorizes this.
    const { error } = await supabase
      .from('listing_inquiries')
      .update({ status: next, updated_at: updatedAt })
      .eq('id', lead.id);
    setSavingId(null);
    if (error) {
      alert('Could not update status. Please try again.');
      return;
    }
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: next, updated_at: updatedAt } : l)));
    setSelected((prev) => (prev && prev.id === lead.id ? { ...prev, status: next, updated_at: updatedAt } : prev));
  }

  const tabCounts: Record<FilterTab, number> = {
    all: leads.length,
    new: leads.filter((l) => l.status === 'new').length,
    contacted: leads.filter((l) => l.status === 'contacted').length,
    qualified: leads.filter((l) => l.status === 'qualified').length,
    won: leads.filter((l) => l.status === 'won').length,
    lost: leads.filter((l) => l.status === 'lost').length,
  };
  const visibleTabs = FILTER_TABS.filter((t) => t.key === 'all' || tabCounts[t.key] > 0);
  const filtered = activeTab === 'all' ? leads : leads.filter((l) => l.status === activeTab);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Back link */}
        <div className="mb-4">
          <Link href="/dashboard/agent" className="text-emerald-600 hover:underline text-sm">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">Seller &amp; referral inquiries captured from your agent site.</p>
        </div>

        {/* Tabs */}
        {leads.length > 0 && (
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
        {leads.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <InboxIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-1">No leads yet</p>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              When someone submits a seller or referral inquiry from your agent site, it will appear here &mdash;
              and open their WhatsApp at the same time.
            </p>
          </div>
        )}

        {/* Desktop table */}
        {filtered.length > 0 && (
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Interest</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((lead) => {
                    const wa = digitsOnly(lead.whatsapp || lead.phone);
                    const isNew = lead.status === 'new';
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelected(lead)}
                        className={`cursor-pointer hover:bg-gray-50 transition-colors ${isNew ? 'bg-emerald-50/40' : ''}`}
                      >
                        <td className="px-4 py-3 max-w-[200px]">
                          <span className="font-semibold text-gray-900 truncate flex items-center gap-2">
                            {isNew && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-label="new" />}
                            {lead.name || '-'}
                          </span>
                          {isReferral(lead) && lead.referred_name && (
                            <span className="text-xs text-gray-500 block">Referring: {lead.referred_name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${isReferral(lead) ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {isReferral(lead) ? 'Referral' : 'Seller'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {[titleCase(lead.listing_intent), titleCase(lead.property_type)].filter(Boolean).join(' · ') || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{lead.region || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{relativeTime(lead.created_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[lead.status || 'new'] || 'bg-gray-100 text-gray-600'}`}>
                            {titleCase(lead.status || 'new')}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            {wa && (
                              <a
                                href={`https://wa.me/${wa}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                <WhatsAppIcon className="w-3.5 h-3.5" />
                                WhatsApp
                              </a>
                            )}
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <PhoneIcon className="w-3.5 h-3.5" />
                                Call
                              </a>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile cards */}
        {filtered.length > 0 && (
          <div className="md:hidden space-y-3">
            {filtered.map((lead) => {
              const wa = digitsOnly(lead.whatsapp || lead.phone);
              const isNew = lead.status === 'new';
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelected(lead)}
                  className={`bg-white rounded-xl shadow-sm p-4 ${isNew ? 'ring-1 ring-emerald-200' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                      {isNew && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-label="new" />}
                      {lead.name || '-'}
                    </h3>
                    <span className={`shrink-0 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[lead.status || 'new'] || 'bg-gray-100 text-gray-600'}`}>
                      {titleCase(lead.status || 'new')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${isReferral(lead) ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isReferral(lead) ? 'Referral' : 'Seller'}
                    </span>
                    <span className="text-xs text-gray-500">{relativeTime(lead.created_at)}</span>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1 mb-3">
                    {[titleCase(lead.listing_intent), titleCase(lead.property_type)].filter(Boolean).length > 0 && (
                      <p>{[titleCase(lead.listing_intent), titleCase(lead.property_type)].filter(Boolean).join(' · ')}</p>
                    )}
                    {lead.region && <p>{lead.region}</p>}
                    {isReferral(lead) && lead.referred_name && <p>Referring: {lead.referred_name}</p>}
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {wa && (
                      <a
                        href={`https://wa.me/${wa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    )}
                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <PhoneIcon className="w-3.5 h-3.5" />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail modal — reuses the already-loaded row (no extra fetch) */}
      {selected && (
        <LeadDetail
          lead={selected}
          saving={savingId === selected.id}
          onStatusChange={(next) => updateStatus(selected, next)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === '') return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-3 py-2 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function LeadDetail({
  lead,
  saving,
  onStatusChange,
  onClose,
}: {
  lead: Lead;
  saving: boolean;
  onStatusChange: (next: LeadStatus) => void;
  onClose: () => void;
}) {
  const referral = isReferral(lead);
  const wa = digitsOnly(lead.whatsapp || lead.phone);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-2xl shadow-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-semibold text-gray-900">{lead.name || 'Lead'}</h2>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${referral ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                {referral ? 'Referral' : 'Seller'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Received {formatDateTime(lead.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 shrink-0" aria-label="Close">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Quick actions */}
          <div className="flex items-center gap-2 mb-4">
            {wa && (
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                <WhatsAppIcon className="w-4 h-4" />
                WhatsApp
              </a>
            )}
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <PhoneIcon className="w-4 h-4" />
                Call
              </a>
            )}
          </div>

          {/* Status workflow */}
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FLOW.map((s) => {
                const active = (lead.status || 'new') === s;
                return (
                  <button
                    key={s}
                    disabled={saving || active}
                    onClick={() => onStatusChange(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:cursor-default ${
                      active
                        ? `${STATUS_BADGE[s]} ring-1 ring-inset ring-current`
                        : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    {titleCase(s)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <dl>
            {referral ? (
              <>
                <DetailRow label="Referred by" value={lead.name} />
                <DetailRow label="Referrer phone" value={lead.phone} />
                <DetailRow label="Referrer WhatsApp" value={lead.whatsapp} />
                <DetailRow label="Lead name" value={lead.referred_name} />
                <DetailRow label="Lead contact" value={lead.referred_contact} />
              </>
            ) : (
              <>
                <DetailRow label="Phone" value={lead.phone} />
                <DetailRow label="WhatsApp" value={lead.whatsapp} />
                <DetailRow label="Email" value={lead.email} />
              </>
            )}
            <DetailRow label="Intent" value={titleCase(lead.listing_intent)} />
            <DetailRow label="Property type" value={titleCase(lead.property_type)} />
            <DetailRow label="Region" value={lead.region} />
            <DetailRow label="Location" value={lead.location} />
            <DetailRow label="Asking price" value={lead.asking_price} />
            <DetailRow label="Timeline" value={lead.timeline} />
            <DetailRow label="Message" value={lead.message} />
            <DetailRow label="Source" value={lead.source} />
            <DetailRow label="Territory" value={lead.territory} />
          </dl>
        </div>
      </div>
    </div>
  );
}
