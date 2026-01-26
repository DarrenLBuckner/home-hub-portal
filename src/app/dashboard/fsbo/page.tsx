"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@/supabase';
import { getGlobalSouthCountries } from "../../../lib/global-south-countries";
import UniversalPropertyManager from "@/components/UniversalPropertyManager";
import TrainingVideosCard from "@/components/TrainingVideosCard";

export default function FSBODashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<{
    status: string;
    totalProperties: number;
    activeListings: number;
  } | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      // Fetch user profile with subscription data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        // Check if user is authorized for FSBO dashboard
        // Allow: FSBO users, Super Admins, and Owner Admins
        const isAuthorizedForFSBO = profile.user_type === 'fsbo' || 
                                   profile.admin_level === 'super' || 
                                   profile.admin_level === 'owner';
        
        if (!isAuthorizedForFSBO) {
          console.log('❌ Unauthorized access to FSBO dashboard. User type:', profile.user_type, 'Admin level:', profile.admin_level);
          alert('Access denied. FSBO dashboard is only for FSBO users and authorized administrators.');
          window.location.href = '/dashboard'; // Redirect to general dashboard
          return;
        }

        setUser({ ...authUser, ...profile });
        // FSBO uses per-property payments, not subscriptions
        setSubscription({
          status: profile.subscription_status || 'inactive', // This tracks if they've completed registration
          totalProperties: 0, // Will be updated when we fetch properties
          activeListings: 0
        });

        // Fetch user properties
        const { data: userProperties } = await supabase
          .from("properties")
          .select("*")
          .eq("user_id", authUser.id);
        
        setProperties(userProperties || []);
        
        // Update subscription info with property counts
        if (userProperties) {
          setSubscription(prev => prev ? ({
            ...prev,
            totalProperties: userProperties.length,
            activeListings: userProperties.filter((p: any) => p.status === 'active').length
          }) : null);
        }
      }
      
      setLoading(false);
    }

    fetchUserData();
    getGlobalSouthCountries().then(setCountries);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg text-center max-w-sm mx-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm sm:text-base text-gray-600">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Mobile-First Sticky Header */}
      <div className="bg-gradient-to-r from-blue-600 to-orange-600 text-white py-4 sm:py-6 lg:py-8 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1 sm:mb-2">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">🏡 FSBO Dashboard</h1>
                {user?.account_code && (
                  <div className="bg-white/20 backdrop-blur-sm border border-white/30 px-3 py-1 rounded-lg">
                    <div className="text-xs text-blue-100 uppercase tracking-wide font-medium">Account ID</div>
                    <div className="text-sm font-bold text-white">{user.account_code}</div>
                  </div>
                )}
              </div>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
                For Sale By Owner - Direct Property Sales
                {user?.first_name && (
                  <span className="block sm:inline sm:ml-2">
                    Welcome, {user.first_name}!
                  </span>
                )}
              </p>
            </div>
            
            {/* Mobile-Optimized Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              {/* Property Count Card */}
              {subscription && (
                <div className="bg-blue-500/20 rounded-xl p-3 text-center sm:text-right">
                  <div className="text-xl sm:text-2xl font-bold">{subscription.totalProperties}</div>
                  <div className="text-blue-100 text-xs sm:text-sm">Properties</div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => router.push('/dashboard/fsbo/settings')}
                  className="px-3 py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  ⚙️ Settings
                </button>
                <button
                  onClick={() => router.push('/logout')}
                  className="px-3 py-2 bg-red-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        
        {/* Mobile-First Quick Stats Cards */}
        {subscription && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">Account Status</p>
                  <p className={`text-base sm:text-lg font-bold ${subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {subscription.status === 'active' ? 'Registered' : 'Registration Required'}
                  </p>
                </div>
                <div className="text-3xl sm:text-4xl">{subscription.status === 'active' ? '✅' : '⚠️'}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Properties</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-600">{subscription.totalProperties}</p>
                </div>
                <div className="text-3xl sm:text-4xl">🏡</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-xs sm:text-sm font-medium">Active Listings</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{subscription.activeListings}</p>
                </div>
                <div className="text-3xl sm:text-4xl">🟢</div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-First Main Action Section */}
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">FSBO Property Management</h2>
            <p className="text-sm sm:text-base text-gray-600">For Sale By Owner - List properties directly with buyers</p>
            <p className="text-xs sm:text-sm text-orange-600 mt-1">Pay per property listing - no monthly subscription required</p>
          </div>
          
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <Link href="/dashboard/fsbo/create-listing" className="w-full max-w-md">
              <button className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2">
                <span>🏡</span>
                <span className="hidden sm:inline">Create New Property Listing</span>
                <span className="sm:hidden">New Listing</span>
              </button>
            </Link>
            
            {subscription?.status !== "active" && (
              <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-center">
                <p className="text-blue-800 text-xs sm:text-sm">
                  <strong>Note:</strong> If you've just completed payment, your account is ready to create listings.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Training Videos Section */}
        <div className="mb-6 sm:mb-8">
          <TrainingVideosCard userType="fsbo" countryCode={user?.country_id || 'GY'} />
        </div>

        {/* Mobile-First Property Management Section */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                  <span>🏠</span>
                  <span>Your FSBO Properties</span>
                </h2>
                <p className="text-orange-100 text-sm sm:text-base mt-1">
                  Manage your For Sale By Owner listings
                </p>
              </div>
              <div className="mt-3 sm:mt-0">
                <select 
                  name="countryFilter" 
                  value={countryFilter} 
                  onChange={e => setCountryFilter(e.target.value)}
                  className="w-full sm:w-auto border-0 bg-white/10 text-white placeholder-orange-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="" className="text-gray-800">All Countries</option>
                  {countries.map(c => (
                    <option key={c.code} value={c.code} className="text-gray-800">{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <UniversalPropertyManager 
              userType="fsbo"
              userId={user?.id || ''}
              createPropertyPath="/dashboard/fsbo/create-listing"
              editPropertyPath="/dashboard/fsbo/properties"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
