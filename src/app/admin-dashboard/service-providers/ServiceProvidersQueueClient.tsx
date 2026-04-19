'use client';

import React, { useEffect, useState } from 'react';

type TabKey = 'pending' | 'approved' | 'verified' | 'rejected';

interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  website: string | null;
  address: string | null;
  source: string | null;
  status: string;
  verified: boolean;
  featured: boolean;
  approved_at: string | null;
  verified_at: string | null;
  rejected_at: string | null;
  rejected_reason: string | null;
  created_at: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  'real-estate-agents': 'Real Estate Agents',
  'renovations': 'Renovations & Repairs',
  'electrical': 'Electrical & Plumbing',
  'interior': 'Interior & Furniture',
  'landscaping': 'Landscaping & Garden',
  'building-materials': 'Building Materials & Hardware',
  'moving-storage': 'Moving & Storage',
  'cleaning': 'Cleaning Services',
  'security': 'Security & Safety',
  'legal-financial': 'Legal & Financial',
  'insurance': 'Insurance & Banking',
  'inspection': 'Inspection Services',
  'photography-media': 'Photography & Media',
  'general-contractors': 'General Contractors',
};

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'verified', label: 'Verified' },
  { key: 'rejected', label: 'Rejected' },
];

export default function ServiceProvidersQueueClient() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [rows, setRows] = useState<ServiceProvider[]>([]);
  const [counts, setCounts] = useState<Record<TabKey, number>>({
    pending: 0,
    approved: 0,
    verified: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ServiceProvider | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [verifyTarget, setVerifyTarget] = useState<ServiceProvider | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/service-providers', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const all: ServiceProvider[] = data.providers || [];

      const counted: Record<TabKey, number> = {
        pending: 0,
        approved: 0,
        verified: 0,
        rejected: 0,
      };
      for (const p of all) {
        if (p.status === 'pending') counted.pending++;
        else if (p.status === 'rejected') counted.rejected++;
        else if (p.status === 'active' && p.verified) counted.verified++;
        else if (p.status === 'active') counted.approved++;
      }
      setCounts(counted);
      setRows(all);
    } catch (err: any) {
      console.error('Failed to load service providers:', err);
      setErrorMsg('Failed to load queue. Check connection and retry.');
    } finally {
      setLoading(false);
    }
  }

  const visibleRows = rows.filter((r) => {
    if (activeTab === 'pending') return r.status === 'pending';
    if (activeTab === 'rejected') return r.status === 'rejected';
    if (activeTab === 'verified') return r.status === 'active' && r.verified;
    return r.status === 'active' && !r.verified;
  });

  async function callAction(
    id: string,
    action: 'approve' | 'verify' | 'reject' | 'feature',
    body?: Record<string, unknown>
  ) {
    setActionLoadingId(id);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/admin/service-providers/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      await loadAll();
    } catch (err: any) {
      console.error(`Action ${action} failed:`, err);
      setErrorMsg(err.message || `Failed to ${action}.`);
    } finally {
      setActionLoadingId(null);
    }
  }

  function openReject(row: ServiceProvider) {
    setRejectTarget(row);
    setRejectReason('');
  }

  async function submitReject() {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) {
      setErrorMsg('Rejection reason must be at least 5 characters.');
      return;
    }
    await callAction(rejectTarget.id, 'reject', { reason: rejectReason.trim() });
    setRejectTarget(null);
    setRejectReason('');
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === t.key
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
              <span
                className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === t.key
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {counts[t.key]}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 rounded-full border-b-2 border-emerald-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading queue…</p>
        </div>
      )}

      {!loading && visibleRows.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          No {activeTab} submissions.
        </div>
      )}

      {!loading && visibleRows.length > 0 && (
        <div className="space-y-4">
          {visibleRows.map((row) => (
            <div key={row.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{row.name}</h3>
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                      {CATEGORY_LABELS[row.category] || row.category}
                    </span>
                    {row.verified && (
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-medium px-2 py-0.5 rounded">
                        ✓ Verified
                      </span>
                    )}
                    {row.featured && (
                      <span className="inline-block bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded">
                        ★ Featured
                      </span>
                    )}
                  </div>
                  {row.description && (
                    <p className="text-sm text-gray-600 mb-2">{row.description}</p>
                  )}
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    {row.email && (
                      <div>
                        <dt className="inline text-gray-500">Email: </dt>
                        <dd className="inline text-gray-700">{row.email}</dd>
                      </div>
                    )}
                    {row.phone && (
                      <div>
                        <dt className="inline text-gray-500">Phone: </dt>
                        <dd className="inline text-gray-700">{row.phone}</dd>
                      </div>
                    )}
                    {row.website && (
                      <div>
                        <dt className="inline text-gray-500">Web: </dt>
                        <dd className="inline text-gray-700 break-all">{row.website}</dd>
                      </div>
                    )}
                    {row.address && (
                      <div>
                        <dt className="inline text-gray-500">Area: </dt>
                        <dd className="inline text-gray-700">{row.address}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span>Source: {row.source || 'unknown'}</span>
                    <span>Submitted: {formatDate(row.created_at)}</span>
                    {row.approved_at && <span>Approved: {formatDate(row.approved_at)}</span>}
                    {row.verified_at && <span>Verified: {formatDate(row.verified_at)}</span>}
                    {row.rejected_at && <span>Rejected: {formatDate(row.rejected_at)}</span>}
                  </div>
                  {row.rejected_reason && (
                    <p className="mt-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded p-2">
                      <span className="font-medium">Reason:</span> {row.rejected_reason}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  {row.status === 'pending' && (
                    <>
                      <button
                        onClick={() => callAction(row.id, 'approve')}
                        disabled={actionLoadingId === row.id}
                        className="px-4 py-2 border-2 border-emerald-600 text-emerald-700 text-sm font-semibold rounded-lg hover:bg-emerald-50 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => setVerifyTarget(row)}
                        disabled={actionLoadingId === row.id}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verify
                      </button>
                      <button
                        onClick={() => openReject(row)}
                        disabled={actionLoadingId === row.id}
                        className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {row.status === 'active' && !row.verified && (
                    <>
                      <button
                        onClick={() => callAction(row.id, 'verify')}
                        disabled={actionLoadingId === row.id}
                        className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Verify
                      </button>
                      <button
                        onClick={() => callAction(row.id, 'feature', { featured: !row.featured })}
                        disabled={actionLoadingId === row.id}
                        className="px-4 py-2 border border-amber-500 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-50 disabled:opacity-50"
                      >
                        {row.featured ? 'Unfeature' : 'Feature'}
                      </button>
                    </>
                  )}
                  {row.status === 'active' && row.verified && (
                    <button
                      onClick={() => callAction(row.id, 'feature', { featured: !row.featured })}
                      disabled={actionLoadingId === row.id}
                      className="px-4 py-2 border border-amber-500 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-50 disabled:opacity-50"
                    >
                      {row.featured ? 'Unfeature' : 'Feature'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verify-from-Pending confirmation modal */}
      {verifyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Approve AND verify?</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will approve AND verify <span className="font-semibold">{verifyTarget.name}</span>. Continue?
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Use Verify only after you have spoken to the business by phone and confirmed it is operating. Use Approve instead if you only want it listed without the verified badge.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setVerifyTarget(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = verifyTarget.id;
                  setVerifyTarget(null);
                  await callAction(id, 'verify');
                }}
                disabled={actionLoadingId === verifyTarget.id}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Approve &amp; Verify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Reject submission</h2>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting <span className="font-semibold">{rejectTarget.name}</span>. Reason is required and will be stored in the audit trail.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              placeholder="e.g., Duplicate of existing listing #1234 / spam / category fraud / business not in Guyana"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={rejectReason.trim().length < 5 || actionLoadingId === rejectTarget.id}
                className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Reject submission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
