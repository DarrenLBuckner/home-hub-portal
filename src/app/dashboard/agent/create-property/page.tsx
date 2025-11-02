
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
// Authentication is now handled entirely server-side in the API route
import GlobalSouthLocationSelector from "@/components/GlobalSouthLocationSelector";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import AmenitiesSelector from "@/components/AmenitiesSelector";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";
import CompletionIncentive, { CompletionProgress } from "@/components/CompletionIncentive";
import { calculateCompletionScore, getUserMotivation } from "@/lib/completionUtils";
import AIDescriptionAssistant from "@/components/AIDescriptionAssistant";
import LotDimensions from "@/components/LotDimensions";
import { DimensionUnit } from "@/lib/lotCalculations";
// Duplicate Prevention System
import { usePropertySubmission } from "@/hooks/usePropertySubmission";
import DuplicateWarningDialog from "@/components/DuplicateWarningDialog";
import PropertySuccessScreen from "@/components/PropertySuccessScreen";


interface FormData {
  location: string;
  title: string;
  description: string;
  price: string;
  status: string;
  property_type: string;
  listing_type: string;
  bedrooms: string;
  bathrooms: string;
  house_size_value: string;
  house_size_unit: string;
  land_size_value: string;
  land_size_unit: string;
  year_built: string;
  amenities: string[];
  region: string;
  city: string;
  neighborhood: string;
  lot_length: string;
  lot_width: string;
  lot_dimension_unit: string;
  owner_whatsapp: string;
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    location: "",
    title: "",
    description: "",
    price: "",
    status: "draft",
    property_type: "House", // Default to House to prevent validation errors
    listing_type: "sale", // Default to sale to prevent validation errors
    bedrooms: "",
    bathrooms: "",
    house_size_value: "",
    house_size_unit: "sq ft",
    land_size_value: "",
    land_size_unit: "sq ft",
    year_built: "",
    amenities: [],
    region: "",
    city: "",
    neighborhood: "",
    lot_length: "",
    lot_width: "",
    lot_dimension_unit: "ft",
    owner_whatsapp: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");

