"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase";
import { getActiveCountries } from "@/lib/countries";

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
        // Verify user is a landlord
        if (profile.user_type !== 'landlord') {
          // Show error message instead of redirect
          setLoading(false);
          return;
        }

        setUser(authUser);
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
            activeListings: userProperties.filter(p => p.status === 'available').length
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

  // Property status management function
  const updatePropertyStatus = async (propertyId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('properties')
        .update({ status: newStatus })
        .eq('id', propertyId)
        .eq('user_id', user?.id); // Ensure landlord can only update their own properties

      if (error) {
        alert('Error updating property status');
        console.error(error);
      } else {
        alert(`Property ${newStatus === 'rented' ? 'marked as rented! Listing complete.' : 'status updated successfully!'}`);
        // Refresh properties list
        fetchUserData();
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
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-8 shadow-xl">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">🏠 Landlord Portal</h1>
              <p className="text-green-100 text-lg">Manage your rental properties with ease</p>
              <p className="text-xs text-green-200">[DEBUG: landlord/page.tsx loaded]</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-2xl font-bold">{subscription?.totalProperties || 0}</div>
                <div className="text-green-100 text-sm">Total Properties</div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-green-100">Welcome back,</div>
                  <div className="font-medium text-white">{user?.email}</div>
                </div>
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
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Active Listings</p>
                <p className="text-3xl font-bold text-green-600">{subscription?.activeListings || 0}</p>
              </div>
              <div className="text-4xl">🟢</div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Properties</p>
                <p className="text-3xl font-bold text-blue-600">{subscription?.totalProperties || 0}</p>
              </div>
              <div className="text-4xl">🏘️</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Account Status</p>
                <p className={`text-lg font-bold ${subscription?.status === 'active' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {subscription?.status === 'active' ? 'Active' : 'Pending'}
                </p>
              </div>
              <div className="text-4xl">{subscription?.status === 'active' ? '✅' : '⏳'}</div>
            </div>
          </div>
        </div>

        {/* Main Action Section */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Rental Property Management</h2>
            <p className="text-gray-600">Create and manage your rental listings on Guyana Home Hub</p>
          </div>
          
          {subscription?.status === "active" ? (
            <div className="flex flex-col items-center space-y-4">
              <Link href="/dashboard/landlord/create-property" className="w-full max-w-md">
                <button className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2">
                  <span>🏠</span>
                  <span>Create New Rental Listing</span>
                </button>
              </Link>
              
              <div className="text-center text-sm text-gray-500 max-w-md">
                <p>💡 <strong>Landlord Focus:</strong> Create rental property listings with lease terms, deposits, and rental-specific features</p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
              <div className="text-4xl mb-3">⚠️</div>
              <h3 className="text-xl font-bold text-yellow-800 mb-2">Account Activation Required</h3>
              <p className="text-yellow-700 mb-4">Complete your registration and payment to start listing rental properties.</p>
              <Link href="/register/landlord">
                <button className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all duration-200">
                  Complete Registration
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Properties Section */}
        <div className="bg-white rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <span className="mr-2">🏘️</span>
              Your Rental Properties
            </h2>
            
            {/* Country Filter */}
            <div className="flex items-center space-x-2">
              <label htmlFor="countryFilter" className="text-sm font-medium text-gray-700">Filter:</label>
              <select 
                name="countryFilter" 
                value={countryFilter} 
                onChange={e => setCountryFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Countries</option>
                {countries.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {properties.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-xl font-bold text-gray-600 mb-2">No rental properties yet</h3>
              <p className="text-gray-500 mb-4">Start building your rental portfolio today!</p>
              {subscription?.status === "active" && (
                <Link href="/dashboard/landlord/create-property">
                  <button className="px-6 py-3 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition">
                    Create Your First Rental Listing
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {(properties || []).filter(p => !countryFilter || p.country === countryFilter).map(property => (
                <div key={property.id} className="border border-gray-200 rounded-xl p-6 bg-gray-50 hover:bg-white hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          property.status === "available" 
                            ? "bg-green-100 text-green-800 border border-green-200" 
                            : property.status === "pending" 
                            ? "bg-blue-100 text-blue-800 border border-blue-200" 
                            : property.status === "rented"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                        }`}>
                          {property.status === "available" ? "LIVE" : 
                           property.status === "pending" ? "UNDER CONTRACT" : 
                           property.status === "rented" ? "RENTED" : 
                           "AWAITING APPROVAL"}
                        </span>
                        <span className="text-xs text-gray-500 uppercase font-medium">🏠 RENTAL PROPERTY</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{property.title}</h3>
                      {property.description && (
                        <p className="text-gray-600 text-sm line-clamp-2">{property.description.substring(0, 120)}...</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm text-gray-500 mb-1">📍 {property.country}</div>
                      <div className="text-lg font-bold text-green-600">{property.price} {property.currency}</div>
                      <div className="text-xs text-gray-500">per month</div>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex space-x-4 text-xs text-gray-500">
                        <span>🛏️ {property.bedrooms || 'N/A'} bed</span>
                        <span>🚿 {property.bathrooms || 'N/A'} bath</span>
                        <span>📐 {property.squareFootage || 'N/A'} sqft</span>
                      </div>
                      <button className="text-xs text-green-600 font-medium hover:text-green-700 hover:underline">
                        View Details →
                      </button>
                    </div>
                    
                    {/* Property Status Management */}
                    <div className="flex gap-2 flex-wrap">
                      {property.status === 'available' && (
                        <>
                          <button 
                            onClick={() => updatePropertyStatus(property.id, 'pending')}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                          >
                            📝 Mark Under Contract
                          </button>
                          <button 
                            onClick={() => updatePropertyStatus(property.id, 'rented')}
                            className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition"
                          >
                            🏠 Mark Rented
                          </button>
                        </>
                      )}
                      {property.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => updatePropertyStatus(property.id, 'rented')}
                            className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition"
                          >
                            🏠 Mark Rented
                          </button>
                          <button 
                            onClick={() => updatePropertyStatus(property.id, 'available')}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                          >
                            ↩️ Back to Market
                          </button>
                        </>
                      )}
                      {property.status === 'rented' && (
                        <>
                          <div className="text-xs text-purple-600 font-semibold">
                            🎉 Property Rented - Listing Complete!
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}