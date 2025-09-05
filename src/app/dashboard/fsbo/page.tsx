"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getActiveCountries } from "@/lib/countries";

export default function FSBODashboard() {
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
            activeListings: userProperties.filter(p => p.status === 'approved').length
          }) : null);
        }
      }
      
      setLoading(false);
    }

    fetchUserData();
    getActiveCountries().then(setCountries);
  }, []);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">FSBO Dashboard</h1>
      
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
        <Link href="/dashboard/fsbo/create-listing">
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
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <ul>
        {properties.filter(p => !countryFilter || p.country === countryFilter).map(property => (
          <li key={property.id} className="border p-4 mb-4 rounded-lg">
            <span className={`px-2 py-1 rounded text-xs font-bold ${property.status === "approved" ? "bg-green-100 text-green-700" : property.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
              {property.status}
            </span>
            <span className="ml-2 font-semibold">{property.title}</span>
            <span className="ml-2">({property.country})</span>
            <span className="ml-2">{property.price} {property.currency}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
