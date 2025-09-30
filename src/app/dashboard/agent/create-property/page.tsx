
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
  });
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");

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
    // Reset form to initial state
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!form.property_type) {
      setError('Please select a Property Type.');
      setLoading(false);
      return;
    }
    
    if (!form.listing_type) {
      setError('Please select a Listing Type (For Sale or For Rent).');
      setLoading(false);
      return;
    }

    if (images.length < 1) {
      setError("Please upload at least one image.");
      setLoading(false);
      return;
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
          // userId will be extracted server-side from authenticated session
          propertyCategory: form.listing_type === 'sale' ? 'sale' : 'rental', // Map to API format
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
      
    } catch (authError) {
      console.error('❌ Property creation failed:', authError);
      setError("Failed to create property. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Create New Property (Agent)</h2>
      
      {/* Completion Progress */}
      <CompletionProgress 
        completionPercentage={completionAnalysis.percentage}
        userType="agent"
        missingFields={completionAnalysis.missingFields}
      />
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">📋 Basic Info</h3>
          <GlobalSouthLocationSelector
            selectedCountry={selectedCountry}
            selectedRegion={selectedRegion}
            onLocationChange={handleLocationChange}
            onCurrencyChange={handleCurrencyChange}
          />
          <input name="title" type="text" placeholder="Property Title" value={form.title} onChange={handleChange} required className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full mb-3 text-gray-900 bg-white placeholder-gray-600 text-base" />
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full mb-3 text-gray-900 bg-white placeholder-gray-600 text-base min-h-[100px]" />
          <input name="price" type="number" placeholder={`Price (${currencySymbol})`} value={form.price} onChange={handleChange} required className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full mb-3 text-gray-900 bg-white placeholder-gray-600 text-base" />
        </div>
        {/* Property Details */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">🏠 Property Details</h3>
          {/* Property Type Dropdown */}
          <div className="mb-3">
            <select 
              name="property_type" 
              value={form.property_type} 
              onChange={handleChange} 
              className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full text-gray-900 bg-white text-base"
              required
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
          
          {/* Listing Type Dropdown */}
          <div className="mb-3">
            <select 
              name="listing_type" 
              value={form.listing_type} 
              onChange={handleChange} 
              className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full text-gray-900 bg-white text-base"
              required
            >
              <option value="sale">🏠 For Sale</option>
              <option value="rent">🏡 For Rent</option>
            </select>
          </div>
          <input name="bedrooms" type="number" placeholder="Bedrooms" value={form.bedrooms} onChange={handleChange} className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full mb-3 text-gray-900 bg-white placeholder-gray-600 text-base" />
          <input name="bathrooms" type="number" placeholder="Bathrooms" value={form.bathrooms} onChange={handleChange} className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full mb-3 text-gray-900 bg-white placeholder-gray-600 text-base" />
          {/* House Size */}
          <div className="flex gap-2 mb-3">
            <input name="house_size_value" type="number" placeholder="House Size (Optional - Privacy Friendly)" value={form.house_size_value} onChange={handleChange} className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-1/2 text-gray-900 bg-white placeholder-gray-600 text-base" />
            <select name="house_size_unit" value={form.house_size_unit} onChange={handleChange} className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-1/2 text-gray-900 bg-white text-base">
              <option value="sq ft">Sq Ft</option>
              <option value="sq m">Sq M</option>
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
            </select>
          </div>
          <CompletionIncentive 
            fieldName="house_size_value"
            fieldType="squareFootage" 
            isCompleted={!!form.house_size_value}
            userType="agent"
          />
          {/* Land Size */}
          <div className="flex gap-2 mb-3">
            <input name="land_size_value" type="number" placeholder="Land Size" value={form.land_size_value} onChange={handleChange} className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-1/2 text-gray-900 bg-white placeholder-gray-600 text-base" />
            <select name="land_size_unit" value={form.land_size_unit} onChange={handleChange} className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-1/2 text-gray-900 bg-white text-base">
              <option value="sq ft">Sq Ft</option>
              <option value="sq m">Sq M</option>
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
            </select>
          </div>
          {/* Location field moved to Basic Info as dropdown */}
          <input name="year_built" type="number" placeholder="Year Built (Optional - Builds Buyer Confidence)" value={form.year_built} onChange={handleChange} className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full mb-3 text-gray-900 bg-white placeholder-gray-600 text-base" />
          <CompletionIncentive 
            fieldName="year_built"
            fieldType="yearBuilt" 
            isCompleted={!!form.year_built}
            userType="agent"
          />
          
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
        {/* Additional Location Details */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">📍 Additional Location Details</h3>
          <p className="text-sm text-gray-600 mb-3">Country and region are selected above. Add specific location details below:</p>
          <input name="city" type="text" placeholder="Specific Area/District (e.g., Kitty, Campbellville, New Amsterdam)" value={form.city} onChange={handleChange} className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full mb-3 text-gray-900 bg-white placeholder-gray-600 text-base" />
          <input name="neighborhood" type="text" placeholder="Neighborhood/Street (Optional - e.g., Main Street, Sheriff Street)" value={form.neighborhood} onChange={handleChange} className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full mb-3 text-gray-900 bg-white placeholder-gray-600 text-base" />
        </div>
  {/* Agent Details (hidden for agent form) */}
        {/* Status */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">⚡ Status</h3>
          <select name="status" value={form.status} onChange={handleChange} className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 w-full text-gray-900 bg-white text-base">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
        </div>
        {/* Enhanced image upload */}
        {/* Property Images */}
        <div>
          <h3 className="text-lg font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2">📸 Property Images</h3>
          <p className="text-gray-600 mb-4">Upload high-quality photos of your property</p>
          <EnhancedImageUpload
            images={images}
            setImages={handleImagesChange}
            maxImages={10}
          />
        </div>
        {/* Success message with options */}
        {success && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <div className="text-green-700 text-lg font-semibold mb-4">{success}</div>
            <div className="space-y-3">
              <p className="text-green-600 text-sm">What would you like to do next?</p>
              <div className="flex gap-3 flex-wrap">
                <button 
                  onClick={handleCreateAnother}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                >
                  ➕ Create Another Property
                </button>
                <button 
                  onClick={handleGoToDashboard}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-gray-700 transition"
                >
                  🏠 Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error and submit */}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        
        {!success && (
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition">
            {loading ? "Submitting..." : "Submit Property"}
          </button>
        )}
      </form>
    </div>
  );
}
