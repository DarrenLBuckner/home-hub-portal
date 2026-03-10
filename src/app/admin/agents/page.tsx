'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/supabase';
import { User } from '@supabase/supabase-js';

// ── Constants ──────────────────────────────────────────────

const SUPER_ADMINS = ['mrdarrenbuckner@gmail.com'];

const REGION_MAP: Record<string, string> = {
  'GY-Georgetown': 'Georgetown',
  'GY-R4': 'East Bank Demerara',
  'GY-R3': 'West Demerara/Essequibo',
  'GY-R6': 'East Berbice-Corentyne',
  'GY-R2': 'Pomeroon-Supenaam',
  'GY-R4-Diamond': 'Diamond EBD',
};

// ── Types ──────────────────────────────────────────────────

interface Agent {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  license_number: string | null;
  years_active: number | null;
  brokerage_name: string | null;
  is_independent: boolean | null;
  languages: string[] | null;
  headshot_url: string | null;
  property_types: string[] | null;
  transaction_types: string[] | null;
  primary_regions: string[] | null;
  primary_neighborhoods: string[] | null;
  price_range_min_usd: number | null;
  price_range_max_usd: number | null;
  niche_expertise: string | null;
  buyer_types: string[] | null;
  diaspora_cities: string[] | null;
  community_ties: string | null;
  total_transactions: number | null;
  transactions_12mo: number | null;
  avg_days_to_close: number | null;
  notable_neighborhoods: string[] | null;
  certifications: string[] | null;
  awards: string | null;
  notable_transactions: string | null;
  phone: string | null;
  whatsapp: string | null;
  preferred_contact: string | null;
  headshot_url_display?: string;
  is_published: boolean;
  joined_at: string | null;
  profile_completeness: number | null;
  differentiation_flags: string | null;
  created_at: string;
}

type FilterTab = 'pending' | 'published' | 'rejected' | 'all';

// ── Helpers ────────────────────────────────────────────────

function regionNames(codes: string[] | null): string {
  if (!codes || codes.length === 0) return '—';
  return codes.map((c) => REGION_MAP[c] || c).join(', ');
}

function tags(items: string[] | null): string {
  if (!items || items.length === 0) return '—';
  return items.join(', ');
}

// ── Badge Component ────────────────────────────────────────

function StatusBadge({ agent }: { agent: Agent }) {
  if (agent.is_published) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Published</span>;
  }
  if (agent.differentiation_flags) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Needs Changes</span>;
  }
  if (agent.joined_at) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending Review</span>;
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Draft</span>;
}

function completenessColor(score: number | null): string {
  if (!score) return 'text-gray-400';
  if (score >= 70) return 'text-green-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-red-500';
}

// ── Main Page ──────────────────────────────────────────────

