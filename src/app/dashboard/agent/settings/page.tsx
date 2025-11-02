"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase";

export default function AgentSettings() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<{
    first_name?: string;
    last_name?: string;
    phone?: string;
    user_type?: string;
    subscription_status?: string;
    created_at?: string;
    profile_image?: string;
    company?: string;
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

      // Check if user is agent or admin (admins have agent access)
      const { data: adminUser } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (adminUser) {
        // Admin user - fetch profile from profiles table
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        setUser(authUser);
        setProfile(profileData);
        setOriginalProfile({ ...profileData });
        
        // Get admin's property count for sync confirmation
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('user_id', authUser.id);
        
        setPropertyCount(properties?.length || 0);
        setLoading(false);
        return;
      }

      // Regular user - check if agent
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profileData || profileData.user_type !== 'agent') {
        window.location.href = '/dashboard';
        return;
      }

      setUser(authUser);
      setProfile(profileData);
      setOriginalProfile({ ...profileData });
      
      // Get agent's property count for sync confirmation
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
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading settings...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Link href="/dashboard/agent" className="text-green-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-green-700 mb-6">Profile Settings</h1>
      
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., +592 123 4567"
            />
            <p className="text-sm text-gray-500 mt-1">This will be used for WhatsApp contact on property listings</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company/Brokerage (Optional)
            </label>
            <input
              type="text"
              value={profile?.company || ""}
              onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., ABC Real Estate, XYZ Realty"
            />
            <p className="text-sm text-gray-500 mt-1">Will be displayed under your name on property listings</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture (Optional)
            </label>
            <div className="space-y-3">
              {profile?.profile_image && (
                <div className="flex items-center space-x-3">
                  <img 
                    src={profile.profile_image} 
                    alt="Current profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => setProfile(prev => ({ ...prev, profile_image: "" }))}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove Picture
                  </button>
                </div>
              )}
              <input
                type="url"
                value={profile?.profile_image || ""}
                onChange={(e) => setProfile(prev => ({ ...prev, profile_image: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="https://example.com/your-photo.jpg"
              />
              <p className="text-sm text-gray-500">
                Enter a URL to your profile photo. This will be displayed on your property listings to help clients identify you.
                <br />
                <span className="text-blue-600">💡 Tip:</span> Upload to Google Drive, Dropbox, or similar and use the direct link.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <input
              type="text"
              value="Real Estate Agent"
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
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
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
                {profile?.subscription_status === 'active' ? 'Active' : 'Professional'}
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
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">⚠️</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Sync Contact Information?
              </h3>
              <p className="text-gray-600 text-sm">
                You changed your phone number. This will update the contact information across <strong>all {propertyCount} of your property listings</strong>. 
              </p>
              <p className="text-gray-600 text-sm mt-2">
                Clients will see your new contact information on all listings.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => performSave(true)}
                disabled={saving}
                className="flex-1 px-4 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition disabled:opacity-50"
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