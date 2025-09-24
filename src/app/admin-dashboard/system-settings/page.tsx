'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/supabase';
import { requireSuperAdmin } from '@/lib/auth/adminCheck';
import { getClientPermissions, ClientPermissions, createPermissionChecker } from '@/lib/auth/permissions';

interface SystemSettings {
  siteName: string;
  maxFileSize: number;
  allowedImageTypes: string[];
  emailFromAddress: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  approvalRequired: boolean;
  maxPropertiesPerUser: number;
  sessionTimeout: number;
  enableAnalytics: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'Portal Home Hub',
  maxFileSize: 10, // MB
  allowedImageTypes: ['jpg', 'jpeg', 'png', 'webp'],
  emailFromAddress: 'noreply@portalhomehub.com',
  maintenanceMode: false,
  registrationEnabled: true,
  approvalRequired: true,
  maxPropertiesPerUser: 50,
  sessionTimeout: 24, // hours
  enableAnalytics: true,
};

export default function SystemSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [permissions, setPermissions] = useState<ClientPermissions | null>(null);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function checkAccessAndLoadSettings() {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          router.push('/admin-login');
          return;
        }

        // Check if user is super admin
        await requireSuperAdmin(authUser.id);
        
        // Get user permissions
        const userPermissions = await getClientPermissions(authUser.id);
        if (!userPermissions?.canChangeSettings) {
          router.push('/admin-dashboard');
          return;
        }

        setUser(authUser);
        setPermissions(userPermissions);
        
        // Load current settings (for now using defaults, could be from database)
        setSettings(DEFAULT_SETTINGS);
        setLoading(false);
        
      } catch (error: any) {
        console.error('Access check failed:', error);
        if (error.message.includes('Super admin')) {
          setError('Access denied: Super admin privileges required');
        } else {
          setError('Failed to load system settings');
        }
        setTimeout(() => router.push('/admin-dashboard'), 2000);
      }
    }

    checkAccessAndLoadSettings();
  }, [router]);

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleArrayChange = (key: keyof SystemSettings, value: string, checked: boolean) => {
    setSettings(prev => {
      const currentArray = prev[key] as string[];
      if (checked) {
        return {
          ...prev,
          [key]: [...currentArray, value]
        };
      } else {
        return {
          ...prev,
          [key]: currentArray.filter(item => item !== value)
        };
      }
    });
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Here you would save to database or configuration service
      // For now, we'll simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('System settings saved successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (error && !permissions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 13.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/admin-dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Admin Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const permissionChecker = permissions ? createPermissionChecker(permissions) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-1">Configure global system parameters and security settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Super Admin Only
              </span>
              <Link 
                href="/admin-dashboard"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="ml-3 text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 space-y-8">
            
            {/* General Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => handleSettingChange('siteName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email From Address
                  </label>
                  <input
                    type="email"
                    value={settings.emailFromAddress}
                    onChange={(e) => handleSettingChange('emailFromAddress', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security & Access</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="maintenanceMode" className="ml-3 text-sm text-gray-700">
                    Enable Maintenance Mode (blocks all non-admin access)
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="registrationEnabled"
                    checked={settings.registrationEnabled}
                    onChange={(e) => handleSettingChange('registrationEnabled', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="registrationEnabled" className="ml-3 text-sm text-gray-700">
                    Allow New User Registration
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="approvalRequired"
                    checked={settings.approvalRequired}
                    onChange={(e) => handleSettingChange('approvalRequired', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="approvalRequired" className="ml-3 text-sm text-gray-700">
                    Require Admin Approval for New Users
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Timeout (hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                    className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* File Upload Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">File Upload</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum File Size (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.maxFileSize}
                    onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
                    className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed Image Types
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {['jpg', 'jpeg', 'png', 'webp', 'gif'].map(type => (
                      <label key={type} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.allowedImageTypes.includes(type)}
                          onChange={(e) => handleArrayChange('allowedImageTypes', type, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700 uppercase">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* User Limits */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Limits</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Properties Per User
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={settings.maxPropertiesPerUser}
                  onChange={(e) => handleSettingChange('maxPropertiesPerUser', parseInt(e.target.value))}
                  className="w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Analytics */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Analytics</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableAnalytics"
                  checked={settings.enableAnalytics}
                  onChange={(e) => handleSettingChange('enableAnalytics', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="enableAnalytics" className="ml-3 text-sm text-gray-700">
                  Enable System Analytics Tracking
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
            <div className="flex justify-end">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}