export default function AdminAgentsPage() {
  const supabase = createClient();

  // Auth
  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // Data
  const [agents, setAgents] = useState<Agent[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Detail / actions
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  // ── Auth ───────────────────────────────────────────────

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) { setAuthLoading(false); return; }
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

      const isAuthorized = emailMatch || profileMatch;
      setAuthorized(isAuthorized);
      if (isAuthorized) loadAgents();
    } catch {
      setAuthorized(false);
    } finally {
      setAuthLoading(false);
    }
  }

  // ── Load agents ────────────────────────────────────────

  async function loadAgents() {
    setDataLoading(true);
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('joined_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setAgents((data as Agent[]) || []);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setDataLoading(false);
    }
  }

  // ── Filtered list ──────────────────────────────────────

  const filteredAgents = agents.filter((a) => {
    // Tab filter
    if (filter === 'pending' && (a.is_published || a.differentiation_flags || !a.joined_at)) return false;
    if (filter === 'published' && !a.is_published) return false;
    if (filter === 'rejected' && !a.differentiation_flags) return false;

    // Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const match =
        a.email?.toLowerCase().includes(q) ||
        a.full_name?.toLowerCase().includes(q) ||
        a.display_name?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // ── Counts ─────────────────────────────────────────────

  const counts = {
    pending: agents.filter((a) => a.joined_at && !a.is_published && !a.differentiation_flags).length,
    published: agents.filter((a) => a.is_published).length,
    rejected: agents.filter((a) => !!a.differentiation_flags).length,
    all: agents.length,
  };

  // ── Actions ────────────────────────────────────────────

  async function handleApprove(agent: Agent) {
    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/agents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, action: 'approve' }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Approval failed');

      setActionMessage({ type: 'success', text: `${agent.full_name || agent.email} has been approved and notified by email.` });
      setSelectedAgent(null);
      loadAgents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(agent: Agent) {
    if (!rejectReason.trim()) return;

    setActionLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/agents/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agent.id, action: 'reject', rejectionReason: rejectReason }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.error || 'Rejection failed');

      setActionMessage({ type: 'success', text: `Feedback sent to ${agent.full_name || agent.email}.` });
      setSelectedAgent(null);
      setShowRejectModal(false);
      setRejectReason('');
      loadAgents();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Rejection failed';
      setActionMessage({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  }

  // ── Render: Auth states ────────────────────────────────

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
          body { background: white !important; font-size: 10pt; }
          nav, header, footer, .no-print { display: none !important; }
          .print-header { display: block !important; }
          .print-footer { display: block !important; position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 9pt; color: #666; border-top: 1px solid #ccc; padding: 6px 0; }
          .print-section { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; border: 1px solid #e5e7eb; }
          table { font-size: 9pt; }
          th, td { padding: 4px 8px !important; }
        }
      `}</style>

      {/* Print-only header */}
      <div className="print-header hidden">
        <h1 style={{ fontSize: '18pt', fontWeight: 'bold', textAlign: 'center', marginBottom: '4pt' }}>
          Guyana HomeHub &mdash; Agent Review Queue
        </h1>
      </div>

      {/* Print-only footer */}
      <div className="print-footer hidden">
        Printed {new Date().toLocaleDateString()}
      </div>

      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 no-print">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agent Review Queue</h1>
              <p className="text-gray-500 text-sm mt-0.5">Review and approve agent profiles from /agents/join</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Print
            </button>
          </div>

          {/* Action message */}
          {actionMessage && (
            <div
              className={`mb-4 px-4 py-3 rounded-lg text-sm no-print ${
                actionMessage.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {actionMessage.text}
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {([
              { key: 'pending' as FilterTab, label: 'Pending Review', color: 'text-yellow-600' },
              { key: 'published' as FilterTab, label: 'Published', color: 'text-green-600' },
              { key: 'rejected' as FilterTab, label: 'Needs Changes', color: 'text-red-600' },
              { key: 'all' as FilterTab, label: 'Total', color: 'text-blue-600' },
            ]).map((card) => (
              <button
                key={card.key}
                onClick={() => setFilter(card.key)}
                className={`bg-white rounded-lg shadow p-4 text-left transition-colors ${
                  filter === card.key ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <p className="text-xs uppercase text-gray-500">{card.label}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{counts[card.key]}</p>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mb-4 no-print">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Loading */}
          {dataLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          )}

          {/* Agent list */}
          {!dataLoading && (
            <div className="bg-white rounded-lg shadow overflow-hidden print-section">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Agent</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Regions</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Score</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600 no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgents.map((agent) => (
                      <tr key={agent.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {agent.headshot_url ? (
                              <img
                                src={agent.headshot_url}
                                alt=""
                                className="w-9 h-9 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">
                                —
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{agent.full_name || '(no name)'}</p>
                              <p className="text-xs text-gray-500">{agent.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 text-xs">{regionNames(agent.primary_regions)}</td>
                        <td className="px-4 py-3">
                          <span className={`font-semibold ${completenessColor(agent.profile_completeness)}`}>
                            {agent.profile_completeness ?? 0}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge agent={agent} />
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {agent.joined_at
                            ? new Date(agent.joined_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3 no-print">
                          <button
                            onClick={() => {
                              setSelectedAgent(agent);
                              setActionMessage(null);
                            }}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 rounded hover:bg-blue-100"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredAgents.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                          No agents in this view.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Detail Drawer ───────────────────────────────── */}
      {selectedAgent && !showRejectModal && (
        <div className="fixed inset-0 z-50 flex no-print">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedAgent(null)}
          />
          {/* Panel */}
          <div className="relative ml-auto w-full max-w-xl bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-900">Agent Review</h2>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Header card */}
              <div className="flex items-center gap-4">
                {selectedAgent.headshot_url ? (
                  <img
                    src={selectedAgent.headshot_url}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                    No photo
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedAgent.full_name || '(no name)'}
                  </h3>
                  {selectedAgent.display_name && (
                    <p className="text-sm text-gray-500">Display: {selectedAgent.display_name}</p>
                  )}
                  <p className="text-sm text-gray-500">{selectedAgent.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge agent={selectedAgent} />
                    <span className={`text-sm font-semibold ${completenessColor(selectedAgent.profile_completeness)}`}>
                      {selectedAgent.profile_completeness ?? 0}% complete
                    </span>
                  </div>
                </div>
              </div>

              {/* Previous rejection */}
              {selectedAgent.differentiation_flags && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-xs font-semibold text-red-700 mb-1">Previous Feedback</p>
                  <p className="text-sm text-red-800 whitespace-pre-line">{selectedAgent.differentiation_flags}</p>
                </div>
              )}

              {/* Sections */}
              <DetailSection title="About">
                <DetailRow label="License" value={selectedAgent.license_number} />
                <DetailRow label="Years active" value={selectedAgent.years_active?.toString()} />
                <DetailRow
                  label="Work type"
                  value={selectedAgent.is_independent ? 'Independent' : `Brokerage: ${selectedAgent.brokerage_name || '—'}`}
                />
                <DetailRow label="Languages" value={tags(selectedAgent.languages)} />
              </DetailSection>

              <DetailSection title="Specialization">
                <DetailRow label="Property types" value={tags(selectedAgent.property_types)} />
                <DetailRow label="Transaction" value={tags(selectedAgent.transaction_types)} />
                <DetailRow label="Regions" value={regionNames(selectedAgent.primary_regions)} />
                <DetailRow label="Neighborhoods" value={tags(selectedAgent.primary_neighborhoods)} />
                <DetailRow
                  label="Price range"
                  value={
                    selectedAgent.price_range_min_usd != null || selectedAgent.price_range_max_usd != null
                      ? `$${(selectedAgent.price_range_min_usd ?? 0).toLocaleString()} – $${(selectedAgent.price_range_max_usd ?? 0).toLocaleString()}`
                      : null
                  }
                />
                <DetailRow label="Niche" value={selectedAgent.niche_expertise} />
              </DetailSection>

              <DetailSection title="Who They Serve">
                <DetailRow label="Buyer types" value={tags(selectedAgent.buyer_types)} />
                <DetailRow label="Diaspora cities" value={tags(selectedAgent.diaspora_cities)} />
                <DetailRow label="Community ties" value={selectedAgent.community_ties} />
              </DetailSection>

              <DetailSection title="Track Record">
                <DetailRow label="Total transactions" value={selectedAgent.total_transactions?.toString()} />
                <DetailRow label="Last 12 months" value={selectedAgent.transactions_12mo?.toString()} />
                <DetailRow label="Avg days to close" value={selectedAgent.avg_days_to_close?.toString()} />
                <DetailRow label="Notable areas" value={tags(selectedAgent.notable_neighborhoods)} />
                <DetailRow label="Certifications" value={tags(selectedAgent.certifications)} />
                <DetailRow label="Awards" value={selectedAgent.awards} />
                <DetailRow label="Proud of" value={selectedAgent.notable_transactions} />
              </DetailSection>

              <DetailSection title="Contact">
                <DetailRow label="Phone" value={selectedAgent.phone} />
                <DetailRow label="Email" value={selectedAgent.email} />
                <DetailRow label="WhatsApp" value={selectedAgent.whatsapp} />
                <DetailRow label="Preferred" value={selectedAgent.preferred_contact} />
              </DetailSection>

              {/* Action buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                {!selectedAgent.is_published && (
                  <button
                    onClick={() => handleApprove(selectedAgent)}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 text-sm"
                  >
                    {actionLoading ? 'Processing...' : 'Approve & Publish'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                    setRejectReason(selectedAgent.differentiation_flags || '');
                  }}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 text-sm"
                >
                  Request Changes
                </button>
                {selectedAgent.is_published && (
                  <button
                    onClick={() => handleReject(selectedAgent)}
                    disabled={actionLoading || !selectedAgent.is_published}
                    className="flex-1 px-4 py-2.5 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 disabled:opacity-50 text-sm"
                  >
                    Unpublish
                  </button>
                )}
              </div>

              {/* Completeness warning */}
              {(selectedAgent.profile_completeness ?? 0) < 70 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-yellow-800 text-xs">
                    Profile is below 70% — not eligible for publishing even if approved. Agent should complete more sections first.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ────────────────────────────────── */}
      {showRejectModal && selectedAgent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center no-print">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowRejectModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Request Changes</h3>
            <p className="text-sm text-gray-500 mb-4">
              This feedback will be emailed to {selectedAgent.full_name || selectedAgent.email} and saved on their record.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
              placeholder="Explain what needs to be updated or corrected..."
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleReject(selectedAgent)}
                disabled={actionLoading || !rejectReason.trim()}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 text-sm"
              >
                {actionLoading ? 'Sending...' : 'Send Feedback'}
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Detail sub-components ──────────────────────────────────

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title}</h4>
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-gray-900">{value || '—'}</span>
    </div>
  );
}
