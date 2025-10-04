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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("GY");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>("GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");

  const imageLimit = 15; // Landlords get more image uploads

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
    <main className="max-w-2xl mx-auto py-12 px-4">
      <div className="mb-6">
        <Link href="/dashboard/landlord" className="text-green-600 hover:underline text-sm">
          ← Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">🏠 Create Rental Property Listing</h1>
      
      {/* Completion Progress */}
      <CompletionProgress 
        completionPercentage={completionAnalysis.percentage}
        userType="landlord"
        missingFields={completionAnalysis.missingFields}
      />
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="font-semibold text-green-800 mb-2">Landlord Listing</h2>
        <p className="text-green-700 text-sm">
          You're creating a rental property listing. This will be marked as a rental property and displayed in the rental section of the website.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow">
        <input 
          name="title" 
          type="text" 
          placeholder="Property Title (e.g., 'Modern 2BR Apartment in Georgetown')*" 
          value={form.title} 
          onChange={handleChange} 
          className="w-full border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 text-gray-900 bg-white placeholder-gray-600 text-base" 
          required 
        />
        
        <textarea 
          name="description" 
          placeholder="Detailed description of your rental property*" 
          value={form.description} 
          onChange={handleChange} 
          className="w-full border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 text-gray-900 bg-white placeholder-gray-600 text-base" 
          required 
          rows={4} 
        />
        
        <GlobalSouthLocationSelector
          selectedCountry={selectedCountry}
          selectedRegion={selectedRegion}
          onLocationChange={handleLocationChange}
          onCurrencyChange={handleCurrencyChange}
        />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-bold text-gray-900 mb-2">💰 Rent ({currencySymbol})</label>
            <input 
              type="number" 
              name="price" 
              value={form.price} 
              onChange={handleChange} 
              required 
              className="w-full border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 text-gray-900 bg-white placeholder-gray-600 text-base" 
            />
          </div>
          <div>
            <label htmlFor="rentalType" className="block text-sm font-bold text-gray-900 mb-2">🗓️ Rental Period</label>
            <select 
              name="rentalType" 
              value={form.rentalType} 
              onChange={handleChange} 
              className="w-full border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 text-gray-900 bg-white text-base"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <input 
            name="location" 
            type="text" 
            placeholder="Property address or specific location" 
            value={form.location} 
            onChange={handleChange} 
            required
            className="w-full border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 text-gray-900 bg-white placeholder-gray-600 text-base" 
          />
          <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border-l-4 border-blue-400">
            <span className="font-medium text-blue-800">🔒 Privacy Protected:</span> Address is required for property verification only. It will never be shown to renters until you approve them.
          </div>
        </div>
        
        <select 
          name="propertyType" 
          value={form.propertyType} 
          onChange={handleChange} 
          className="w-full border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 text-gray-900 bg-white text-base"
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
            className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 text-gray-900 bg-white placeholder-gray-600 text-base" 
            required 
          />
          <input 
            name="bathrooms" 
            type="number" 
            placeholder="Bathrooms*" 
            value={form.bathrooms} 
            onChange={handleChange} 
            className="border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 text-gray-900 bg-white placeholder-gray-600 text-base" 
            required 
          />
        </div>
        
        <input 
          name="squareFootage" 
          type="number" 
          placeholder="Square Footage (Optional)" 
          value={form.squareFootage} 
          onChange={handleChange} 
          className="w-full border-2 border-gray-400 focus:border-blue-500 rounded-lg px-4 py-3 text-gray-900 bg-white placeholder-gray-600 text-base" 
        />
        
        <div className="mb-3 text-lg font-bold text-gray-900 border-b border-gray-200 pb-2">✨ Features/Amenities:</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {FEATURES.map(feature => (
            <label key={feature} className="flex items-center gap-2 text-gray-900 font-medium">
              <input 
                type="checkbox" 
                name="features" 
                value={feature} 
                checked={form.features.includes(feature)} 
                onChange={handleChange} 
                className="w-4 h-4 text-blue-600 border-2 border-gray-400 rounded focus:ring-blue-500"
              />
              {feature}
            </label>
          ))}
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
            By submitting this listing, I confirm under penalty of perjury that I am the legal owner of this property or have the legal authority to list it for rental.
          </span>
        </label>
        
        {error && <div className="text-red-500 text-sm font-semibold animate-shake">{error}</div>}
        {success && <div className="text-green-600 font-bold text-lg text-center">Property submitted! Redirecting to dashboard...</div>}
        
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200"
        >
          {isSubmitting ? "Submitting..." : "Submit Rental Listing"}
        </button>
      </form>
    </main>
  );
}