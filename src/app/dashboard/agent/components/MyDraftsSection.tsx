'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface DraftItem {
  id: string;
  title: string;
  summary: string;
  last_saved: string;
  created_at: string;
  expires_at: string;
  save_count: number;
  draft_type: string;
}

export default function MyDraftsSection() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const res = await fetch('/api/properties/drafts');
      const data = await res.json();
      if (data.success) {
        setDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error('Error loading drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this draft? This cannot be undone.')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/properties/drafts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error('Error deleting draft:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleContinueEditing = (draft: DraftItem) => {
    const route = draft.draft_type === 'fsbo'
      ? '/dashboard/owner/create-property'
      : '/dashboard/agent/create-property';
    router.push(`${route}?draft=${draft.id}`);
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
          <div className="h-16 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (drafts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-200">
      <div className="px-4 sm:px-6 py-4 border-b border-amber-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📝</span>
          <h2 className="text-lg font-semibold text-gray-900">
            My Drafts
            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-sm rounded-full">
              {drafts.length}
            </span>
          </h2>
        </div>
        <button
          onClick={() => router.push('/dashboard/drafts')}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View All →
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {drafts.slice(0, 5).map((draft) => {
          const daysLeft = getDaysUntilExpiry(draft.expires_at);
          const isUrgent = daysLeft <= 14;

          return (
            <div key={draft.id} className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {draft.title || 'Untitled Property'}
                  </h3>
                  <span className={`shrink-0 px-2 py-0.5 text-xs rounded-full ${
                    draft.draft_type === 'rent'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {draft.draft_type === 'rent' ? 'For Rent' : 'For Sale'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Updated {formatRelativeTime(draft.last_saved)}</span>
                  <span className="text-gray-300">|</span>
                  {isUrgent ? (
                    <span className="text-red-600 font-medium">
                      Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}!
                    </span>
                  ) : (
                    <span>{daysLeft} days left</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleContinueEditing(draft)}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Continue Editing
                </button>
                <button
                  onClick={() => handleDelete(draft.id)}
                  disabled={deleting === draft.id}
                  className="px-2 py-1.5 text-gray-400 hover:text-red-500 transition-colors text-sm disabled:opacity-50"
                  title="Delete draft"
                >
                  {deleting === draft.id ? '...' : '🗑️'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {drafts.length > 5 && (
        <div className="px-6 py-3 border-t border-gray-100 text-center">
          <button
            onClick={() => router.push('/dashboard/drafts')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View all {drafts.length} drafts →
          </button>
        </div>
      )}
    </div>
  );
}
