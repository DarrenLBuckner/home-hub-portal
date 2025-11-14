"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// supabaseBrowser import removed - authentication now handled server-side
import GlobalSouthLocationSelector from "@/components/GlobalSouthLocationSelector";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import CompletionIncentive, { CompletionProgress } from "@/components/CompletionIncentive";
import { calculateCompletionScore, getUserMotivation } from "@/lib/completionUtils";
import AIDescriptionAssistant from "@/components/AIDescriptionAssistant";
import LotDimensions from "@/components/LotDimensions";
import { DimensionUnit } from "@/lib/lotCalculations";

const PROPERTY_TYPES = ["House", "Apartment", "Condo", "Townhouse", "Studio", "Room"];
const FEATURES = ["Pool", "Garage", "Garden", "Security", "Furnished", "AC", "Internet", "Pet Friendly", "Laundry", "Gym", "Gated", "Fruit Trees", "Farmland", "Backup Generator", "Solar", "Electric Gate"];

type PropertyForm = {
  title: string;
  description: string;
  price: string;
  location: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  features: string[];
  status: string;
  images: File[];
  attestation: boolean;
  rentalType: string;
  lotLength: string;
  lotWidth: string;
  lotDimensionUnit: string;
  owner_whatsapp: string;
};

export default function CreateLandlordProperty() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      // Authentication now handled server-side - no client-side auth needed
      return;
      
      /* DISABLED - Authentication now server-side
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      // Check if user is landlord or admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, subscription_status, admin_level')
        .eq('id', authUser.id)
        .single();

      if (!profile || (profile.user_type !== 'landlord' && profile.user_type !== 'admin')) {
        window.location.href = '/dashboard';
        return;
      }

      // Check admin config for admin levels
      const adminConfig: { [email: string]: { level: string } } = {
        'mrdarrenbuckner@gmail.com': { level: 'super' },
        'qumar@guyanahomehub.com': { level: 'owner' }
      };
      
      const adminInfo = adminConfig[authUser.email];
      const isEligibleAdmin = profile.user_type === 'admin' && adminInfo && ['super', 'owner'].includes(adminInfo.level);

      // Allow if: regular landlord with active subscription OR eligible admin
      if (!isEligibleAdmin && (profile.user_type !== 'landlord' || profile.subscription_status !== 'active')) {
        window.location.href = '/dashboard/landlord';
        return;
      }

      setUser(authUser);
      setLoading(false);
      */
    }

    checkAuth();
  }, []);

  const router = useRouter();
  const [form, setForm] = useState<PropertyForm>({
    title: "",
    description: "",
    price: "",
    location: "",
    propertyType: PROPERTY_TYPES[0],
    bedrooms: "",
    bathrooms: "",
    squareFootage: "",
    features: [],
    status: "pending",
    images: [],
    attestation: false,
    rentalType: "monthly",
    lotLength: "",
    lotWidth: "",
    lotDimensionUnit: "ft",
    owner_whatsapp: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");

  const imageLimit = 15; // Landlords get more image uploads

  // Auto-populate WhatsApp from user profile
  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { createClient } = await import('@/supabase');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.id && !form.owner_whatsapp) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone')
            .eq('id', user.id)
            .single();
            
          if (profile?.phone) {
            setForm(prev => ({ ...prev, owner_whatsapp: profile.phone }));
          }
        }
      } catch (error) {
        console.warn('Could not auto-populate WhatsApp:', error);
      }
    };
    
    getUserProfile();
  }, []);

  // Calculate completion score in real-time
  const completionAnalysis = calculateCompletionScore({
    title: form.title,
    description: form.description,
    price: form.price,
    property_type: form.propertyType,
    house_size_value: form.squareFootage,
    location: form.location,
    images: form.images,
    amenities: form.features
  });

  const userMotivation = getUserMotivation('landlord');

  // Handle location and currency changes
  const handleLocationChange = (field: 'country' | 'region', value: string) => {
    if (field === 'country') {
      setSelectedCountry(value);
      setSelectedRegion(''); // Reset region when country changes
    } else {
      setSelectedRegion(value);
    }
  };

  const handleCurrencyChange = (code: string, symbol: string) => {
    setCurrencyCode(code);
    setCurrencySymbol(symbol);
  };

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target;
    if (type === "checkbox" && name === "features") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, features: checked ? [...form.features, value] : form.features.filter(f => f !== value) });
    } else if (type === "checkbox" && name === "attestation") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, attestation: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  // Handle images through the enhanced component
  const handleImagesChange = (images: File[]) => {
    setForm({ ...form, images });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    // Validate required fields (squareFootage optional, location required for verification)
    const required: (keyof PropertyForm)[] = ["title", "description", "price", "propertyType", "bedrooms", "bathrooms", "location", "attestation"];
    for (const field of required) {
      if (!form[field]) {
        setError(`Missing field: ${field}`);
        setIsSubmitting(false);
        return;
      }
    }

    if (form.images.length < 1) {
      setError("Please upload at least one image.");
      setIsSubmitting(false);
      return;
    }

    if (form.images.length > imageLimit) {
      setError(`Image limit exceeded (${imageLimit} allowed)`);
      setIsSubmitting(false);
      return;
    }

    // Get user ID from Supabase auth
    const userId = user?.id;
    if (!userId) {
      setError("You must be logged in to create a property.");
      setIsSubmitting(false);
      return;
    }

    // Prepare images for upload - convert File objects to base64
    const imagesForUpload = await Promise.all(
      form.images.map(async (file: File) => {
        return new Promise<{name: string, type: string, data: string}>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            name: file.name,
            type: file.type,
            data: reader.result as string, // Already in data: URL format
          });
          reader.readAsDataURL(file);
        });
      })
    );

    // Store rental property in DB via API
    try {
      const res = await fetch("/api/properties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          images: imagesForUpload,
          userId,
          status: "pending",
          country: selectedCountry,
          region: selectedRegion,
          currency: currencyCode,
          listing_type: "rent", // Required by API
          city: selectedRegion, // Use region as city for rentals
          propertyCategory: "rental", // Mark as rental property
          site_id: selectedCountry === 'JM' ? 'jamaica' : 'guyana',  // Dynamic site_id based on country
          lot_length: form.lotLength ? Number(form.lotLength) : null,
          lot_width: form.lotWidth ? Number(form.lotWidth) : null,
          lot_dimension_unit: form.lotDimensionUnit,
          owner_whatsapp: form.owner_whatsapp,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to submit property. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/landlord"), 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to submit property. Please try again.");
    }
    setIsSubmitting(false);
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Back Navigation */}
        <div className="mb-6">
          <Link href="/dashboard/landlord" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3">
          🏡 Create Rental Property
          <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">Landlord</span>
        </h1>
        <p className="text-gray-600 mb-4">List your rental property and find quality tenants</p>
        
        {/* Rental Success Statistics - Motivational messaging */}
        <div className="bg-gradient-to-r from-teal-50 to-green-50 p-4 rounded-lg border border-teal-200 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-teal-600 text-lg">📈</span>
            <span className="font-semibold text-teal-900">Complete Rental Listings Get:</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/60 p-2 rounded">
              <div className="text-lg font-bold text-teal-800">+65%</div>
              <div className="text-xs text-teal-700">More Applications</div>
            </div>
            <div className="bg-white/60 p-2 rounded">
              <div className="text-lg font-bold text-teal-800">-40%</div>
              <div className="text-xs text-teal-700">Vacancy Days</div>
            </div>
            <div className="bg-white/60 p-2 rounded">
              <div className="text-lg font-bold text-teal-800">3x</div>
              <div className="text-xs text-teal-700">Better Tenants</div>
            </div>
            <div className="bg-white/60 p-2 rounded">
              <div className="text-lg font-bold text-teal-800">+18%</div>
              <div className="text-xs text-teal-700">Rental Income</div>
            </div>
          </div>
          <p className="text-xs text-teal-700 mt-2 text-center italic">Detailed listings attract quality tenants who stay longer!</p>
        </div>
        
        {/* Performance Score at Top */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200 mb-6">
          <CompletionProgress 
            completionPercentage={completionAnalysis.percentage}
            userType="landlord"
            missingFields={completionAnalysis.missingFields}
          />
        </div>
        
        {/* Landlord Listing Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <h2 className="font-semibold text-green-800 mb-2">🏠 Rental Property Listing</h2>
          <p className="text-green-700 text-sm">
            You're creating a rental property listing. This will be marked as a rental property and displayed in the rental section of the website.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. BASIC INFO (What & Where) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📍 Basic Information
            </h3>
            <div className="space-y-4">
              <GlobalSouthLocationSelector
                selectedCountry={selectedCountry}
                selectedRegion={selectedRegion}
                onLocationChange={handleLocationChange}
                onCurrencyChange={handleCurrencyChange}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Title *</label>
                <input 
                  name="title" 
                  type="text" 
                  placeholder="e.g., Modern 2BR Apartment in Georgetown" 
                  value={form.title} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 bg-white placeholder-gray-500" 
                />
              </div>
            </div>
          </div>

          {/* 2. LISTING DETAILS (Price & Type) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              💰 Rental Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent ({currencySymbol}) *</label>
                <input 
                  type="number" 
                  name="price" 
                  value={form.price} 
                  onChange={handleChange} 
                  required 
                  placeholder="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                <select 
                  name="propertyType" 
                  value={form.propertyType} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rental Period *</label>
                <select 
                  name="rentalType" 
                  value={form.rentalType} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. PROPERTY SPECIFICATIONS (Key Features) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              🏘️ Property Specifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms *</label>
                <input 
                  name="bedrooms" 
                  type="number" 
                  placeholder="0" 
                  value={form.bedrooms} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms *</label>
                <input 
                  name="bathrooms" 
                  type="number" 
                  placeholder="0" 
                  value={form.bathrooms} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Square Footage (Optional)</label>
                <input 
                  name="squareFootage" 
                  type="number" 
                  placeholder="1000" 
                  value={form.squareFootage} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
            </div>
          </div>

          {/* 4. LAND INFORMATION (All land details together!) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📐 Property Dimensions
            </h3>
            <LotDimensions
              length={form.lotLength}
              width={form.lotWidth}
              unit={form.lotDimensionUnit as DimensionUnit}
              onLengthChange={(length) => setForm(prev => ({ ...prev, lotLength: length }))}
              onWidthChange={(width) => setForm(prev => ({ ...prev, lotWidth: width }))}
              onUnitChange={(unit) => setForm(prev => ({ ...prev, lotDimensionUnit: unit }))}
              onAreaCalculated={(areaSqFt) => {
                // Auto-update squareFootage with calculated area for land size
                setForm(prev => ({ ...prev, squareFootage: areaSqFt.toString() }));
              }}
              label="Property Lot Dimensions"
            />
          </div>

          {/* 5. AMENITIES & FEATURES (What makes it special) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-teal-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              ✨ Amenities & Features
            </h3>
            
            {/* Enhanced messaging about why amenities matter for rentals */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-lg border border-purple-200 mb-4">
              <div className="flex items-start gap-3">
                <div className="text-purple-600 text-xl">🏆</div>
                <div>
                  <h4 className="font-semibold text-purple-900 mb-2">Why Complete Amenities = Better Rentals</h4>
                  <div className="space-y-1 text-sm text-purple-800">
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
                      <span><strong>65% more applications</strong> - Detailed rentals attract quality tenants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
                      <span><strong>Less vacancy time</strong> - Tenants know what they're renting</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
                      <span><strong>Better AI descriptions</strong> - More features = compelling rental ads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
                      <span><strong>Higher quality tenants</strong> - Complete listings attract serious renters</span>
                    </div>
                  </div>
                  <p className="text-xs text-purple-700 mt-2 italic">💡 Select features first, then let AI create your perfect rental description!</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {FEATURES.map(feature => (
                <label key={feature} className="flex items-center gap-2 text-gray-900 font-medium cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input 
                    type="checkbox" 
                    name="features" 
                    value={feature} 
                    checked={form.features.includes(feature)} 
                    onChange={handleChange} 
                    className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 6. DESCRIPTION & AI ASSISTANT (Content creation) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📝 Property Description
            </h3>
            
            {/* Description Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Description *</label>
              <textarea 
                name="description" 
                placeholder="Write at least 30-50 words about your rental property... OR use the AI assistant below for professional descriptions! The more details you provide, the better the AI can help. Describe what makes this property special for tenants." 
                value={form.description} 
                onChange={handleChange} 
                required 
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 placeholder-gray-400" 
              />
              <div className="mt-2 text-xs text-gray-500 flex justify-between">
                <span>💡 Tip: {form.description.trim().split(/\s+/).filter(word => word.length > 0).length < 30 ? `Add ${30 - form.description.trim().split(/\s+/).filter(word => word.length > 0).length} more words for better AI results` : 'Great! AI can now generate excellent descriptions'}</span>
                <span className={form.description.trim().split(/\s+/).filter(word => word.length > 0).length >= 30 ? 'text-green-600' : 'text-amber-600'}>{form.description.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
              </div>
            </div>
            
            {/* AI Assistant - RIGHT BELOW Description */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <div className="mb-3 text-sm text-blue-800">
                <span className="font-medium">🤖 AI Power Boost:</span> You've selected {form.features.length} amenities above - this gives the AI more context to create amazing rental descriptions!
              </div>
              <AIDescriptionAssistant
                propertyData={{
                  title: form.title,
                  propertyType: form.propertyType,
                  bedrooms: form.bedrooms,
                  bathrooms: form.bathrooms,
                  price: form.price,
                  location: form.location,
                  squareFootage: form.squareFootage,
                  features: form.features,
                  rentalType: "rental"
                }}
                currentDescription={form.description}
                onDescriptionGenerated={(description) => setForm(prev => ({ ...prev, description }))}
              />
            </div>
          </div>

          {/* 7. LOCATION DETAILS (Specific address info) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-pink-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📍 Property Address
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Address *</label>
                <input 
                  name="location" 
                  type="text" 
                  placeholder="Property address or specific location" 
                  value={form.location} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 placeholder-gray-500" 
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500">🔒</span>
                  <div>
                    <div className="font-medium text-blue-800 text-sm">Privacy Protected</div>
                    <div className="text-blue-700 text-xs mt-1">
                      Address is required for property verification only. It will never be shown to renters until you approve them.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 8. CONTACT INFORMATION */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-emerald-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📞 Contact Information
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-blue-900 mb-2">How tenants will contact you</h4>
              <p className="text-sm text-blue-800">
                Interested tenants will be able to contact you through WhatsApp. Your contact details will only be shown to serious inquiries.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="owner_whatsapp"
                value={form.owner_whatsapp}
                onChange={handleChange}
                placeholder="+592-XXX-XXXX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                <strong>Required:</strong> Include country code (+592 for Guyana). Most tenants prefer WhatsApp for instant contact.
              </p>
              <div className="bg-green-50 p-3 rounded mt-2">
                <p className="text-sm text-green-800">
                  <strong>💬 Why WhatsApp?</strong> 90% of rental inquiries in Guyana happen via WhatsApp. This ensures you get contacted quickly by serious tenants.
                </p>
              </div>
            </div>
          </div>
          {/* 9. PROPERTY IMAGES (Visual proof) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📸 Property Images
            </h3>
            <p className="text-gray-600 mb-6">Upload high-quality photos to attract quality tenants. First image will be the main photo.</p>
            <EnhancedImageUpload
              images={form.images}
              setImages={handleImagesChange}
              maxImages={imageLimit}
            />
          </div>

          {/* 10. LEGAL ATTESTATION */}
          <div className="bg-red-50 p-6 rounded-lg shadow-sm border-l-4 border-red-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-800">
              ⚖️ Legal Attestation
            </h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                name="attestation" 
                checked={form.attestation} 
                onChange={handleChange} 
                required 
                className="w-5 h-5 text-red-600 border-2 border-red-300 rounded focus:ring-red-500 mt-1"
              />
              <span className="text-sm font-medium text-red-800 leading-relaxed">
                By submitting this listing, I confirm under penalty of perjury that I am the legal owner of this property or have the legal authority to list it for rental.
              </span>
            </label>
          </div>

          {/* SUCCESS & ERROR MESSAGES */}
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-8 rounded-xl shadow-sm">
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <div className="text-green-800 text-xl font-bold mb-2">Property submitted successfully!</div>
                <div className="text-green-700 text-sm">Redirecting to dashboard...</div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-red-500 text-2xl">⚠️</span>
                <div className="text-red-800 font-medium">{error}</div>
              </div>
            </div>
          )}
          
          {/* 11. SUBMIT BUTTON */}
          {!success && (
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 mt-8 -mx-8 px-8 pb-8">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white text-lg py-4 rounded-xl font-bold shadow-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Submitting Rental Listing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🏡 Submit Rental Listing
                  </span>
                )}
              </button>
              <p className="text-center text-sm text-gray-700 mt-3">
                Your rental property will be reviewed by our team before going live
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}