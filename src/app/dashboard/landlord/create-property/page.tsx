"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlobalSouthLocationSelector from "@/components/GlobalSouthLocationSelector";
import EnhancedImageUpload from "@/components/EnhancedImageUpload";
import AIDescriptionAssistant from "@/components/AIDescriptionAssistant";
import { OwnershipAttestationFull } from "@/components/OwnershipAttestation";

// Simplified property types for Landlords - only 2 options
const PROPERTY_TYPES = [
  { value: "House", label: "House", icon: "🏠" },
  { value: "Apartment", label: "Apartment", icon: "🏢" },
];

// Simplified amenities for Landlords - showing 10 with user-friendly labels
// Value is what's stored in DB, label is what user sees
const VISIBLE_AMENITIES = [
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
  neighborhood: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string; // Hidden but kept for DB compatibility
  features: string[];
  status: string;
  images: File[];
  attestation: boolean;
  rentalType: string;
  lotLength: string; // Hidden but kept for DB compatibility
  lotWidth: string; // Hidden but kept for DB compatibility
  lotDimensionUnit: string; // Hidden but kept for DB compatibility
  owner_whatsapp: string;
  available_from: string;
};

export default function CreateLandlordProperty() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { createClient } = await import('@/supabase');
      const supabase = createClient();

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, subscription_status')
        .eq('id', authUser.id)
        .single();

      // Allow landlords and eligible admins
      const adminEmails = ['mrdarrenbuckner@gmail.com', 'qumar@guyanahomehub.com'];
      const isAdmin = profile?.user_type === 'admin' && adminEmails.includes(authUser.email || '');

      if (!profile || (profile.user_type !== 'landlord' && !isAdmin)) {
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
    neighborhood: "",
    propertyType: "House", // Default to House
    bedrooms: "",
    bathrooms: "",
    squareFootage: "", // Hidden but kept for DB compatibility
    features: [],
    status: "pending",
    images: [],
    attestation: false,
    rentalType: "monthly", // Default to monthly
    lotLength: "", // Hidden but kept for DB compatibility
    lotWidth: "", // Hidden but kept for DB compatibility
    lotDimensionUnit: "ft", // Hidden but kept for DB compatibility
    owner_whatsapp: "",
    available_from: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  // Default to Guyana (GY) as specified
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const imageLimit = 15; // Landlords get more image uploads

  // Validate phone number format
  const validatePhone = (phone: string): string | null => {
    if (!phone || phone.trim() === '') {
      return 'WhatsApp number is required';
    }
    if (!phone.startsWith('+')) {
      return 'Phone number must start with + and country code (e.g., +592)';
    }
    const digitsOnly = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    if (digitsOnly.length < 8) {
      return 'Phone number seems too short. Include country code + full number';
    }
    return null;
  };

  // Handle phone input with auto-prefix and validation
  const handlePhoneChange = (value: string) => {
    let processedValue = value.trim();
    if (processedValue && !processedValue.startsWith('+')) {
      const digitsOnly = processedValue.replace(/\D/g, '');
      if (digitsOnly.length >= 3 && /^[1-9]/.test(digitsOnly)) {
        processedValue = '+' + processedValue;
      }
    }
    setForm(prev => ({ ...prev, owner_whatsapp: processedValue }));
    if (phoneTouched) {
      setPhoneError(validatePhone(processedValue));
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    setPhoneError(validatePhone(form.owner_whatsapp || ''));
  };

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

  // Handle location and currency changes
  const handleLocationChange = (field: 'country' | 'region', value: string) => {
    if (field === 'country') {
      setSelectedCountry(value);
      setSelectedRegion('');
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
    const required: (keyof PropertyForm)[] = ["title", "description", "price", "propertyType", "bedrooms", "bathrooms", "location", "neighborhood", "attestation", "owner_whatsapp"];
    for (const field of required) {
      if (!form[field]) {
        setError(`Missing field: ${field}`);
        setIsSubmitting(false);
        return;
      }
    }

    // Validate neighborhood minimum length
    if (form.neighborhood.trim().length < 2) {
      setError("Neighborhood/Area must be at least 2 characters");
      setIsSubmitting(false);
      return;
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

    // Upload images directly to Supabase Storage with proper error handling
    let imageUrls: string[] = [];
    try {
      console.log('📤 Uploading images directly to Supabase Storage...');
      const { uploadImagesToSupabase } = await import('@/lib/supabaseImageUpload');
      const uploadedImages = await uploadImagesToSupabase(form.images, userId);
      imageUrls = uploadedImages.map(img => img.url);
      console.log(`✅ ${imageUrls.length} images uploaded successfully`);
    } catch (err: any) {
      console.error('Failed to upload images to storage:', err);
      setError(err?.message || 'Failed to upload images. Please check your internet connection and try again.');
      setIsSubmitting(false);
      return;
    }

    // Store rental property in DB via API
    try {
      const res = await fetch("/api/properties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageUrls: imageUrls,
          userId,
          status: "pending",
          country: selectedCountry,
          region: selectedRegion,
          currency: currencyCode,
          listing_type: "rent",
          available_from: form.available_from || null,
          city: selectedRegion,
          propertyCategory: "rental",
          site_id: selectedCountry === 'JM' ? 'jamaica' : 'guyana',
          lot_length: form.lotLength ? Number(form.lotLength) : null,
          lot_width: form.lotWidth ? Number(form.lotWidth) : null,
          lot_dimension_unit: form.lotDimensionUnit,
          owner_whatsapp: form.owner_whatsapp,
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
      setIsSubmitting(false);
      setTimeout(() => {
        router.push("/dashboard/landlord");
      }, 2500);
      return;
    } catch (err: any) {
      setError(err?.message || "Failed to submit property. Please try again.");
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Link href="/dashboard/landlord" className="text-green-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-green-700 mb-2">List My Rental Property</h1>
      <p className="text-gray-600 mb-6">Find quality tenants faster with a complete listing</p>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-green-800 mb-2">Rental Property Listing</h2>
        <p className="text-green-700 text-sm">
          Your rental will be displayed in the rental section of the website and tenants can contact you directly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow">

        {/* 1. PHOTOS FIRST - Hook users immediately */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200 mb-2">
          <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            📸 Show Tenants Your Property
          </h3>
          <p className="text-sm text-green-800 mb-4">
            Great photos attract quality tenants! Upload at least 1 photo (up to 15 max).
          </p>
          <EnhancedImageUpload
            images={form.images}
            setImages={handleImagesChange}
            maxImages={imageLimit}
          />
        </div>

        {/* 2. PROPERTY TYPE - 2 options only */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type *
          </label>
          <div className="grid grid-cols-2 gap-4">
            {PROPERTY_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setForm({ ...form, propertyType: type.value })}
                className={`p-4 rounded-lg border-2 text-center transition-all ${
                  form.propertyType === type.value
                    ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-3xl mb-1">{type.icon}</div>
                <div className="text-sm font-medium text-gray-700">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. MONTHLY RENT + CURRENCY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Your Asking Rent ({currencySymbol}/month) *
            </label>
            <input
              type="number"
              inputMode="numeric"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
              placeholder="150000"
              className="w-full border rounded-lg px-4 py-3 text-base"
            />
            <p className="text-sm text-gray-500 mt-1">
              {form.price && !isNaN(Number(form.price)) && Number(form.price) > 0
                ? `Displays as: ${currencySymbol}${Number(form.price).toLocaleString()}/month`
                : `Example format: 150,000 (enter digits only)`
              }
            </p>
          </div>
          <div>
            <label htmlFor="rentalType" className="block text-sm font-medium text-gray-700 mb-1">
              Rental Period
            </label>
            <select
              name="rentalType"
              value={form.rentalType}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-base"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>

        {/* AVAILABILITY */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            When is the property available?
          </label>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="availability_type"
                checked={!form.available_from}
                onChange={() => setForm(prev => ({ ...prev, available_from: "" }))}
                className="text-green-600"
              />
              <span className="text-sm font-medium text-gray-700">Available Now</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="availability_type"
                checked={!!form.available_from}
                onChange={() => setForm(prev => ({ ...prev, available_from: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }))}
                className="text-green-600"
              />
              <span className="text-sm font-medium text-gray-700">Available from a specific date</span>
            </label>
          </div>
          {!!form.available_from && (
            <div>
              <input
                type="date"
                name="available_from"
                value={form.available_from}
                min={new Date().toISOString().split('T')[0]}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-3 text-base"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your listing stays active — tenants will see when the property becomes available
              </p>
            </div>
          )}
        </div>

        {/* 4. COUNTRY (defaulted to GY) - NO REGION DROPDOWN */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
          <GlobalSouthLocationSelector
            selectedCountry={selectedCountry}
            selectedRegion={selectedRegion}
            onLocationChange={handleLocationChange}
            onCurrencyChange={handleCurrencyChange}
          />
        </div>

        {/* 5. NEIGHBORHOOD */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Neighborhood *
          </label>
          <input
            name="neighborhood"
            type="text"
            placeholder="e.g., Bel Air, Kitty, Campbellville, Queenstown"
            value={form.neighborhood}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 text-base"
            required
            minLength={2}
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">
            This helps tenants find properties in their preferred area
          </p>
        </div>

        {/* 6. FULL ADDRESS (for verification) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Property Address *
          </label>
          <input
            name="location"
            type="text"
            placeholder="Full property address for verification"
            value={form.location}
            onChange={handleChange}
            className="w-full border rounded-lg px-4 py-3 text-base"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            For verification only - not shown publicly to tenants
          </p>
        </div>

        {/* 7 & 8. BEDROOMS & BATHROOMS */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bedrooms *
            </label>
            <input
              name="bedrooms"
              type="number"
              inputMode="numeric"
              placeholder="2"
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
              placeholder="1"
              value={form.bathrooms}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 text-base"
              required
              min="0"
            />
          </div>
        </div>

        {/* 9. AMENITIES - 10 checkboxes only */}
        <div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
            <div className="flex items-start gap-3">
              <div className="text-blue-500 text-lg">💡</div>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Pro Tip: Select amenities first!</h4>
                <p className="text-sm text-blue-800">
                  The more amenities you select, the better our AI will describe your rental to attract quality tenants.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-2 font-semibold text-gray-700">Amenities & Features:</div>
          <div className="grid grid-cols-2 gap-2">
            {VISIBLE_AMENITIES.map(({ value, label }) => (
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
                  className="w-5 h-5 text-green-600 border-2 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
          {form.features.length > 0 && (
            <p className="text-sm text-green-600 mt-2">
              {form.features.length} amenities selected
            </p>
          )}
        </div>

        {/* 10. DESCRIPTION + AI Assistant */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What Makes This Rental Special? *
          </label>
          <textarea
            name="description"
            placeholder="Write at least 30-50 words about your rental... OR use the AI assistant below for professional descriptions! Describe what makes this property perfect for tenants."
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

        {/* AI Description Assistant */}
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
              location: form.neighborhood,
              squareFootage: form.squareFootage,
              features: form.features,
              rentalType: "rental"
            }}
            currentDescription={form.description}
            onDescriptionGenerated={(description) => setForm(prev => ({ ...prev, description }))}
          />
        </div>

        {/* 11. TITLE */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Property Title *
          </label>
          <input
            name="title"
            type="text"
            placeholder="e.g., 'Cozy 2BR Apartment in Kitty'"
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

        {/* 12. CONTACT WHATSAPP */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your WhatsApp Number *
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Tenants will contact you directly on WhatsApp
          </p>
          <input
            type="tel"
            name="owner_whatsapp"
            value={form.owner_whatsapp}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={handlePhoneBlur}
            placeholder="+592 123 4567"
            className={`w-full border rounded-lg px-4 py-3 text-base ${
              phoneError && phoneTouched ? 'border-red-500 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {phoneError && phoneTouched ? (
            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
              <span>⚠️</span> {phoneError}
            </p>
          ) : (
            <p className="text-sm text-gray-500 mt-1">
              <strong>Format:</strong> +592XXXXXXX (e.g., +5926227446)
            </p>
          )}
          <div className="bg-green-50 p-3 rounded mt-2">
            <p className="text-sm text-green-800">
              <strong>💬 Why WhatsApp?</strong> 90% of rental inquiries in Guyana happen via WhatsApp. This ensures you get contacted quickly by serious tenants.
            </p>
          </div>
        </div>

        {/* 13. OWNERSHIP ATTESTATION */}
        <OwnershipAttestationFull
          checked={form.attestation}
          onChange={(checked) => setForm({ ...form, attestation: checked })}
          countryCode={selectedCountry}
          listingType="rental"
        />

        {/* Error/Success Messages */}
        {error && <div className="text-red-500 text-sm font-semibold animate-shake">{error}</div>}
        {success && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-8 rounded-xl shadow-sm">
            <div className="text-center">
              <div className="text-4xl mb-4">🎉</div>
              <div className="text-green-800 text-xl font-bold mb-2">Rental submitted successfully!</div>
              <div className="text-green-700 text-sm">Redirecting to dashboard...</div>
            </div>
          </div>
        )}

        {/* 14. SUBMIT BUTTON */}
        {!success && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200"
          >
            {isSubmitting ? "Submitting..." : "🏡 List My Rental"}
          </button>
        )}
      </form>
    </main>
  );
}