  // Comprehensive submission system with duplicate prevention
  const propertySubmission = usePropertySubmission({
    onSuccess: () => {
      setSuccess("✅ Property created successfully!");
      setLoading(false);
    },
    onError: (error) => {
      setError(error);
      setLoading(false);
    },
  });

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
    ...form,
    images,
    amenities: Array.isArray(form.amenities) ? form.amenities : []
  });

  const userMotivation = getUserMotivation('agent');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleLocationChange = (field: 'country' | 'region', value: string) => {
    if (field === 'country') {
      setSelectedCountry(value);
      setSelectedRegion('');
      setForm({ ...form, location: value, region: '' });
    } else {
      setSelectedRegion(value);
      setForm({ ...form, region: value });
    }
  };

  const handleCurrencyChange = (code: string, symbol: string) => {
    setCurrencyCode(code);
    setCurrencySymbol(symbol);
  };

  const handleImagesChange = (images: File[]) => {
    setImages(images);
  };

  const handleCreateAnother = () => {
    // Reset form to initial state (keep WhatsApp from profile)
    const currentWhatsapp = form.owner_whatsapp;
    setForm({
      location: "",
      title: "",
      description: "",
      price: "",
      status: "draft",
      property_type: "House",
      listing_type: "sale",
      bedrooms: "",
      bathrooms: "",
      house_size_value: "",
      house_size_unit: "sq ft",
      land_size_value: "",
      land_size_unit: "sq ft",
      year_built: "",
      amenities: [],
      region: "",
      city: "",
      neighborhood: "",
      lot_length: "",
      lot_width: "",
      lot_dimension_unit: "ft",
      owner_whatsapp: currentWhatsapp, // Keep WhatsApp for convenience
    });
    setImages([]);
    setSuccess("");
    setError("");
    setSelectedCountry("GY");
    setSelectedRegion("");
    setCurrencyCode("GYD");
    setCurrencySymbol("GY$");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard/agent");
  };


  const handleSubmit = async (e: React.FormEvent, bypassDuplicateCheck: boolean = false) => {
    e.preventDefault();
    
    // Prevent double submission
    if (propertySubmission.isSubmitting) {
      console.log('🚫 Already submitting, ignoring duplicate click');
      return;
    }

    // Check for duplicates unless bypassed
    if (!bypassDuplicateCheck && form.title && form.title.length > 5) {
      const hasDuplicate = await propertySubmission.duplicateDetection.checkForDuplicates(form.title, true);
      if (hasDuplicate) {
        return; // Stop submission, show warning dialog
      }
    }
    
    // Original submission logic starts here
    setLoading(true);
    setError("");

    // Validate required fields
    if (!form.property_type) {
      throw new Error('Please select a Property Type.');
    }
    
    if (!form.listing_type) {
      throw new Error('Please select a Listing Type (For Sale or For Rent).');
    }

    if (images.length < 1) {
      throw new Error("Please upload at least one image.");
    }

    try {
      // The API route will handle all authentication server-side with @supabase/ssr
      console.log('🔍 Starting property creation - authentication handled by API route');

      // Prepare images for upload - convert File objects to base64
      const imagesForUpload = await Promise.all(
        images.map(async (file: File) => {
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

      // Create property using API route for proper server-side authentication
      const res = await fetch("/api/properties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Map agent form fields to API expected format
          title: form.title,
          description: form.description,
          price: form.price,
          property_type: form.property_type,
          listing_type: form.listing_type,
          bedrooms: form.bedrooms,
          bathrooms: form.bathrooms,
          house_size_value: form.house_size_value,
          house_size_unit: form.house_size_unit,
          land_size_value: form.land_size_value,
          land_size_unit: form.land_size_unit,
          location: form.location || selectedRegion, // Use region as location fallback
          year_built: form.year_built,
          amenities: form.amenities,
          region: form.region || selectedRegion,
          city: form.city,
          neighborhood: form.neighborhood,
          address: form.neighborhood || form.city, // Use neighborhood or city as address
          status: form.status,
          country: selectedCountry,
          currency: currencyCode,
          images: imagesForUpload,
          lot_length: form.lot_length ? Number(form.lot_length) : null,
          lot_width: form.lot_width ? Number(form.lot_width) : null,
          lot_dimension_unit: form.lot_dimension_unit,
          owner_whatsapp: form.owner_whatsapp,
          // userId will be extracted server-side from authenticated session
          propertyCategory: form.listing_type === 'sale' ? 'sale' : 'rental', // Map to API format
          site_id: 'guyana',  // ADD THIS LINE ONLY
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        // Check for authentication errors
        if (res.status === 401) {
          console.error('❌ Authentication failed - corrupted session detected');
          setError("Authentication error detected. Please log out and log back in to fix your session.");
        } else {
          setError(result.error || "Failed to create property. Please try again.");
        }
        setLoading(false);
        return;
      }

      console.log('✅ Property created successfully via API');
      
      // Show success message with options
      setSuccess("✅ Property created successfully!");
      setError("");
      setLoading(false);
      
      // Immediate redirect to prevent double submission
      setTimeout(() => router.push('/dashboard/agent'), 1000);
      
    } catch (authError) {
      console.error('❌ Property creation failed:', authError);
      setError("Failed to create property. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-2 text-gray-900 flex items-center gap-3">
          🏠 Create New Property
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">Agent</span>
        </h2>
        <p className="text-gray-600 mb-8">Create a professional property listing with AI assistance</p>
        
        {/* Performance Score at Top - Keep it prominent */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl border border-green-200 mb-8">
          <CompletionProgress 
            completionPercentage={completionAnalysis.percentage}
            userType="agent"
            missingFields={completionAnalysis.missingFields}
          />
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
                  placeholder="e.g., Beautiful 3-bedroom family home in Georgetown" 
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
              💰 Listing Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price ({currencySymbol}) *</label>
                <input 
                  name="price" 
                  type="number" 
                  placeholder="0" 
                  value={form.price} 
                  onChange={handleChange} 
                  required 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Type *</label>
                <select 
                  name="property_type" 
                  value={form.property_type} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  <option value="House">🏠 House</option>
                  <option value="Apartment">🏢 Apartment</option>
                  <option value="Condo">🏘️ Condo</option>
                  <option value="Land">🌿 Land</option>
                  <option value="Commercial">🏢 Commercial</option>
                  <option value="Townhouse">🏘️ Townhouse</option>
                  <option value="Villa">🏛️ Villa</option>
                  <option value="Studio">🏠 Studio</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Listing Type *</label>
                <select 
                  name="listing_type" 
                  value={form.listing_type} 
                  onChange={handleChange} 
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  <option value="sale">🏠 For Sale</option>
                  <option value="rent">🏡 For Rent</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                <input 
                  name="bedrooms" 
                  type="number" 
                  placeholder="0" 
                  value={form.bedrooms} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                <input 
                  name="bathrooms" 
                  type="number" 
                  placeholder="0" 
                  value={form.bathrooms} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">House Size (Optional)</label>
                <div className="flex gap-2">
                  <input 
                    name="house_size_value" 
                    type="number" 
                    placeholder="2000" 
                    value={form.house_size_value} 
                    onChange={handleChange} 
                    className="flex-1 px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                  />
                  <select 
                    name="house_size_unit" 
                    value={form.house_size_unit} 
                    onChange={handleChange} 
                    className="px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                  >
                    <option value="sq ft">Sq Ft</option>
                    <option value="sq m">Sq M</option>
                  </select>
                </div>
              </div>
            </div>
            <CompletionIncentive 
              fieldName="house_size_value"
              fieldType="squareFootage" 
              isCompleted={!!form.house_size_value}
              userType="agent"
            />
          </div>
          {/* 4. LAND INFORMATION (All land details together!) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📐 Land & Property Information
            </h3>
            
            {/* Lot Dimensions */}
            <div className="mb-6">
              <LotDimensions
                length={form.lot_length}
                width={form.lot_width}
                unit={form.lot_dimension_unit as DimensionUnit}
                onLengthChange={(length) => setForm(prev => ({ ...prev, lot_length: length }))}
                onWidthChange={(width) => setForm(prev => ({ ...prev, lot_width: width }))}
                onUnitChange={(unit) => setForm(prev => ({ ...prev, lot_dimension_unit: unit }))}
                onAreaCalculated={(areaSqFt) => {
                  // Auto-update land_size_value with calculated area
                  setForm(prev => ({ 
                    ...prev, 
                    land_size_value: areaSqFt.toString(),
                    land_size_unit: 'sq ft' 
                  }));
                }}
                label="Lot Dimensions (if rectangular)"
              />
            </div>
            
            {/* Total Land Area - DIRECTLY BELOW Dimensions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📊 Total Land Area
                {form.lot_length && form.lot_width && (
                  <span className="text-green-600 text-xs ml-2">⚡ Auto-calculated from dimensions above</span>
                )}
              </label>
              <div className="flex gap-2">
                <input 
                  name="land_size_value" 
                  type="number" 
                  placeholder="Total area" 
                  value={form.land_size_value} 
                  onChange={handleChange} 
                  className="flex-1 px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900" 
                />
                <select 
                  name="land_size_unit" 
                  value={form.land_size_unit} 
                  onChange={handleChange} 
                  className="px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                >
                  <option value="sq ft">sq ft</option>
                  <option value="sq m">sq m</option>
                  <option value="acres">acres</option>
                  <option value="hectares">hectares</option>
                </select>
              </div>
              <p className="text-xs text-gray-700 mt-1">
                Editable for irregular lots or manual override
              </p>
            </div>
            
            {/* Year Built - IN SAME SECTION */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Year Built
                <span className="text-gray-700 text-xs ml-2">Optional - Builds buyer confidence</span>
              </label>
              <input 
                name="year_built" 
                type="number" 
                placeholder="e.g., 2020" 
                value={form.year_built} 
                onChange={handleChange} 
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900"
                min="1800"
                max={new Date().getFullYear()}
              />
            </div>
            <CompletionIncentive 
              fieldName="year_built"
              fieldType="yearBuilt" 
              isCompleted={!!form.year_built}
              userType="agent"
            />
          </div>

          {/* 5. DESCRIPTION & AI ASSISTANT (Content creation) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📝 Property Description
            </h3>
            
            {/* Description Field */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Description *</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe the property's features, location, and what makes it special..."
                rows={6}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 placeholder-gray-500"
              />
            </div>
            
            {/* AI Assistant - RIGHT BELOW Description */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <AIDescriptionAssistant
                propertyData={{
                  title: form.title,
                  propertyType: form.property_type,
                  bedrooms: form.bedrooms.toString(),
                  bathrooms: form.bathrooms.toString(),
                  price: form.price,
                  location: `${form.city || ''}, ${form.region || ''}`.replace(/^, |, $/, ''),
                  squareFootage: form.house_size_value ? `${form.house_size_value} ${form.house_size_unit}` : '',
                  features: [
                    ...(form.amenities || []),
                    form.year_built ? `Built in ${form.year_built}` : '',
                    form.land_size_value ? `${form.land_size_value} ${form.land_size_unit} lot` : '',
                    form.lot_length && form.lot_width ? `Lot dimensions: ${form.lot_length}' x ${form.lot_width}'` : ''
                  ].filter(Boolean),
                  rentalType: "sale"
                }}
                currentDescription={form.description}
                onDescriptionGenerated={(description) => setForm(prev => ({ ...prev, description }))}
              />
            </div>
          </div>

          {/* 6. AMENITIES & FEATURES (What makes it special) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-teal-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              ✨ Amenities & Features
            </h3>
            <div className="mb-4">
              <AmenitiesSelector
                value={form.amenities || []}
                onChange={(amenities) => {
                  setForm({
                    ...form,
                    amenities
                  });
                }}
              />
            </div>
            <CompletionIncentive 
              fieldName="amenities"
              fieldType="amenities" 
              isCompleted={Array.isArray(form.amenities) && form.amenities.length > 0}
              userType="agent"
            />
          </div>
          {/* 7. LOCATION DETAILS (Specific address info) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-pink-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📍 Location Details
            </h3>
            <p className="text-sm text-gray-600 mb-4">Country and region are selected above. Add specific location details below:</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specific Area/District</label>
                <input 
                  name="city" 
                  type="text" 
                  placeholder="e.g., Kitty, Campbellville, New Amsterdam" 
                  value={form.city} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 placeholder-gray-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Neighborhood/Street (Optional)</label>
                <input 
                  name="neighborhood" 
                  type="text" 
                  placeholder="e.g., Main Street, Sheriff Street" 
                  value={form.neighborhood} 
                  onChange={handleChange} 
                  className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 placeholder-gray-500" 
                />
              </div>
            </div>
          </div>

          {/* 8. CONTACT INFORMATION */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-emerald-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📞 Contact Information
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h4 className="font-medium text-blue-900 mb-2">How buyers will contact you</h4>
              <p className="text-sm text-blue-800">
                Interested buyers will be able to contact you through WhatsApp. Your contact details will only be shown to serious inquiries.
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
                <strong>Required:</strong> Include country code (+592 for Guyana). Most customers prefer WhatsApp for instant contact.
              </p>
              <div className="bg-green-50 p-3 rounded mt-2">
                <p className="text-sm text-green-800">
                  <strong>💬 Why WhatsApp?</strong> 90% of property inquiries in Guyana happen via WhatsApp. This ensures you get contacted quickly by serious buyers.
                </p>
              </div>
            </div>
          </div>

          {/* 9. PROPERTY IMAGES (Visual proof) */}
          <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-yellow-500">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              📸 Property Images
            </h3>
            <p className="text-gray-600 mb-6">Upload high-quality photos to attract more buyers. First image will be the main photo.</p>
            <EnhancedImageUpload
              images={images}
              setImages={handleImagesChange}
              maxImages={10}
            />
          </div>
          {/* 10. SUBMIT */}
          {/* Success message with options */}
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-8 rounded-xl shadow-sm">
              <div className="text-center">
                <div className="text-4xl mb-4">🎉</div>
                <div className="text-green-800 text-xl font-bold mb-4">{success}</div>
                <div className="space-y-4">
                  <p className="text-green-700 text-sm">What would you like to do next?</p>
                  <div className="flex gap-4 flex-wrap justify-center">
                    <button 
                      onClick={handleCreateAnother}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                    >
                      ➕ Create Another Property
                    </button>
                    <button 
                      onClick={handleGoToDashboard}
                      className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 transform hover:scale-105"
                    >
                      🏠 Go to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-red-500 text-2xl">⚠️</span>
                <div className="text-red-800 font-medium">{error}</div>
              </div>
            </div>
          )}
          
          {/* Submit Button - Sticky at bottom for mobile */}
          {!success && (
            <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-6 mt-8 -mx-8 px-8 pb-8">
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-lg py-4 rounded-xl font-bold shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Submitting Property...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    🚀 Submit Property for Review
                  </span>
                )}
              </button>
              <p className="text-center text-sm text-gray-700 mt-3">
                Your property will be reviewed by our team before going live
              </p>
            </div>
          )}
        </form>

        {/* Duplicate Warning Dialog */}
        {propertySubmission.duplicateDetection.showDuplicateWarning && 
         propertySubmission.duplicateDetection.potentialDuplicate && (
          <DuplicateWarningDialog
            potentialDuplicate={propertySubmission.duplicateDetection.potentialDuplicate}
            onConfirm={() => {
              propertySubmission.duplicateDetection.setShowDuplicateWarning(false);
              // Trigger form submission bypassing duplicate check
              const form = document.querySelector('form');
              if (form) {
                const event = new Event('submit', { bubbles: true, cancelable: true });
                Object.defineProperty(event, 'preventDefault', { value: () => {} });
                handleSubmit(event as any, true); // bypass duplicate check
              }
            }}
            onCancel={() => propertySubmission.duplicateDetection.setShowDuplicateWarning(false)}
          />
        )}

        {/* Success Screen */}
        {success && (
          <PropertySuccessScreen
            redirectPath="/dashboard/agent"
            userType="agent"
          />
        )}
      </div>
    </div>
  );
}
