'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/supabase';

const SUPER_ADMINS = ['mrdarrenbuckner@gmail.com'];

interface Lead {
  id: string;
  agent_id: string | null;
  agent_slug: string | null;
  type: string | null;
  name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  listing_intent: string | null;
  property_type: string | null;
  region: string | null;
  location: string | null;
  asking_price: string | null;
  message: string | null;
  referred_name: string | null;
  referred_contact: string | null;
  territory: string | null;
  source: string | null;
  status: string | null;
  released_to_agent: boolean | null;
  released_at: string | null;
  deleted_at: string | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string | null;
}

type FilterTab = 'all' | 'new' | 'held' | 'released' | 'deleted';

function titleCase(value: string | null | undefined): string {
  if (!value) return '';
  return value
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const STATUS_BADGE: Record<string, string> = {
  new: 'bg-emerald-100 text-emerald-700',
  contacted: 'bg-blue-100 text-blue-700',
  qualified: 'bg-amber-100 text-amber-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-gray-100 text-gray-600',
};

function isDeleted(l: Lead): boolean {
  return l.deleted_at != null;
}
function isHeld(l: Lead): boolean {
  return !isDeleted(l) && l.released_to_agent === false;
}

export default function AdminLeadsPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [canMutate, setCanMutate] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/listing-inquiries');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to load leads');
      setLeads(result.leads || []);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to load leads' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setAuthLoading(false);
          return;
        }
        const emailMatch = SUPER_ADMINS.includes(user.email?.toLowerCase() || '');
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, admin_level')
          .eq('id', user.id)
          .single();

        const isAdmin = emailMatch || profile?.user_type === 'admin';
        const isMutator = emailMatch || (profile?.user_type === 'admin' && ['super', 'owner'].includes(profile?.admin_level));
        setAuthorized(isAdmin);
        setCanMutate(!!isMutator);
        if (isAdmin) loadLeads();
      } catch {
        setAuthorized(false);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [loadLeads]);

  async function mutate(lead: Lead, init: RequestInit, successText: string) {
    setBusyId(lead.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/listing-inquiries/${lead.id}`, init);
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Action failed');
      setMessage({ type: 'success', text: successText });
      await loadLeads();
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setBusyId(null);
    }
  }

  const setVisibility = (lead: Lead, released: boolean) =>
    mutate(
      lead,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ released_to_agent: released }) },
      released ? 'Lead shown to agent.' : 'Lead hidden from agent.'
    );
  const softDelete = (lead: Lead) => {
    if (!confirm('Soft-delete this lead? It will be hidden from the agent and recoverable here.')) return;
    return mutate(lead, { method: 'DELETE' }, 'Lead deleted.');
  };
  const restore = (lead: Lead) =>
    mutate(
      lead,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: true }) },
      'Lead restored.'
    );

  const counts: Record<FilterTab, number> = {
    all: leads.filter((l) => !isDeleted(l)).length,
    new: leads.filter((l) => !isDeleted(l) && l.status === 'new').length,
    held: leads.filter((l) => isHeld(l)).length,
    released: leads.filter((l) => !isDeleted(l) && l.released_to_agent !== false).length,
    deleted: leads.filter((l) => isDeleted(l)).length,
  };
  const filtered = leads.filter((l) => {
    switch (activeTab) {
      case 'all': return !isDeleted(l);
      case 'new': return !isDeleted(l) && l.status === 'new';
      case 'held': return isHeld(l);
      case 'released': return !isDeleted(l) && l.released_to_agent !== false;
      case 'deleted': return isDeleted(l);
      default: return true;
    }
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-sm">
          <div className="text-red-500 text-5xl mb-4">&#x1F6AB;</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 text-sm">Admin privileges required to access this page.</p>
          <button
            onClick={() => (window.location.href = '/')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const TABS: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'new', label: 'New' },
    { key: 'held', label: 'Held' },
    { key: 'released', label: 'Released' },
    { key: 'deleted', label: 'Deleted' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Leads (Admin)</h1>
          <p className="text-sm text-gray-500">
            All listing inquiries across agents. Hide / show / delete control what each agent sees.
            {!canMutate && ' (View-only — super/owner admins can take actions.)'}
          </p>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-6 border-b pb-3">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {tab.label} ({counts[tab.key]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
            <p className="mt-3 text-gray-500 text-sm">Loading leads...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-500">No leads in this view.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Agent</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Interest</th>
                    <th className="px-4 py-3">Region</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Visibility</th>
                    <th className="px-4 py-3">Received</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((lead) => {
                    const deleted = isDeleted(lead);
                    const held = isHeld(lead);
                    return (
                      <tr key={lead.id} className={`hover:bg-gray-50 ${deleted ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 max-w-[200px]">
                          <span className="font-semibold text-gray-900 block truncate" title={lead.message || ''}>{lead.name || '-'}</span>
                          {lead.referred_name && <span className="text-xs text-gray-500 block">Referring: {lead.referred_name}</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{lead.agent_slug || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${(lead.type || '').toLowerCase() === 'referral' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {(lead.type || '').toLowerCase() === 'referral' ? 'Referral' : 'Seller'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {[titleCase(lead.listing_intent), titleCase(lead.property_type)].filter(Boolean).join(' · ') || '-'}
                        </td>
                        <td className="px-4 py-3 text-gray-500">{lead.region || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[lead.status || 'new'] || 'bg-gray-100 text-gray-600'}`}>
                            {titleCase(lead.status || 'new')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {deleted ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Deleted</span>
                          ) : held ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">Held</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Released</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(lead.created_at)}</td>
                        <td className="px-4 py-3">
                          {canMutate ? (
                            <div className="flex items-center gap-2">
                              {deleted ? (
                                <button
                                  disabled={busyId === lead.id}
                                  onClick={() => restore(lead)}
                                  className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                                >
                                  Restore
                                </button>
                              ) : (
                                <>
                                  {held ? (
                                    <button
                                      disabled={busyId === lead.id}
                                      onClick={() => setVisibility(lead, true)}
                                      className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
                                    >
                                      Show
                                    </button>
                                  ) : (
                                    <button
                                      disabled={busyId === lead.id}
                                      onClick={() => setVisibility(lead, false)}
                                      className="px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                                    >
                                      Hide
                                    </button>
                                  )}
                                  <button
                                    disabled={busyId === lead.id}
                                    onClick={() => softDelete(lead)}
                                    className="px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
