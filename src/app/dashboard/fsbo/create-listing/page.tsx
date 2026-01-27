"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/supabase";
import GlobalSouthLocationSelector from "@/components/GlobalSouthLocationSelector";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import AIDescriptionAssistant from "@/components/AIDescriptionAssistant";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";

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
  listingType: string;
};

export default function CreateFSBOListing() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      // Check if user is FSBO or eligible admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, subscription_status')
        .eq('id', authUser.id)
        .single();

      if (!profile || (profile.user_type !== 'fsbo' && profile.user_type !== 'admin')) {
        window.location.href = '/dashboard';
        return;
      }

      // Check admin config for admin levels (Owner Admin and Super Admin can bypass)
      const adminConfig: { [email: string]: { level: string } } = {
        'mrdarrenbuckner@gmail.com': { level: 'super' },
        'qumar@guyanahomehub.com': { level: 'owner' }
      };
      
      const adminInfo = adminConfig[authUser.email];
      const isEligibleAdmin = profile.user_type === 'admin' && adminInfo && ['super', 'owner'].includes(adminInfo.level);

      // Allow if: eligible admin (super/owner) OR regular FSBO user
      if (!isEligibleAdmin && profile.user_type !== 'fsbo') {
        window.location.href = '/dashboard';
        return;
      }

      setUser(authUser);
      setLoading(false);
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
    listingType: "sale",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");

  const imageLimit = 8; // FSBO gets limited image uploads

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

    // Validate required fields
    const required: (keyof PropertyForm)[] = ["title", "description", "price", "location", "propertyType", "bedrooms", "bathrooms", "squareFootage", "attestation"];
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

    // Upload images directly to Supabase Storage (bypasses API payload limits)
    let imageUrls: string[] = [];
    try {
      console.log('📤 Uploading images directly to Supabase Storage...');
      const { uploadImagesToSupabase } = await import('@/lib/supabaseImageUpload');
      const uploadedImages = await uploadImagesToSupabase(form.images, userId);
      imageUrls = uploadedImages.map(img => img.url);
      console.log(`✅ ${imageUrls.length} images uploaded successfully`);
    } catch (err) {
      console.error('Failed to upload images to storage:', err);
      setError('Failed to upload images. Please try again.');
      setIsSubmitting(false);
      return;
    }

    // Store property in DB via API - only send URLs, not image data
    try {
      const res = await fetch("/api/properties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          images: undefined, // Don't send File objects
          imageUrls: imageUrls, // Send URLs instead
          userId,
          status: "pending",
          country: selectedCountry,
          region: selectedRegion,
          currency: currencyCode,
          propertyCategory: "sale", // Mark as sale property
          site_id: selectedCountry === 'JM' ? 'jamaica' : 'guyana',  // Dynamic site_id based on country
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to submit property. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard/fsbo"), 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to submit property. Please try again.");
    }
    setIsSubmitting(false);
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Link href="/dashboard/fsbo" className="text-orange-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-orange-700 mb-6">Create Property Listing (FSBO)</h1>
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-orange-800 mb-2">For Sale By Owner</h2>
        <p className="text-orange-700 text-sm">
          You're creating a FSBO property listing. This will be marked as for sale and displayed in the sale section of the website.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow">
        <input 
          name="title" 
          type="text" 
          placeholder="Property Title (e.g., 'Beautiful 3BR House in Georgetown')*" 
          value={form.title} 
          onChange={handleChange} 
          className="w-full border rounded-lg px-4 py-2" 
          required 
        />
        
        <GlobalSouthLocationSelector
          selectedCountry={selectedCountry}
          selectedRegion={selectedRegion}
          onLocationChange={handleLocationChange}
          onCurrencyChange={handleCurrencyChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Sale Price ({currencySymbol})</label>
            <input 
              type="number" 
              name="price" 
              value={form.price} 
              onChange={handleChange} 
              required 
              className="w-full border rounded-lg px-4 py-2" 
            />
          </div>
          <div>
            <label htmlFor="listingType" className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
            <select 
              name="listingType" 
              value={form.listingType} 
              onChange={handleChange} 
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
          </div>
        </div>
        
        <input 
          name="location" 
          type="text" 
          placeholder="Specific address or area*" 
          value={form.location} 
          onChange={handleChange} 
          className="w-full border rounded-lg px-4 py-2" 
          required 
        />
        
        <select 
          name="propertyType" 
          value={form.propertyType} 
          onChange={handleChange} 
          className="w-full border rounded-lg px-4 py-2"
        >
          {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        
        <div className="grid grid-cols-2 gap-4">
          <input 
            name="bedrooms" 
            type="number" 
            placeholder="Bedrooms*" 
            value={form.bedrooms} 
            onChange={handleChange} 
            className="border rounded-lg px-4 py-2" 
            required 
          />
          <input 
            name="bathrooms" 
            type="number" 
            placeholder="Bathrooms*" 
            value={form.bathrooms} 
            onChange={handleChange} 
            className="border rounded-lg px-4 py-2" 
            required 
          />
        </div>
        
        <input 
          name="squareFootage" 
          type="number" 
          placeholder="Square Footage*" 
          value={form.squareFootage} 
          onChange={handleChange} 
          className="w-full border rounded-lg px-4 py-2" 
          required 
        />

        {/* Features/Amenities Section - Moved to before description */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-500 text-lg">💡</div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Pro Tip: Select features first!</h4>
              <p className="text-sm text-blue-800">
                The more features you select here, the better our AI will generate your property description. 
                Each feature gives the AI more context to create compelling, detailed descriptions for buyers.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mb-2 font-semibold">Features/Amenities:</div>
        <div className="grid grid-cols-2 gap-2 mb-6">
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

        {/* Property Description - Moved to after features */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Property Description *</label>
          <textarea 
            name="description" 
            placeholder="Write at least 30-50 words about your property... OR use the AI assistant below for professional descriptions! The more details you provide, the better the AI can help. Describe what makes this property special for buyers." 
            value={form.description} 
            onChange={handleChange} 
            className="w-full border rounded-lg px-4 py-2 placeholder-gray-400" 
            required 
            rows={6} 
          />
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span>💡 Tip: {form.description.trim().split(/\s+/).filter(word => word.length > 0).length < 30 ? `Add ${30 - form.description.trim().split(/\s+/).filter(word => word.length > 0).length} more words for better AI results` : 'Great! AI can now generate excellent descriptions'}</span>
            <span className={form.description.trim().split(/\s+/).filter(word => word.length > 0).length >= 30 ? 'text-green-600' : 'text-amber-600'}>{form.description.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
          </div>
        </div>
        
        {/* AI Description Assistant */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 mb-6">
          <div className="mb-3 text-sm text-blue-800">
            <span className="font-medium">🤖 AI Power Boost:</span> You've selected {form.features.length} features above - this gives the AI more context to create amazing descriptions!
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
              rentalType: "sale"
            }}
            currentDescription={form.description}
            onDescriptionGenerated={(description) => setForm(prev => ({ ...prev, description }))}
          />
        </div>
        

        
        <EnhancedImageUpload
          images={form.images}
          setImages={handleImagesChange}
          maxImages={imageLimit}
        />
        
        <label className="flex items-center gap-2 mt-4">
          <input 
            type="checkbox" 
            name="attestation" 
            checked={form.attestation} 
            onChange={handleChange} 
            required 
          />
          <span className="text-sm font-semibold text-red-700">
            By submitting this listing, I confirm under penalty of perjury that I am the legal owner of this property or have the legal authority to list it for sale.
          </span>
        </label>
        
        {error && <div className="text-red-500 text-sm font-semibold animate-shake">{error}</div>}
        {success && <div className="text-green-600 font-bold text-lg text-center">Property submitted! Redirecting to dashboard...</div>}
        
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200"
        >
          {isSubmitting ? "Submitting..." : "Submit Property Listing"}
        </button>
      </form>
    </main>
  );
}