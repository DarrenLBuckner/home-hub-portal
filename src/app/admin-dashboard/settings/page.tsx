"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabase';
import ProfileImageUpload from "@/components/ProfileImageUpload";

export default function AdminSettings() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{
    first_name?: string;
    last_name?: string;
    phone?: string;
    admin_level?: string;
    display_name?: string;
    created_at?: string;
    profile_image?: string;
    company?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showSyncConfirmation, setShowSyncConfirmation] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  const [propertyCount, setPropertyCount] = useState(0);

  useEffect(() => {
    async function checkAdminAccess() {
      console.log('🔍 ADMIN SETTINGS: Checking admin access...');
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        console.log('❌ No authenticated user, redirecting to admin login');
        window.location.href = '/admin-login';
        return;
      }

      // Check if user is admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_type, admin_level, first_name, last_name, phone, display_name, created_at, profile_image, company')
        .eq('id', authUser.id)
        .single();

      console.log('Admin settings profile check:', { profile: profileData, profileError });

      if (profileError || !profileData || !['admin'].includes(profileData.user_type) || !['super', 'owner'].includes(profileData.admin_level)) {
        console.log('Not authorized as admin. User type:', profileData?.user_type);
        alert('Access denied. Admin privileges required.');
        router.push('/');
        return;
      }

      const displayName = [profileData.first_name, profileData.last_name]
        .filter(Boolean)
        .join(' ') || authUser.email?.split('@')[0] || 'User';
      
      setUser({ 
        ...authUser, 
        name: displayName,
        role: profileData.user_type 
      });
      
      setProfile(profileData);
      setOriginalProfile({ ...profileData });
      
      // Get admin's property count for sync confirmation  
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('user_id', authUser.id);
      
      setPropertyCount(properties?.length || 0);
      setLoading(false);
    }

    checkAdminAccess();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if phone (WhatsApp) changed and user has properties
    const phoneChanged = originalProfile?.phone !== profile?.phone;
    if (phoneChanged && propertyCount > 0) {
      setShowSyncConfirmation(true);
      return;
    }
    
    // If no phone change or no properties, proceed with regular save
    await performSave(false);
  };

  const performSave = async (syncToProperties: boolean) => {
    setSaving(true);
    setMessage("");
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          phone: profile?.phone,
          display_name: profile?.display_name,
          profile_image: profile?.profile_image,
          company: profile?.company,
        })
        .eq('id', user.id);

      if (profileError) {
        setMessage("Error updating profile: " + profileError.message);
        setSaving(false);
        return;
      }

      // If sync requested and phone changed, update properties
      if (syncToProperties && originalProfile?.phone !== profile?.phone) {
        const { error: propertyError } = await supabase
          .from('properties')
          .update({
            owner_whatsapp: profile?.phone || ''
          })
          .eq('user_id', user.id);

        if (propertyError) {
          setMessage("Profile updated, but failed to sync to properties: " + propertyError.message);
        } else {
          setMessage(`Profile updated successfully! Contact info synced to ${propertyCount} properties.`);
        }
      } else {
        setMessage("Profile updated successfully!");
      }

      // Update original profile for future comparisons
      setOriginalProfile({ ...profile });
      
    } catch (error) {
      setMessage("Error updating profile: " + (error as Error).message);
    }
    
    setSaving(false);
    setShowSyncConfirmation(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:max-w-6xl lg:mx-auto lg:px-8">
          <div className="py-6 md:flex md:items-center md:justify-between lg:border-t lg:border-gray-200">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <div>
                  <div className="flex items-center">
                    <h1 className="ml-3 text-2xl font-bold leading-7 text-gray-900 sm:truncate">
                      Admin Settings
                    </h1>
                  </div>
                  <dl className="mt-6 flex flex-col sm:ml-3 sm:mt-1 sm:flex-row sm:flex-wrap">
                    <dt className="sr-only">Account status</dt>
                    <dd className="flex items-center text-sm text-gray-500 font-medium capitalize sm:mr-6">
                      <div className="w-1.5 h-1.5 flex-shrink-0 mr-1.5 bg-green-400 rounded-full"></div>
                      {user?.role} Dashboard
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
              <Link
                href="/admin-dashboard"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="py-10">
        <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            
            {/* Profile Settings Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-blue-700 mb-6">Profile Settings</h2>
              
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={profile?.first_name || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={profile?.last_name || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={profile?.phone || ""}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., +592 123 4567"
                  />
                  <p className="text-sm text-gray-500 mt-1">This will be used for WhatsApp contact on property listings</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company/Organization (Optional)
                  </label>
                  <input
                    type="text"
                    value={profile?.company || ""}
                    onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Guyana Home Hub, ABC Real Estate"
                  />
                  <p className="text-sm text-gray-500 mt-1">Will be displayed under your name on property listings</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture (Optional)
                  </label>
                  <ProfileImageUpload
                    currentImageUrl={profile?.profile_image || ''}
                    onImageSelect={(file) => {
                      // File handling is done internally by the component
                      // The URL will be set via onImageUrlChange when upload completes
                    }}
                    onImageUrlChange={(url) => {
                      setProfile(prev => ({ ...prev, profile_image: url }));
                    }}
                    className="mt-2"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    This photo will be displayed on property listings where you are the listing agent/owner.
                    <br />
                    <span className="text-blue-600">✨ Tip:</span> Take a clear, professional headshot for the best results!
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={profile?.display_name || ""}
                    onChange={(e) => setProfile(prev => ({ ...prev, display_name: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How your name appears to users"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Level
                  </label>
                  <input
                    type="text"
                    value={profile?.admin_level === 'super' ? 'Super Administrator' : 'Owner Administrator'}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                  />
                </div>

                {message && (
                  <div className={`p-3 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>

              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member since:</span>
                    <span>{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Admin Level:</span>
                    <span className="text-blue-600 font-medium">
                      {profile?.admin_level === 'super' ? 'Super Administrator' : 'Owner Administrator'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* System Navigation Section */}
            <div className="border-4 border-dashed border-gray-200 rounded-lg p-8">
              <div className="text-center">
                <h3 className="mt-2 text-sm font-medium text-gray-900">System Settings</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Configure system settings and preferences.
                </p>
                <div className="mt-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="col-span-1">
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">S</span>
                              </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  System Configuration
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                  <Link href="/admin-dashboard/system-settings" className="text-blue-600 hover:text-blue-500">
                                    Configure →
                                  </Link>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">👥</span>
                              </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  User Management
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                  <Link href="/admin-dashboard/users" className="text-blue-600 hover:text-blue-500">
                                    Manage Users →
                                  </Link>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1">
                      <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-bold">P</span>
                              </div>
                            </div>
                            <div className="ml-5 w-0 flex-1">
                              <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                  Payment Settings
                                </dt>
                                <dd className="text-lg font-medium text-gray-900">
                                  <Link href="/admin-payments" className="text-blue-600 hover:text-blue-500">
                                    Configure →
                                  </Link>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Confirmation Modal */}
      {showSyncConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Sync Contact Information?
              </h3>
              <p className="text-gray-600 text-sm">
                You changed your phone number. This will update the contact information across <strong>all {propertyCount} of your property listings</strong>. 
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Users will see your new contact information on all listings.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => performSave(true)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50"
              >
                {saving ? 'Syncing...' : 'Yes, Update All Properties'}
              </button>
              <button
                onClick={() => performSave(false)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Profile Only'}
              </button>
            </div>
            
            <button
              onClick={() => setShowSyncConfirmation(false)}
              disabled={saving}
              className="w-full mt-3 px-4 py-2 text-gray-500 text-sm hover:text-gray-700 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}