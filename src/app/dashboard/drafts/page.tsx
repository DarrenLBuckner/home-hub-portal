'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { loadUserDrafts, deleteDraft, loadDraft, DraftProperty } from '@/lib/draftManager';

interface Draft {
  id: string;
  user_id: string;
  draft_data: any;
  title?: string;
  last_saved: string;
  created_at: string;
  draft_type?: string;
  summary?: string;
}

export default function MyDraftsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      await loadDrafts();
    };

    initializeAuth();
  }, []);

  const loadDrafts = async () => {
    try {
      setLoading(true);
      const userDrafts = await loadUserDrafts();
      // Transform DraftProperty[] to Draft[] with proper typing
      const formattedDrafts: Draft[] = userDrafts.map(draft => ({
        ...draft,
        id: draft.id || '',
        draft_type: draft.draft_data?.listing_type || 'sale'
      }));
      setDrafts(formattedDrafts);
      setError(null);
    } catch (err) {
      console.error('Error loading drafts:', err);
      setError('Failed to load drafts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await deleteDraft(draftId);
      if (success) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
        if (selectedDraft?.id === draftId) {
          setSelectedDraft(null);
          setShowPreview(false);
        }
      } else {
        alert('Failed to delete draft. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft. Please try again.');
    }
  };

  const handleContinueEditing = (draft: Draft) => {
    // Determine the correct route based on user type and draft type
    let route = '/dashboard/agent/create-property';
    
    // Check if user is owner/FSBO
    if (draft.draft_type === 'fsbo' || draft.draft_data?.listing_type === 'fsbo') {
      route = '/dashboard/owner/create-property';
    }
    
    // Add draft ID as query parameter so the form can load it
    router.push(`${route}?draft=${draft.id}`);
  };

  const handlePreviewDraft = async (draft: Draft) => {
    try {
      const fullDraft = await loadDraft(draft.id);
      if (fullDraft) {
        setSelectedDraft({ ...draft, draft_data: fullDraft });
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error loading draft preview:', error);
      alert('Failed to load draft preview.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Less than an hour ago';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hour${Math.floor(diffInHours) === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDraftIcon = (draftType: string) => {
    switch (draftType) {
      case 'sale': return '🏠';
      case 'rent': return '🏘️';
      case 'fsbo': return '👤';
      default: return '📝';
    }
  };

  const getDraftTypeLabel = (draft: Draft) => {
    const listingType = draft.draft_data?.listing_type || draft.draft_type;
    switch (listingType) {
      case 'sale': return 'For Sale';
      case 'rent': return 'For Rent';
      case 'fsbo': return 'FSBO Sale';
      default: return 'Property';
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">📋 My Drafts</h1>
              <p className="text-gray-600 mt-2">
                Continue working on your saved property listings
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading your drafts...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600">❌ {error}</p>
            <button
              onClick={loadDrafts}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : drafts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Drafts Yet</h3>
            <p className="text-gray-600 mb-6">
              You haven't saved any property drafts. Start creating a listing to see your drafts here.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/dashboard/agent/create-property')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Property (Agent)
              </button>
              <button
                onClick={() => router.push('/dashboard/owner/create-property')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Create Property (FSBO)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {drafts.map((draft) => (
              <div key={draft.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Draft Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getDraftIcon(draft.draft_type || 'sale')}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {draft.title || 'Untitled Property'}
                        </h3>
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                          {getDraftTypeLabel(draft)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                      title="Delete draft"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Draft Summary */}
                  {draft.summary && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {draft.summary}
                    </p>
                  )}

                  {/* Draft Details */}
                  <div className="space-y-2 mb-6">
                    {draft.draft_data?.price && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">💰 Price:</span>
                        <span className="font-medium">${Number(draft.draft_data.price).toLocaleString()}</span>
                      </div>
                    )}
                    {draft.draft_data?.city && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">📍 Location:</span>
                        <span>{draft.draft_data.city}{draft.draft_data.region && `, ${draft.draft_data.region}`}</span>
                      </div>
                    )}
                    {(draft.draft_data?.bedrooms || draft.draft_data?.bathrooms) && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">🏠 Size:</span>
                        <span>
                          {draft.draft_data.bedrooms && `${draft.draft_data.bedrooms} bed`}
                          {draft.draft_data.bedrooms && draft.draft_data.bathrooms && ', '}
                          {draft.draft_data.bathrooms && `${draft.draft_data.bathrooms} bath`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Timestamps */}
                  <div className="text-xs text-gray-400 mb-4 space-y-1">
                    <div>Created: {new Date(draft.created_at).toLocaleDateString()}</div>
                    <div>Last saved: {formatDate(draft.last_saved)}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleContinueEditing(draft)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Continue Editing
                    </button>
                    <button
                      onClick={() => handlePreviewDraft(draft)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                    >
                      👁️ Preview
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Draft Preview Modal */}
        {showPreview && selectedDraft && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    📋 Draft Preview
                  </h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {selectedDraft.draft_data.title || 'Untitled Property'}
                    </h4>
                    <p className="text-gray-600">{getDraftTypeLabel(selectedDraft)}</p>
                  </div>

                  {selectedDraft.draft_data.description && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Description</h5>
                      <p className="text-gray-600">{selectedDraft.draft_data.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {selectedDraft.draft_data.price && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Price</h5>
                        <p className="text-gray-900">${Number(selectedDraft.draft_data.price).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedDraft.draft_data.property_type && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Property Type</h5>
                        <p className="text-gray-900">{selectedDraft.draft_data.property_type}</p>
                      </div>
                    )}
                    {(selectedDraft.draft_data.bedrooms || selectedDraft.draft_data.bathrooms) && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Bedrooms / Bathrooms</h5>
                        <p className="text-gray-900">
                          {selectedDraft.draft_data.bedrooms || '0'} bed, {selectedDraft.draft_data.bathrooms || '0'} bath
                        </p>
                      </div>
                    )}
                    {(selectedDraft.draft_data.city || selectedDraft.draft_data.region) && (
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Location</h5>
                        <p className="text-gray-900">
                          {selectedDraft.draft_data.city}{selectedDraft.draft_data.region && `, ${selectedDraft.draft_data.region}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedDraft.draft_data.amenities && selectedDraft.draft_data.amenities.length > 0 && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-2">Amenities</h5>
                      <div className="flex flex-wrap gap-2">
                        {selectedDraft.draft_data.amenities.map((amenity: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => handleContinueEditing(selectedDraft)}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Continue Editing
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}