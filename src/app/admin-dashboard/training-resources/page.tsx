"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

interface TrainingResource {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  file_type: string;
  thumbnail_url: string | null;
  target_user_types: string[];
  target_countries: string[];
  language: string;
  category: string;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  download_count: number;
  created_at: string;
  updated_at: string;
}

interface ResourceFormData {
  title: string;
  description: string;
  target_user_types: string[];
  target_countries: string[];
  language: string;
  category: string;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
}

const EMPTY_FORM: ResourceFormData = {
  title: '',
  description: '',
  target_user_types: ['agent', 'landlord', 'fsbo'],
  target_countries: ['ALL'],
  language: 'en',
  category: 'guide',
  display_order: 0,
  is_featured: false,
  is_active: true
};

const USER_TYPE_OPTIONS = [
  { value: 'agent', label: 'Agent', color: 'bg-green-100 text-green-800' },
  { value: 'landlord', label: 'Landlord', color: 'bg-blue-100 text-blue-800' },
  { value: 'fsbo', label: 'FSBO', color: 'bg-orange-100 text-orange-800' }
];

const COUNTRY_OPTIONS = [
  { value: 'ALL', label: 'All Countries' },
  { value: 'GY', label: 'Guyana' },
  { value: 'JM', label: 'Jamaica' },
  { value: 'CO', label: 'Colombia' }
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'sw', label: 'Swahili' }
];

const CATEGORY_OPTIONS = [
  { value: 'guide', label: 'Guide', icon: '📖' },
  { value: 'checklist', label: 'Checklist', icon: '✅' },
  { value: 'template', label: 'Template', icon: '📝' },
  { value: 'legal', label: 'Legal', icon: '⚖️' },
  { value: 'marketing', label: 'Marketing', icon: '📢' }
];

