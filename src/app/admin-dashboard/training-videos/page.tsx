"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

interface TrainingVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  target_user_types: string[];
  target_countries: string[];
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface VideoFormData {
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  target_user_types: string[];
  target_countries: string[];
  display_order: number;
  is_active: boolean;
}

const EMPTY_FORM: VideoFormData = {
  title: '',
  description: '',
  video_url: '',
  thumbnail_url: '',
  target_user_types: ['agent', 'landlord', 'fsbo'],
  target_countries: ['ALL'],
  display_order: 0,
  is_active: true
};

const USER_TYPE_OPTIONS = [
  { value: 'agent', label: 'Agent', color: 'bg-green-100 text-green-800' },
  { value: 'landlord', label: 'Landlord', color: 'bg-blue-100 text-blue-800' },
  { value: 'fsbo', label: 'FSBO', color: 'bg-orange-100 text-orange-800' }
];

const COUNTRY_OPTIONS = [
  { value: 'ALL', label: 'All Countries', flag: '' },
  { value: 'GY', label: 'Guyana', flag: '' },
  { value: 'JM', label: 'Jamaica', flag: '' },
  { value: 'CO', label: 'Colombia', flag: '' }
];

export default function TrainingVideosAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState<TrainingVideo | null>(null);
  const [formData, setFormData] = useState<VideoFormData>(EMPTY_FORM);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filters
  const [filterUserType, setFilterUserType] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterActive, setFilterActive] = useState('all');

  // Auth check
  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super', 'superadmin'].includes(profile.user_type)) {
      router.push('/');
      return;
    }

    setLoading(false);
    loadVideos();
  };

  const loadVideos = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterUserType !== 'all') params.set('user_type', filterUserType);
      if (filterCountry !== 'all') params.set('country', filterCountry);
      if (filterActive !== 'all') params.set('is_active', filterActive);

      const response = await fetch(`/api/admin/training-videos?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load videos');
      }

      setVideos(data.videos || []);
    } catch (err) {
      console.error('Error loading videos:', err);
      setError('Failed to load training videos');
    }
  }, [filterUserType, filterCountry, filterActive]);

  useEffect(() => {
    if (!loading) {
      loadVideos();
    }
  }, [loading, loadVideos]);

  const openAddModal = () => {
    setEditingVideo(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  };

  const openEditModal = (video: TrainingVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || '',
      target_user_types: video.target_user_types,
      target_countries: video.target_countries,
      display_order: video.display_order,
      is_active: video.is_active
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVideo(null);
    setFormData(EMPTY_FORM);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const url = editingVideo
        ? `/api/admin/training-videos/${editingVideo.id}`
        : '/api/admin/training-videos';

      const method = editingVideo ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save video');
      }

      setSuccess(editingVideo ? 'Video updated successfully!' : 'Video created successfully!');
      closeModal();
      loadVideos();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save video');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (video: TrainingVideo) => {
    try {
      const response = await fetch(`/api/admin/training-videos/${video.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !video.is_active })
      });

      if (!response.ok) {
        throw new Error('Failed to update video');
      }

      setSuccess(`Video ${video.is_active ? 'deactivated' : 'activated'} successfully!`);
      loadVideos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (videoId: string) => {
    try {
      const response = await fetch(`/api/admin/training-videos/${videoId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      setSuccess('Video deactivated successfully!');
      setDeleteConfirm(null);
      loadVideos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleUserType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      target_user_types: prev.target_user_types.includes(type)
        ? prev.target_user_types.filter(t => t !== type)
        : [...prev.target_user_types, type]
    }));
  };

  const toggleCountry = (country: string) => {
    setFormData(prev => {
      if (country === 'ALL') {
        return { ...prev, target_countries: ['ALL'] };
      }

      const newCountries = prev.target_countries.includes(country)
        ? prev.target_countries.filter(c => c !== country)
        : [...prev.target_countries.filter(c => c !== 'ALL'), country];

      return {
        ...prev,
        target_countries: newCountries.length === 0 ? ['ALL'] : newCountries
      };
    });
  };

  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const getThumbnailUrl = (video: TrainingVideo) => {
    if (video.thumbnail_url) return video.thumbnail_url;
    const videoId = getYouTubeId(video.video_url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading training videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  Training Videos Management
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage training videos for agents, landlords, and FSBO users
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin-dashboard"
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </Link>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  + Add Video
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">User Type</label>
              <select
                value={filterUserType}
                onChange={(e) => setFilterUserType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                {USER_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
              <select
                value={filterCountry}
                onChange={(e) => setFilterCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Countries</option>
                {COUNTRY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterUserType('all');
                  setFilterCountry('all');
                  setFilterActive('all');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">x</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">x</button>
          </div>
        )}
      </div>

      {/* Video List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {videos.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-5xl mb-4">No videos found</div>
            <p className="text-gray-600 mb-6">Get started by adding your first training video.</p>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add First Video
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${
                  video.is_active ? 'border-green-500' : 'border-gray-300'
                }`}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gray-200 relative">
                  {getThumbnailUrl(video) ? (
                    <img
                      src={getThumbnailUrl(video)!}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Thumbnail
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${
                      video.is_active
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-500 text-white'
                    }`}>
                      {video.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2">
                    <span className="px-2 py-1 text-xs font-bold bg-black/70 text-white rounded">
                      Order: {video.display_order}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{video.title}</h3>

                  {video.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{video.description}</p>
                  )}

                  {/* User Type Badges */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {video.target_user_types.map(type => {
                      const opt = USER_TYPE_OPTIONS.find(o => o.value === type);
                      return opt ? (
                        <span key={type} className={`px-2 py-0.5 text-xs font-medium rounded ${opt.color}`}>
                          {opt.label}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {/* Country Badges */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {video.target_countries.map(country => {
                      const opt = COUNTRY_OPTIONS.find(o => o.value === country);
                      return opt ? (
                        <span key={country} className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700">
                          {opt.flag} {opt.label}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {/* URL (truncated) */}
                  <a
                    href={video.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline block truncate mb-3"
                  >
                    {video.video_url}
                  </a>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openEditModal(video)}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(video)}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
                        video.is_active
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {video.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(video.id)}
                      className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingVideo ? 'Edit Training Video' : 'Add Training Video'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter video title"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter video description (optional)"
                  rows={3}
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube URL <span className="text-red-600">*</span>
                </label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://youtube.com/watch?v=..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Accepts youtube.com or youtu.be URLs
                </p>
              </div>

              {/* Target User Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target User Types <span className="text-red-600">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {USER_TYPE_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleUserType(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                        formData.target_user_types.includes(opt.value)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Countries */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Countries
                </label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRY_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleCountry(opt.value)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                        formData.target_countries.includes(opt.value)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {opt.flag} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first
                </p>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_active ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm font-medium text-gray-700">
                  {formData.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Error in modal */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingVideo ? 'Update Video' : 'Add Video')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate this video? It will no longer appear to users.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
