"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/supabase";
import { getActiveCountries } from "@/lib/countries";
import { checkUserSuspension } from "@/lib/userSuspensionCheck";
import DualContextPropertyManager from "@/components/DualContextPropertyManager";
import { getCountryAwareAdminPermissions } from "@/lib/auth/adminPermissions";

export default function OwnerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  // Function to determine account status display
  const getAccountStatus = (subscription: any) => {
    if (!subscription) return { text: 'Loading...', color: 'text-gray-600' };
    
    const { subscription_status, is_founding_member, totalProperties } = subscription;
    
    // Founding members get special treatment
    if (is_founding_member) {
      return { text: 'Founding Member', color: 'text-purple-600' };
    }
    
    // Check subscription status
    switch (subscription_status) {
      case 'active':
        return { text: 'Active Account', color: 'text-green-600' };
      case 'pending_payment':
        // User registered but hasn't paid yet
        if (totalProperties === 0) {
          return { text: 'Free Trial', color: 'text-blue-600' };
        } else {
          return { text: 'Upgrade Required', color: 'text-orange-600' };
        }
      case 'inactive':
      case null:
      case undefined:
        // Check if they have properties - if yes, they've used their free trial
        if (totalProperties > 0) {
          return { text: 'Upgrade Required', color: 'text-orange-600' };
        } else {
          return { text: 'Free Trial', color: 'text-blue-600' };
        }
      default:
        return { text: subscription_status || 'Unknown Status', color: 'text-gray-600' };
    }
  };
  const [subscription, setSubscription] = useState<{
    status: string;
    totalProperties: number;
    activeListings: number;
    subscription_status?: string;
    is_founding_member?: boolean;
  } | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [countryFilter, setCountryFilter] = useState<string>("");
  const [countries, setCountries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any>(null);

  useEffect(() => {
    async function fetchUserData() {
      // Using centralized supabase client
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('Owner dashboard - Auth check:', { authUser: !!authUser, authUserId: authUser?.id });
      
      if (!authUser) {
        console.log('No auth user found, redirecting to login in 3 seconds...');
        setTimeout(() => {
          window.location.href = '/login';
        }, 3000);
        return;
      }

      // Fetch user profile with subscription data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        // Check for account suspension first
        const suspensionStatus = await checkUserSuspension(authUser.id);
        if (suspensionStatus.suspended) {
          console.log('Account is suspended, redirecting...');
          router.push('/account-suspended');
          return;
        }

        // Check if user is authorized for Owner dashboard
        // Allow: Owner users, Super Admins, and Owner Admins
        const isAuthorizedForOwner = profile.user_type === 'owner' || 
                                    profile.admin_level === 'super' || 
                                    profile.admin_level === 'owner';
        
        if (!isAuthorizedForOwner) {
          console.log('❌ Unauthorized access to Owner dashboard. User type:', profile.user_type, 'Admin level:', profile.admin_level);
          alert('Access denied. Owner dashboard is only for property owners and authorized administrators.');
          window.location.href = '/dashboard'; // Redirect to general dashboard
          return;
        }

        // Get admin permissions if user has admin level
        if (profile.admin_level) {
          const userPermissions = await getCountryAwareAdminPermissions(
            profile.user_type,
            profile.email,
            profile.admin_level,
            authUser.id,
            supabase
          );
          setPermissions(userPermissions);
        }

        setUser({ ...authUser, ...profile });
        // FSBO uses per-property payments, not subscriptions
        setSubscription({
          status: profile.subscription_status || 'inactive', // This tracks if they've completed registration
          totalProperties: 0, // Will be updated when we fetch properties
          activeListings: 0,
          subscription_status: profile.subscription_status,
          is_founding_member: profile.is_founding_member
        });

        // Fetch user properties
        console.log('🔍 Fetching properties for user:', authUser.id);
        const { data: userProperties, error: propertiesError } = await supabase
          .from("properties")
          .select("*")
          .eq("user_id", authUser.id);
        
        console.log('📊 Properties query result:', {
          userProperties,
          propertiesError,
          count: userProperties?.length || 0
        });
        
        setProperties(userProperties || []);
        
        // Update subscription info with property counts
        if (userProperties) {
          setSubscription(prev => prev ? ({
            ...prev,
            totalProperties: userProperties.length,
            activeListings: userProperties.filter((p: any) => p.status === 'available').length
          }) : null);
        }
      }
      
      setLoading(false);
    }

    fetchUserData();
    
    // Safely load countries with error handling - disable for now
    async function loadCountries() {
      try {
        const data = await getActiveCountries();
        setCountries(data || []);
      } catch (error) {
        console.log('Countries table not found, using empty list');
        setCountries([]);
      }
    }
    
    loadCountries();
  }, []);

  async function handleLogout() {
    try {
      console.log('🚪 Logging out user...');
      
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-700">Owner Dashboard</h1>
              <p className="text-gray-600 mt-1">For Sale By Owner Property Management</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Welcome back,</div>
                <div className="font-medium flex items-center gap-2">
                  {user?.first_name || user?.email}
                  {user?.account_code && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                      {user.account_code}
                    </span>
                  )}
                </div>
              </div>
              <Link
                href="/dashboard/owner/settings"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
              >
                Settings
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

      <main className="max-w-2xl mx-auto py-12 px-4">
      
      {subscription && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow">
          <div className="font-semibold text-lg mb-2">
            Account Status: 
            <span className={getAccountStatus(subscription).color}>
              {getAccountStatus(subscription).text}
            </span>
          </div>
          <div className="mb-1">Total Properties: <span className="font-bold text-orange-600">{subscription.totalProperties}</span></div>
          <div>Active Listings: <span className="font-bold text-green-600">{subscription.activeListings}</span></div>
          <div className="mt-2 text-sm text-gray-600">
            Pay per property listing - no monthly subscription required
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <Link href="/dashboard/owner/create-property">
          <button className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-lg shadow-lg hover:scale-105 transition">Create New Property Listing</button>
        </Link>
      </div>
      
      {subscription?.status !== "active" && (
        <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> If you've just completed payment, your account is ready to create listings.
          </p>
        </div>
      )}
      
      {/* Enhanced Property Management with Dual Context for Owner Admins */}
      <DualContextPropertyManager
        userId={user?.id || ''}
        userType={user?.user_type === 'admin' ? 'admin' : 'fsbo'}
        adminLevel={user?.admin_level}
        countryId={user?.country_id}
        permissions={permissions}
      />
    </main>
    </div>
  );
}
