"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/supabase";
import GlobalSouthLocationSelector from "@/components/GlobalSouthLocationSelector";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import AIDescriptionAssistant from "@/components/AIDescriptionAssistant";
import OwnershipAttestation from "@/components/OwnershipAttestation";

// Simplified property types for FSBO (UI only - database still supports all types)
const PROPERTY_TYPES = [
  { value: "House", label: "House" },
  { value: "Apartment", label: "Apartment" },
  { value: "Condo", label: "Condo" },
  { value: "Land", label: "Land" },
  { value: "Commercial", label: "Commercial Building" },
];

// Simplified amenities for FSBO - showing 10 with user-friendly labels
// Value is what's stored in DB, label is what user sees
const VISIBLE_FEATURES = [
  { value: "AC", label: "Air Conditioning" },
  { value: "Pool", label: "Swimming Pool" },
  { value: "Garage", label: "Garage" },
  { value: "Garden", label: "Garden" },
  { value: "Gated", label: "Gated Community" },
  { value: "Backup Generator", label: "Generator" },
  { value: "Internet", label: "Internet Ready" },
  { value: "Laundry", label: "Laundry Room" },
  { value: "Balcony", label: "Balcony/Patio" },
  { value: "Parking", label: "Parking" },
];

type PropertyForm = {
  title: string;
  description: string;
  price: string;
  location: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string; // Keep in form state for DB compatibility
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

      const adminInfo = adminConfig[authUser.email || ''];
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
    propertyType: "House", // Default to House
    bedrooms: "",
    bathrooms: "",
    squareFootage: "", // Hidden but kept for DB compatibility
    features: [],
    status: "pending",
    images: [],
    attestation: false,
    listingType: "sale",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  // Default to Guyana (GY) as specified
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");

  const imageLimit = 8; // FSBO gets limited image uploads

  // Check if property type requires bedrooms/bathrooms
  const requiresBedsBaths = form.propertyType === "House";

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
      // Use functional update to avoid stale closure issues
      setForm(prev => ({
        ...prev,
        features: checked ? [...prev.features, value] : prev.features.filter(f => f !== value)
      }));
    } else if (type === "checkbox" && name === "attestation") {
      const checked = (e.target as HTMLInputElement).checked;
      setForm(prev => ({ ...prev, attestation: checked }));
    } else {
      // Use functional update to ensure we always have the latest state
      // This fixes the issue where AI-generated descriptions couldn't be edited
      setForm(prev => ({ ...prev, [name]: value }));
    }
  }

  // Handle property type change - clear beds/baths when switching to Land or Commercial
  const handlePropertyTypeChange = (value: string) => {
    setForm(prev => ({
      ...prev,
      propertyType: value,
      // Clear beds/baths when switching away from House
      bedrooms: value === "House" ? prev.bedrooms : "",
      bathrooms: value === "House" ? prev.bathrooms : "",
    }));
  };

  // Handle images through the enhanced component
  const handleImagesChange = (images: File[]) => {
    setForm({ ...form, images });
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsSubmitting(true);

    // Validate required fields - conditional based on property type
    // Removed squareFootage from required fields
    const baseRequired: (keyof PropertyForm)[] = ["title", "description", "price", "location", "propertyType", "attestation"];

    for (const field of baseRequired) {
      if (!form[field]) {
        setError(`Missing field: ${field}`);
        setIsSubmitting(false);
        return;
      }
    }

    // Only validate beds/baths for House type
    if (form.propertyType === "House") {
      if (!form.bedrooms) {
        setError("Number of bedrooms is required for houses");
        setIsSubmitting(false);
        return;
      }
      if (!form.bathrooms) {
        setError("Number of bathrooms is required for houses");
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
      if (!res.ok || !result.success) {
        // Provide more specific error message based on the error type
        let errorMessage = result.error || "Failed to submit property. Please try again.";
        if (result.details?.hint) {
          errorMessage = `${result.error} ${result.details.hint}`;
        }
        setError(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Log image status for debugging
      if (result.imageStatus) {
        console.log(`📸 Image status: ${result.imageStatus.linked}/${result.imageStatus.uploaded} images linked`);
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

        {/* 1. PHOTOS FIRST - Hook users immediately */}
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200 mb-2">
          <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
            📸 Step 1: Add Photos
          </h3>
          <p className="text-sm text-orange-800 mb-4">
            Great photos sell properties faster! Upload at least 1 photo (up to 8 max).
          </p>
          <EnhancedImageUpload
            images={form.images}
            setImages={handleImagesChange}
            maxImages={imageLimit}
          />
        </div>

        {/* 2. PROPERTY TYPE - 3 options only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handlePropertyTypeChange(type.value)}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  form.propertyType === type.value
                    ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-2xl mb-1">
                  {type.value === 'House' ? '🏠' : type.value === 'Land' ? '🌿' : '🏢'}
                </div>
                <div className="text-sm font-medium text-gray-700">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. PRICE + CURRENCY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              {form.listingType === 'rent' ? 'Monthly Rent' : 'Sale Price'} ({currencySymbol}) *
            </label>
            <input
              type="number"
              inputMode="numeric"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              placeholder="25000000"
              className="w-full border rounded-lg px-4 py-3 text-base"
            />
            <p className="text-sm text-gray-500 mt-1">
              {form.price && !isNaN(Number(form.price)) && Number(form.price) > 0
                ? `Displays as: ${currencySymbol}${Number(form.price).toLocaleString()}`
                : `Example format: 25,000,000 (enter digits only)`
              }
            </p>
          </div>
          <div>
            <label htmlFor="listingType" className="block text-sm font-medium text-gray-700 mb-1">Listing Type</label>
            <select
              name="listingType"
              value={form.listingType}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-base"
            >
              <option value="sale">For Sale</option>
              <option value="rent">For Rent</option>
            </select>
          </div>
        </div>

        {/* 4. COUNTRY (defaulted to GY) + REGION */}
        <GlobalSouthLocationSelector
          selectedCountry={selectedCountry}
          selectedRegion={selectedRegion}
          onLocationChange={handleLocationChange}
          onCurrencyChange={handleCurrencyChange}
        />

        {/* 5. ADDRESS/LOCATION */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Address/Location *
          </label>
          <input
            name="location"
            type="text"
            placeholder="e.g., Lot 5 Lamaha Gardens, Georgetown"
            value={form.location}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 text-base"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter the specific address or area where your property is located
          </p>
        </div>

        {/* 6 & 7. BEDROOMS & BATHROOMS - Only for House type */}
        {requiresBedsBaths && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bedrooms *
              </label>
              <input
                name="bedrooms"
                type="number"
                inputMode="numeric"
                placeholder="3"
                value={form.bedrooms}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bathrooms *
              </label>
              <input
                name="bathrooms"
                type="number"
                inputMode="numeric"
                placeholder="2"
                value={form.bathrooms}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base"
                required
                min="0"
              />
            </div>
          </div>
        )}

        {/* Square Footage - HIDDEN from UI but kept in form state for DB compatibility */}
        {/* This field is no longer shown to users but data can still be submitted if needed */}

        {/* 8. AMENITIES - 10 checkboxes only */}
        <div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 text-lg">💡</div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Pro Tip: Select features first!</h4>
                <p className="text-sm text-blue-800">
                  The more features you select, the better our AI will generate your property description.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-2 font-semibold text-gray-700">Features/Amenities:</div>
          <div className="grid grid-cols-2 gap-2">
            {VISIBLE_FEATURES.map(({ value, label }) => (
              <label
                key={value}
                className="flex items-center gap-3 text-gray-900 font-medium cursor-pointer hover:bg-gray-50 p-3 rounded-lg border border-transparent hover:border-gray-200 active:bg-gray-100"
              >
                <input
                  type="checkbox"
                  name="features"
                  value={value}
                  checked={form.features.includes(value)}
                  onChange={handleChange}
                  className="w-5 h-5 text-orange-600 border-2 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
          {form.features.length > 0 && (
            <p className="text-sm text-green-600 mt-2">
              {form.features.length} features selected
            </p>
          )}
        </div>

        {/* 9. DESCRIPTION + AI Assistant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Property Description *</label>
          <textarea
            name="description"
            placeholder="Write at least 30-50 words about your property... OR use the AI assistant below for professional descriptions! Describe what makes this property special for buyers."
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 text-base placeholder-gray-400"
            required
            rows={6}
          />
          <div className="mt-2 text-xs text-gray-500 flex justify-between">
            <span>💡 Tip: {form.description.trim().split(/\s+/).filter(word => word.length > 0).length < 30 ? `Add ${30 - form.description.trim().split(/\s+/).filter(word => word.length > 0).length} more words for better AI results` : 'Great! AI can now generate excellent descriptions'}</span>
            <span className={form.description.trim().split(/\s+/).filter(word => word.length > 0).length >= 30 ? 'text-green-600' : 'text-amber-600'}>{form.description.trim().split(/\s+/).filter(word => word.length > 0).length} words</span>
          </div>
        </div>

        {/* AI Description Assistant - Unchanged as requested */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
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
              rentalType: form.listingType === 'rent' ? 'rent' : 'sale'
            }}
            currentDescription={form.description}
            onDescriptionGenerated={(description) => setForm(prev => ({ ...prev, description }))}
          />
        </div>

        {/* 10. TITLE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Title *
          </label>
          <input
            name="title"
            type="text"
            placeholder="e.g., 'Beautiful 3BR House in Georgetown'"
            value={form.title}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 text-base"
            required
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            {form.title.length}/100 characters - Make it descriptive and appealing!
          </p>
        </div>

        {/* 11. OWNERSHIP ATTESTATION - Unchanged as requested */}
        <OwnershipAttestation
          checked={form.attestation}
          onChange={(checked) => setForm({ ...form, attestation: checked })}
          countryCode={selectedCountry}
          listingType={form.listingType === 'rent' ? 'rental' : 'sale'}
        />

        {/* Error/Success Messages */}
        {error && <div className="text-red-500 text-sm font-semibold animate-shake">{error}</div>}
        {success && <div className="text-green-600 font-bold text-lg text-center">Property submitted! Redirecting to dashboard...</div>}

        {/* 12. SUBMIT BUTTON */}
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
