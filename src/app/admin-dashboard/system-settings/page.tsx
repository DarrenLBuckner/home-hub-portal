"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';

export default function SystemSettings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSuperAdminAccess() {
      console.log('🔍 SYSTEM SETTINGS: Checking super admin access...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('❌ No authenticated user, redirecting to admin login');
        window.location.href = '/admin-login';
        return;
      }

      // Check if user is super admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, admin_level, first_name, last_name, email')
        .eq('id', authUser.id)
        .single();

      console.log('System settings profile check:', { profile, profileError });

      if (profileError || !profile || profile.admin_level !== 'super') {
        console.log('Not authorized as super admin. User type:', profile?.user_type);
        alert('Access denied. Super Admin privileges required.');
        router.push('/admin-dashboard');
        return;
      }

      setUser({ 
        ...authUser, 
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        role: profile.user_type 
      });

      setLoading(false);
    }

    checkSuperAdminAccess();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin-login');
  };

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading system settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Super Admin</div>
                <div className="font-medium">{user?.name}</div>
              </div>
              <Link href="/admin-dashboard">
                <button className="px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-700 transition-colors">
                  Dashboard
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Coming Soon Notice */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold text-blue-900 mb-2">System Settings</h2>
          <p className="text-blue-800">
            Advanced system configuration options will be available here.
          </p>
        </div>

        {/* Settings Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* General Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">🔧</div>
              <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Site name, logo, contact information, and basic configurations.
            </p>
            
            {/* Current Contact Information */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Current Contact Information</h4>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>Main Phone: <strong>+5927629797</strong></span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>💬</span>
                  <a 
                    href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub%20Admin%2C%20I%20need%20assistance%20with%20system%20settings." 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    📱 WhatsApp Admin Support
                  </a>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 ml-6">
                  <span>Phone: +592 762-9797 • Preferred for faster response</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🌍</span>
                  <span>Country: Guyana</span>
                </div>
              </div>
            </div>
            
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded cursor-not-allowed">
              Advanced Settings Coming Soon
            </button>
          </div>

          {/* Payment Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">💳</div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Settings</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Payment processing, pricing tiers, and subscription management.
            </p>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded cursor-not-allowed">
              Coming Soon
            </button>
          </div>

          {/* Email Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">📧</div>
              <h3 className="text-lg font-semibold text-gray-900">Email Settings</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              SMTP configuration, email templates, and notification settings.
            </p>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded cursor-not-allowed">
              Coming Soon
            </button>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">🔐</div>
              <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Authentication, password policies, and access controls.
            </p>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded cursor-not-allowed">
              Coming Soon
            </button>
          </div>

          {/* Database Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">🗄️</div>
              <h3 className="text-lg font-semibold text-gray-900">Database Settings</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              Backup configuration, maintenance schedules, and optimization.
            </p>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded cursor-not-allowed">
              Coming Soon
            </button>
          </div>

          {/* API Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="text-2xl mr-3">🔌</div>
              <h3 className="text-lg font-semibold text-gray-900">API Settings</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              API keys, rate limiting, and third-party integrations.
            </p>
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-600 rounded cursor-not-allowed">
              Coming Soon
            </button>
          </div>

        </div>

        {/* System Status */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🟢 System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-semibold">Database</div>
              <div className="text-sm text-green-700">Connected</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-semibold">Authentication</div>
              <div className="text-sm text-green-700">Active</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-green-600 font-semibold">File Storage</div>
              <div className="text-sm text-green-700">Operational</div>
            </div>
          </div>
        </div>

        {/* Development Note */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-amber-900 mb-2">🚧 Development Note</h3>
          <p className="text-amber-800 text-sm">
            System settings functionality is planned for future releases. 
            Currently, system configuration is managed through the database and environment variables.
          </p>
        </div>
      </div>
    </main>
  );
}