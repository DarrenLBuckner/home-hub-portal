"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/supabase";
import { getActiveCountries } from "@/lib/countries";

export default function OwnerDashboard() {
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
        setUser(authUser);
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
            activeListings: userProperties.filter(p => p.status === 'available').length
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
                <div className="font-medium">{user?.email}</div>
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
            <span className={subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}>
              {subscription.status === 'active' ? 'Registered' : 'Registration Required'}
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
      
      <div id="properties">
        <h2 className="text-xl font-bold mb-4">Your Properties</h2>
        <div className="mb-4">
          <label htmlFor="countryFilter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Country</label>
          <select 
            name="countryFilter" 
            value={countryFilter} 
            onChange={e => setCountryFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Countries</option>
            {countries.map(c => (
              <option key={c.code || c.id} value={c.code || c.id}>{c.name || c.country_name || 'Unknown Country'}</option>
            ))}
          </select>
        </div>
      </div>
      <ul>
        {properties.filter(p => !countryFilter || p.country === countryFilter).map(property => (
          <li key={property.id} className="border p-4 mb-4 rounded-lg">
            <span className={`px-2 py-1 rounded text-xs font-bold ${property.status === "available" ? "bg-green-100 text-green-700" : property.status === "pending" ? "bg-blue-100 text-blue-700" : property.status === "off_market" ? "bg-yellow-100 text-yellow-700" : "bg-purple-100 text-purple-700"}`}>
              {property.status || 'Unknown'}
            </span>
            <span className="ml-2 font-semibold">{property.title || 'Untitled Property'}</span>
            <span className="ml-2">({property.country || property.region || 'Unknown Location'})</span>
            <span className="ml-2">{typeof property.price === 'number' ? property.price : 'N/A'} {property.currency || 'USD'}</span>
          </li>
        ))}
      </ul>
    </main>
    </div>
  );
}