function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TrainingResourcesAdmin() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resources, setResources] = useState<TrainingResource[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingResource, setEditingResource] = useState<TrainingResource | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>(EMPTY_FORM);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Filters
  const [filterUserType, setFilterUserType] = useState('all');
  const [filterCountry, setFilterCountry] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
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
      .select('user_type, admin_level')
      .eq('id', user.id)
      .single();

    // Only super admins can access
    if (!profile || profile.admin_level !== 'super') {
      router.push('/admin-dashboard');
      return;
    }

    setLoading(false);
    loadResources();
  };

  const loadResources = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterUserType !== 'all') params.set('user_type', filterUserType);
      if (filterCountry !== 'all') params.set('country', filterCountry);
      if (filterCategory !== 'all') params.set('category', filterCategory);
      if (filterLanguage !== 'all') params.set('language', filterLanguage);
      if (filterActive !== 'all') params.set('is_active', filterActive);

      const response = await fetch(`/api/admin/training-resources?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load resources');
      }

      setResources(data.resources || []);
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Failed to load training resources');
    }
  }, [filterUserType, filterCountry, filterCategory, filterLanguage, filterActive]);

  useEffect(() => {
    if (!loading) {
      loadResources();
    }
  }, [loading, loadResources]);

  const openAddModal = () => {
    setEditingResource(null);
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setShowModal(true);
  };

  const openEditModal = (resource: TrainingResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      target_user_types: resource.target_user_types,
      target_countries: resource.target_countries,
      language: resource.language,
      category: resource.category,
      display_order: resource.display_order,
      is_featured: resource.is_featured,
      is_active: resource.is_active
    });
    setSelectedFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingResource(null);
    setFormData(EMPTY_FORM);
    setSelectedFile(null);
    setError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // For new resources, file is required
      if (!editingResource && !selectedFile) {
        setError('Please select a PDF file to upload');
        setSaving(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('target_user_types', JSON.stringify(formData.target_user_types));
      formDataToSend.append('target_countries', JSON.stringify(formData.target_countries));
      formDataToSend.append('language', formData.language);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('display_order', formData.display_order.toString());
      formDataToSend.append('is_featured', formData.is_featured.toString());
      formDataToSend.append('is_active', formData.is_active.toString());

      if (selectedFile) {
        formDataToSend.append('file', selectedFile);
        setUploading(true);
      }

      const url = editingResource
        ? `/api/admin/training-resources/${editingResource.id}`
        : '/api/admin/training-resources';

      const method = editingResource ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        body: formDataToSend
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save resource');
      }

      setSuccess(editingResource ? 'Resource updated successfully!' : 'Resource created successfully!');
      closeModal();
      loadResources();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save resource');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleToggleActive = async (resource: TrainingResource) => {
    try {
      const response = await fetch(`/api/admin/training-resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !resource.is_active })
      });

      if (!response.ok) {
        throw new Error('Failed to update resource');
      }

      setSuccess(`Resource ${resource.is_active ? 'deactivated' : 'activated'} successfully!`);
      loadResources();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleFeatured = async (resource: TrainingResource) => {
    try {
      const response = await fetch(`/api/admin/training-resources/${resource.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !resource.is_featured })
      });

      if (!response.ok) {
        throw new Error('Failed to update resource');
      }

      setSuccess(`Resource ${resource.is_featured ? 'unfeatured' : 'featured'} successfully!`);
      loadResources();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (resourceId: string) => {
    try {
      const response = await fetch(`/api/admin/training-resources/${resourceId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete resource');
      }

      setSuccess('Resource deactivated successfully!');
      setDeleteConfirm(null);
      loadResources();
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

  const getCategoryInfo = (category: string) => {
    return CATEGORY_OPTIONS.find(c => c.value === category) || { label: category, icon: '📄' };
  };

  const getLanguageLabel = (code: string) => {
    return LANGUAGE_OPTIONS.find(l => l.value === code)?.label || code;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading training resources...</p>
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
                  Training Resources Management
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage downloadable PDFs and documents for agents, landlords, and FSBO users
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
                  + Add Resource
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
            <div className="flex-1 min-w-[120px]">
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
            <div className="flex-1 min-w-[120px]">
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
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-xs font-medium text-gray-700 mb-1">Language</label>
              <select
                value={filterLanguage}
                onChange={(e) => setFilterLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Languages</option>
                {LANGUAGE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
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
                  setFilterCategory('all');
                  setFilterLanguage('all');
                  setFilterActive('all');
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear
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

      {/* Resource List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        {resources.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-5xl mb-4">No resources found</div>
            <p className="text-gray-600 mb-6">Get started by adding your first training resource.</p>
            <button
              onClick={openAddModal}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Add First Resource
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((resource) => {
              const categoryInfo = getCategoryInfo(resource.category);
              return (
                <div
                  key={resource.id}
                  className={`bg-white rounded-lg shadow overflow-hidden border-l-4 ${
                    resource.is_active ? 'border-green-500' : 'border-gray-300'
                  }`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left side - Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{categoryInfo.icon}</span>
                          <h3 className="font-bold text-gray-900 text-lg truncate">{resource.title}</h3>
                          {resource.is_featured && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-yellow-100 text-yellow-800 rounded">Featured</span>
                          )}
                          <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                            resource.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {resource.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {resource.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{resource.description}</p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                            {categoryInfo.label}
                          </span>
                          <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-800">
                            {getLanguageLabel(resource.language)}
                          </span>
                          {resource.target_user_types.map(type => {
                            const opt = USER_TYPE_OPTIONS.find(o => o.value === type);
                            return opt ? (
                              <span key={type} className={`px-2 py-1 text-xs font-medium rounded ${opt.color}`}>
                                {opt.label}
                              </span>
                            ) : null;
                          })}
                          {resource.target_countries.map(country => (
                            <span key={country} className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                              {COUNTRY_OPTIONS.find(c => c.value === country)?.label || country}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>{formatFileSize(resource.file_size)}</span>
                          <span>{resource.download_count} downloads</span>
                          <span>Order: {resource.display_order}</span>
                        </div>
                      </div>

                      {/* Right side - Actions */}
                      <div className="flex flex-wrap sm:flex-col gap-2">
                        <a
                          href={resource.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors text-center"
                        >
                          View PDF
                        </a>
                        <button
                          onClick={() => openEditModal(resource)}
                          className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(resource)}
                          className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                            resource.is_featured
                              ? 'text-yellow-600 hover:bg-yellow-50'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {resource.is_featured ? 'Unfeature' : 'Feature'}
                        </button>
                        <button
                          onClick={() => handleToggleActive(resource)}
                          className={`px-3 py-2 text-sm font-medium rounded transition-colors ${
                            resource.is_active
                              ? 'text-orange-600 hover:bg-orange-50'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                        >
                          {resource.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(resource.id)}
                          className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingResource ? 'Edit Training Resource' : 'Add Training Resource'}
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
                  placeholder="Enter resource title"
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
                  placeholder="Brief description (optional)"
                  rows={2}
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PDF File {!editingResource && <span className="text-red-600">*</span>}
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div>
                      <div className="text-3xl mb-2">Selected</div>
                      <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  ) : editingResource ? (
                    <div>
                      <div className="text-3xl mb-2">Current File</div>
                      <p className="text-sm font-medium text-gray-900">{editingResource.file_name}</p>
                      <p className="text-xs text-gray-500">Click to replace</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">Upload</div>
                      <p className="text-sm text-gray-600">Click or drag to upload PDF</p>
                      <p className="text-xs text-gray-500">Max 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Language <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {LANGUAGE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
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
                      {opt.label}
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
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>

              {/* Featured & Active Toggles */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_featured: !prev.is_featured }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.is_featured ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_featured ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </div>

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
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </div>
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
                  {saving ? (uploading ? 'Uploading...' : 'Saving...') : (editingResource ? 'Update Resource' : 'Add Resource')}
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
              Are you sure you want to deactivate this resource? It will no longer appear to users.
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
