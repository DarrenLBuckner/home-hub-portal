"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from '@/supabase';
import { getGlobalSouthCountries } from "../../../lib/global-south-countries";
import UniversalPropertyManager from "@/components/UniversalPropertyManager";

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
            activeListings: userProperties.filter((p: any) => p.status === 'available').length
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">🏡 FSBO Dashboard</h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg">For Sale By Owner - Direct Property Sales</p>
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
              <div className="flex gap-2 flex-wrap">
                {/* Edit button - always available */}
                <Link href={`/dashboard/fsbo/edit-property/${property.id}`}>
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
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
