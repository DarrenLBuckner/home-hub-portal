"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase";

export default function LandlordSettings() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{
    first_name?: string;
    last_name?: string;
    phone?: string;
    user_type?: string;
    subscription_status?: string;
    created_at?: string;
    account_code?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showSyncConfirmation, setShowSyncConfirmation] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  const [propertyCount, setPropertyCount] = useState(0);

  useEffect(() => {
    async function fetchUserData() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      // Check if user is landlord
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profileData || profileData.user_type !== 'landlord') {
        window.location.href = '/dashboard';
        return;
      }

      setUser(authUser);
      setProfile(profileData);
      setOriginalProfile({ ...profileData });
      
      // Get landlord's property count for sync confirmation
      const { data: properties } = await supabase
        .from('properties')
        .select('id')
        .eq('user_id', authUser.id);
      
      setPropertyCount(properties?.length || 0);
      setLoading(false);
    }

    fetchUserData();
  }, []);

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

    const supabase = createClient();
    
    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          phone: profile?.phone,
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
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Link href="/dashboard/landlord" className="text-purple-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-purple-700">Profile Settings</h1>
        {profile?.account_code && (
          <div className="bg-purple-100 border border-purple-300 px-4 py-2 rounded-lg">
            <div className="text-xs text-purple-600 uppercase tracking-wide font-medium">Account ID</div>
            <div className="text-lg font-bold text-purple-800">{profile.account_code}</div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-xl shadow-lg p-6">
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={profile?.phone || ""}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., +592 123 4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <input
              type="text"
              value="Property Landlord"
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
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
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
              <span className="text-gray-600">Account Status:</span>
              <span className={profile?.subscription_status === 'active' ? 'text-green-600' : 'text-blue-600'}>
                {profile?.subscription_status === 'active' ? 'Active' : 'Pay Per Property'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Confirmation Modal */}
      {showSyncConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-purple-600 text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Sync Contact Information?
              </h3>
              <p className="text-gray-600 text-sm">
                You changed your phone number. This will update the contact information across <strong>all {propertyCount} of your property listings</strong>. 
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Tenants will see your new contact information on all listings.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => performSave(true)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition disabled:opacity-50"
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
    </main>
  );
}