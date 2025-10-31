"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase";
import { getActiveCountries } from "@/lib/countries";
import UniversalPropertyManager from "@/components/UniversalPropertyManager";

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
            activeListings: userProperties.filter((p: any) => p.status === 'available').length
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
        window.location.reload();
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
                {/* Welcome Message - Hidden on smallest screens */}
                <div className="text-center sm:text-right hidden sm:block">
                  <div className="text-xs sm:text-sm text-green-100">Welcome back,</div>
                  <div className="font-medium text-white text-sm truncate max-w-32 sm:max-w-none">{user?.email}</div>
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

          {properties.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🏠</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-600 mb-2">No rental properties yet</h3>
              <p className="text-sm sm:text-base text-gray-500 mb-4 px-4">Start building your rental portfolio today!</p>
              {subscription?.status === "active" && (
                <Link href="/dashboard/landlord/create-property">
                  <button className="px-4 sm:px-6 py-2 sm:py-3 bg-green-500 text-white font-semibold text-sm sm:text-base rounded-lg hover:bg-green-600 transition">
                    <span className="hidden sm:inline">Create Your First Rental Listing</span>
                    <span className="sm:hidden">Create Listing</span>
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
                      {/* Edit button - always available */}
                      <Link href={`/dashboard/landlord/edit-property/${property.id}`}>
                        <button className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition">
                          ✏️ Edit Property
                        </button>
                      </Link>
                      
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

          {/* Enhanced Property Management */}
          {subscription?.status === "active" && properties.length > 0 && (
            <div className="mt-6 sm:mt-8">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-1">🔧 Advanced Property Tools</h3>
                <p className="text-xs sm:text-sm text-green-800">
                  Manage property status, view rejections, and control listing visibility
                </p>
              </div>
              <UniversalPropertyManager 
                userId={user?.id || 'landlord'} 
                userType="landlord"
                editPropertyPath="/dashboard/landlord/edit"
                createPropertyPath="/dashboard/landlord/create-property"
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}