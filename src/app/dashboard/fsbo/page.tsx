"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase";
import { getGlobalSouthCountries } from "../../../lib/global-south-countries";
import PropertyFeaturing from "@/components/PropertyFeaturing";

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
            activeListings: userProperties.filter(p => p.status === 'available').length
          }) : null);
        }
      }
      
      setLoading(false);
    }

    fetchUserData();
    getGlobalSouthCountries().then(setCountries);
  }, []);

  // Property status management function for FSBO
  const updatePropertyStatus = async (propertyId: string, newStatus: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId)
        .eq('user_id', user?.id); // Ensure FSBO can only update their own properties

      if (error) {
        alert('Error updating property status');
        console.error(error);
      } else {
        alert(`Property ${newStatus === 'sold' ? 'marked as sold! Listing complete.' : 'status updated successfully!'}`);
        // Refresh properties list
        const refreshData = async () => {
          const supabase = createClient();
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: userProperties } = await supabase
              .from("properties")
              .select("*")
              .eq("user_id", authUser.id);
            setProperties(userProperties || []);
          }
        };
        refreshData();
      }
    } catch (error) {
      alert('Error updating property');
      console.error(error);
    }
  };

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
      <div className="space-y-4">
        {properties.filter(p => !countryFilter || p.country === countryFilter).map(property => (
          <div key={property.id} className="border border-gray-200 rounded-xl p-6 bg-white shadow hover:shadow-md transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                    property.status === "available" 
                      ? "bg-green-100 text-green-800 border border-green-200" 
                      : property.status === "pending" 
                      ? "bg-blue-100 text-blue-800 border border-blue-200" 
                      : property.status === "sold"
                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                      : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                  }`}>
                    {property.status === "available" ? "LIVE" : 
                     property.status === "pending" ? "UNDER CONTRACT" : 
                     property.status === "sold" ? "SOLD" : 
                     "AWAITING APPROVAL"}
                  </span>
                  <span className="text-xs text-gray-500 uppercase font-medium">🏠 FOR SALE</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{property.title}</h3>
                <div className="text-sm text-gray-500">📍 {property.country}</div>
              </div>
              <div className="text-right ml-4">
                <div className="text-lg font-bold text-orange-600">{property.price} {property.currency}</div>
              </div>
            </div>
            
            {/* Property Status Management */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex gap-2 flex-wrap mb-3">
                {property.status === 'available' && (
                  <>
                    <button 
                      onClick={() => updatePropertyStatus(property.id, 'pending')}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                    >
                      📝 Mark Under Contract
                    </button>
                    <button 
                      onClick={() => updatePropertyStatus(property.id, 'sold')}
                      className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition"
                    >
                      🏆 Mark Sold
                    </button>
                  </>
                )}
                {property.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => updatePropertyStatus(property.id, 'sold')}
                      className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition"
                    >
                      🏆 Mark Sold
                    </button>
                    <button 
                      onClick={() => updatePropertyStatus(property.id, 'available')}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                    >
                      ↩️ Back to Market
                    </button>
                  </>
                )}
                {property.status === 'sold' && (
                  <>
                    <div className="text-xs text-purple-600 font-semibold">
                      🎉 Property Sold - Listing Complete!
                    </div>
                  </>
                )}
                {property.status === 'off_market' && (
                  <>
                    <div className="text-xs text-yellow-600 font-semibold">
                      ⏳ Awaiting admin approval to go live
                    </div>
                  </>
                )}
              </div>
              
              {/* Property Featuring */}
              {property.status === 'available' && (
                <PropertyFeaturing
                  propertyId={property.id}
                  propertyTitle={property.title}
                  currentlyFeatured={property.is_featured}
                  featuredUntil={property.featured_until}
                  featuredType={property.featured_type}
                  userType="fsbo"
                  siteId={property.site_id}
                  onFeaturingUpdate={() => {
                    // Refresh properties list
                    const refreshData = async () => {
                      const supabase = createClient();
                      const { data: { user: authUser } } = await supabase.auth.getUser();
                      if (authUser) {
                        const { data: userProperties } = await supabase
                          .from("properties")
                          .select("*")
                          .eq("user_id", authUser.id);
                        setProperties(userProperties || []);
                      }
                    };
                    refreshData();
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
