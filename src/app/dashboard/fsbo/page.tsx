"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getActiveCountries } from "@/lib/countries";

export default function FSBODashboard() {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
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
        setSubscription({
          status: profile.subscription_status || 'inactive',
          plan: profile.subscription_plan || 'None',
          expires: profile.subscription_expires ? new Date(profile.subscription_expires).toLocaleDateString() : 'N/A',
        });

        // Fetch user properties
        const { data: userProperties } = await supabase
          .from("properties")
          .select("*")
          .eq("user_id", authUser.id);
        
        setProperties(userProperties || []);
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
            Subscription Status: 
            <span className={subscription.status === 'active' ? 'text-green-600' : 'text-red-600'}>
              {subscription.status}
            </span>
          </div>
          <div className="mb-1">Plan: <span className="font-bold text-orange-600">{subscription.plan}</span></div>
          <div>Expiry Date: <span className="font-bold">{subscription.expires}</span></div>
        </div>
      )}
      
      {subscription?.status === "active" ? (
        <Link href="/properties/create">
          <button className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold text-lg shadow-lg hover:scale-105 transition">Create Property Listing</button>
        </Link>
      ) : (
        <div className="mb-6 p-4 bg-yellow-100 rounded-xl border border-yellow-300">
          <p className="text-yellow-800 font-semibold">Your account is not active.</p>
          <p className="text-yellow-700 text-sm mt-1">Please complete your registration and payment to start listing properties.</p>
          <Link href="/register/fsbo">
            <button className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">Complete Registration</button>
          </Link>
        </div>
      )}
      <h2 className="text-xl font-bold mb-4">Your Properties</h2>
      <label htmlFor="countryFilter">Filter by Country</label>
      <select name="countryFilter" value={countryFilter} onChange={e => setCountryFilter(e.target.value)}>
        <option value="">All Countries</option>
        {countries.map(c => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </select>
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
