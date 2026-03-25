'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/supabase';
import { User } from '@supabase/supabase-js';

const SUPER_ADMINS = ['mrdarrenbuckner@gmail.com'];

interface Submission {
  id: string;
  name: string;
  category: string;
  email: string | null;
  phone: string | null;
  description: string | null;
  website: string | null;
  address: string | null;
  source: string | null;
  created_at: string;
}

export default function BusinessSubmissionsPage() {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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

      const isAuthorized = emailMatch || profileMatch;
      setAuthorized(isAuthorized);

      if (isAuthorized) {
        fetchSubmissions();
      }
    } catch {
      setAuthorized(false);
    } finally {
      setAuthLoading(false);
    }
  }

  async function fetchSubmissions() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/business-submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setActionLoading(id);
    try {
      const res = await fetch('/api/admin/business-submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      if (res.ok) {
        setSubmissions(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(null);
    }
  }

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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Business Submissions</h1>
          <p className="text-sm text-gray-500 mt-1">Review pending business directory submissions</p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-3 text-gray-500 text-sm">Loading submissions...</p>
          </div>
        )}

        {!loading && submissions.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No pending submissions.</p>
          </div>
        )}

        {!loading && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map(s => (
              <div key={s.id} className="bg-white rounded-lg shadow p-5">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {s.category}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-sm text-gray-600 mb-2">{s.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                      {s.email && <span>Email: {s.email}</span>}
                      {s.phone && <span>Phone: {s.phone}</span>}
                      {s.website && <span>Web: {s.website}</span>}
                      {s.address && <span>Area: {s.address}</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted {new Date(s.created_at).toLocaleDateString()} via {s.source || 'unknown'}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(s.id, 'approve')}
                      disabled={actionLoading === s.id}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(s.id, 'reject')}
                      disabled={actionLoading === s.id}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
