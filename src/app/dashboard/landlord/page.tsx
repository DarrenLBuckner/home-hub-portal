"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getActiveCountries } from "@/lib/countries";

export default function LandlordDashboard() {
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
        // Verify user is a landlord
        if (profile.user_type !== 'landlord') {
          window.location.href = '/dashboard';
          return;
        }

        setUser(authUser);
        // Landlord uses per-property payments, not subscriptions
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
      <h1 className="text-3xl font-bold text-green-700 mb-4">Landlord Dashboard</h1>
      
      {subscription && (
        <div className="mb-6 p-6 bg-white rounded-xl shadow">
          <div className="font-semibold text-lg mb-2">
            Account Status: 
            <span className={subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}>
              {subscription.status === 'active' ? 'Registered' : 'Registration Required'}
            </span>
          </div>
          <div className="mb-1">Total Properties: <span className="font-bold text-green-600">{subscription.totalProperties}</span></div>
          <div>Active Listings: <span className="font-bold text-green-600">{subscription.activeListings}</span></div>
          <div className="mt-2 text-sm text-gray-600">
            Pay per property listing - no monthly subscription required
          </div>
        </div>
      )}
      
      {subscription?.status === "active" ? (
        <Link href="/properties/create">
          <button className="px-6 py-3 rounded-xl bg-green-500 text-white font-bold text-lg shadow-lg hover:scale-105 transition">Create Property Listing</button>
        </Link>
      ) : (
        <div className="mb-6 p-4 bg-yellow-100 rounded-xl border border-yellow-300">
          <p className="text-yellow-800 font-semibold">Your account is not active.</p>
          <p className="text-yellow-700 text-sm mt-1">Please complete your registration and payment to start listing properties.</p>
          <Link href="/register/landlord">
            <button className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">Complete Registration</button>
          </Link>
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Your Properties</h2>
      <div className="mb-4">
        <label htmlFor="countryFilter" className="block text-sm font-medium text-gray-700 mb-2">Filter by Country</label>
        <select 
          name="countryFilter" 
          value={countryFilter} 
          onChange={e => setCountryFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All Countries</option>
          {countries.map(c => (
            <option key={c.code} value={c.code}>{c.name}</option>
          ))}
        </select>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No properties listed yet.</p>
          {subscription?.status === "active" && (
            <p className="mt-2">Create your first property listing to get started!</p>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {properties.filter(p => !countryFilter || p.country === countryFilter).map(property => (
            <li key={property.id} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                    property.status === "approved" 
                      ? "bg-green-100 text-green-700" 
                      : property.status === "pending" 
                      ? "bg-yellow-100 text-yellow-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {property.status}
                  </span>
                  <span className="ml-3 font-semibold text-lg">{property.title}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">({property.country})</div>
                  <div className="font-bold text-green-600">{property.price} {property.currency}</div>
                </div>
              </div>
              {property.description && (
                <p className="mt-2 text-gray-600 text-sm">{property.description.substring(0, 100)}...</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}