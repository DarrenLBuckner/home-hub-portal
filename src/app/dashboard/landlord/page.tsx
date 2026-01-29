"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase";
import { getActiveCountries } from "@/lib/countries";
import UniversalPropertyManager from "@/components/UniversalPropertyManager";
import FoundingAdvisorBadge from "@/components/FoundingAdvisorBadge";
import TrainingVideosCard from "@/components/TrainingVideosCard";
import TrainingResourcesCard from "@/components/TrainingResourcesCard";
import AccountStatusBanner from "@/components/AccountStatusBanner";

export default function LandlordDashboard() {
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
      
      try {
        // Get current user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          // Just show loading - middleware will handle redirect
          setLoading(false);
          return;
        }

      // Fetch user profile with subscription data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        // Check if user is authorized for Landlord dashboard
        // Allow: Landlord users, Super Admins, and Owner Admins
        const isAuthorizedForLandlord = profile.user_type === 'landlord' || 
                                       profile.admin_level === 'super' || 
                                       profile.admin_level === 'owner';
        
        if (!isAuthorizedForLandlord) {
          console.log('❌ Unauthorized access to Landlord dashboard. User type:', profile.user_type, 'Admin level:', profile.admin_level);
          alert('Access denied. Landlord dashboard is only for landlords and authorized administrators.');
          window.location.href = '/dashboard'; // Redirect to general dashboard
          return;
        }

        setUser({ ...authUser, ...profile });
        // Landlord uses per-property payments, not subscriptions
        setSubscription({
          status: profile.subscription_status || 'inactive', // This tracks if they've completed registration
          totalProperties: 0, // Will be updated when we fetch properties
          activeListings: 0
        });
      }

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
        
        // Set loading to false on successful completion
        setLoading(false);
      } catch (error) {
        console.error('Error fetching landlord data:', error);
        setLoading(false);
      }
    }

    fetchUserData();
    getActiveCountries().then(setCountries).catch(error => {
      console.error('Error fetching countries:', error);
      // Set fallback countries if database fetch fails
      setCountries([
        { code: 'GY', name: 'Guyana' },
        { code: 'US', name: 'United States' },
        { code: 'CA', name: 'Canada' }
      ]);
    });
  }, [router]);

  async function handleLogout() {
    try {
      console.log('🚪 Logging out landlord...');
      
      // Clear authentication state completely
      await supabase.auth.signOut();
      
      // Clear local state
      setUser(null);
      setSubscription(null);
      setProperties([]);
      
      // Force page reload to clear any cached state
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, clear local state and redirect
      setUser(null);
      setSubscription(null);
      setProperties([]);
      window.location.href = '/login';
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Mobile-First Sticky Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 sm:py-6 lg:py-8 shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Mobile-First Header Layout */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">🏠 Landlord Portal</h1>
              <p className="text-green-100 text-sm sm:text-base lg:text-lg">Manage your rental properties with ease</p>
              <p className="text-xs text-green-200 hidden lg:block">[DEBUG: landlord/page.tsx loaded]</p>
            </div>
            
            {/* Mobile-Optimized Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
              {/* Property Count - Mobile Card Style */}
              <div className="bg-green-500/20 rounded-xl p-3 text-center sm:text-right">
                <div className="text-xl sm:text-2xl font-bold">{subscription?.totalProperties || 0}</div>
                <div className="text-green-100 text-xs sm:text-sm">Total Properties</div>
              </div>
              
              {/* User Info & Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                {/* Welcome Message with Account Code */}
                <div className="text-center sm:text-right">
                  <div className="text-xs sm:text-sm text-green-100">Welcome back,</div>
                  <div className="font-medium text-white text-sm truncate max-w-40 sm:max-w-none flex items-center gap-2">
                    {user?.first_name || user?.email}
                    <FoundingAdvisorBadge isFoundingAdvisor={user?.is_founding_advisor} />
                    {user?.account_code && (
                      <span className="ml-2 px-2 py-0.5 bg-white/20 rounded text-xs font-bold">
                        {user.account_code}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    href="/dashboard/landlord/settings"
                    className="px-3 py-2 bg-purple-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    ⚙️ Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 bg-red-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Account Status Banner - shows if pending/rejected/needs_correction */}
        <AccountStatusBanner
          status={user?.approval_status as any}
          rejectionReason={user?.rejection_reason}
          userType="landlord"
          userName={user?.first_name}
        />

        {/* Mobile-First Quick Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Active Listings</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{subscription?.activeListings || 0}</p>
              </div>
              <div className="text-3xl sm:text-4xl">🟢</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Total Properties</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{subscription?.totalProperties || 0}</p>
              </div>
              <div className="text-3xl sm:text-4xl">🏘️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-emerald-500 hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs sm:text-sm font-medium">Account Status</p>
                <p className={`text-base sm:text-lg font-bold ${subscription?.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {subscription?.status === 'active' ? 'Active' : 'Pending'}
                </p>
              </div>
              <div className="text-3xl sm:text-4xl">{subscription?.status === 'active' ? '✅' : '⏳'}</div>
            </div>
          </div>
        </div>

        {/* Mobile-First Main Action Section */}
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Rental Property Management</h2>
            <p className="text-sm sm:text-base text-gray-600">Create and manage your rental listings on Guyana Home Hub</p>
          </div>
          
          {subscription?.status === "active" ? (
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <Link href="/dashboard/landlord/create-property" className="w-full max-w-md">
                <button className="w-full px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2">
                  <span>🏠</span>
                  <span className="hidden sm:inline">Create New Rental Listing</span>
                  <span className="sm:hidden">New Rental</span>
                </button>
              </Link>
              
              <div className="text-center text-xs sm:text-sm text-gray-500 max-w-md px-2">
                <p>💡 <strong>Landlord Focus:</strong> Create rental property listings with lease terms, deposits, and rental-specific features</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl mb-3">⚠️</div>
              <h3 className="text-lg sm:text-xl font-bold text-yellow-800 mb-2">Account Activation Required</h3>
              <p className="text-sm sm:text-base text-yellow-700 mb-4">Complete your registration and payment to start listing rental properties.</p>
              <Link href="/register/landlord">
                <button className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold text-sm sm:text-base rounded-xl hover:shadow-lg transition-all duration-200">
                  Complete Registration
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Training Videos Section */}
        <div className="mb-6 sm:mb-8">
          <TrainingVideosCard userType="landlord" countryCode={user?.country_id || 'GY'} />
        </div>

        {/* Training Resources Section */}
        <div className="mb-6 sm:mb-8">
          <TrainingResourcesCard userType="landlord" countryCode={user?.country_id || 'GY'} />
        </div>

        {/* Mobile-First Properties Section */}
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">🏘️</span>
              <span className="hidden sm:inline">Your Rental Properties</span>
              <span className="sm:hidden">Properties</span>
            </h2>
            
            {/* Mobile-Optimized Country Filter */}
            <div className="flex items-center space-x-2">
              <label htmlFor="countryFilter" className="text-xs sm:text-sm font-medium text-gray-700">Filter:</label>
              <select 
                name="countryFilter" 
                value={countryFilter} 
                onChange={e => setCountryFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Countries</option>
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <UniversalPropertyManager
            userId={user?.id || ''}
            userType="landlord"
            editPropertyPath="/dashboard/landlord/edit-property"
            createPropertyPath="/dashboard/landlord/create-property"
          />
        </div>
      </div>
    </main>
  );
}