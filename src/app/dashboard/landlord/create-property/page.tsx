"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveCountries, getCountryRegions } from "@/lib/countries";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

const PROPERTY_TYPES = ["House", "Apartment", "Condo", "Townhouse", "Studio", "Room"];
const FEATURES = ["Pool", "Garage", "Garden", "Security", "Furnished", "AC", "Internet", "Pet Friendly", "Laundry", "Gym"];

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
      const supabase = createClient();
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }

      // Check if user is landlord
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, subscription_status')
        .eq('id', authUser.id)
        .single();

      if (!profile || profile.user_type !== 'landlord') {
        window.location.href = '/dashboard';
        return;
      }

      if (profile.subscription_status !== 'active') {
        window.location.href = '/dashboard/landlord';
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
    rentalType: "monthly",
  });
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [currency, setCurrency] = useState<string>("GYD");

  const imageLimit = 15; // Landlords get more image uploads

  useEffect(() => {
    getActiveCountries().then(setCountries);
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      getCountryRegions(selectedCountry).then(setRegions);
      const country = countries.find(c => c.code === selectedCountry);
      setCurrency(country?.currency || "GYD");
    }
  }, [selectedCountry, countries]);

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

  function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, imageLimit - form.images.length) as File[];
    setForm({ ...form, images: [...form.images, ...files] });
    setImagePreviews([...imagePreviews, ...files.map(f => URL.createObjectURL(f))]);
  }

  function handleRemoveImage(idx: number) {
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
    setImagePreviews(imagePreviews.filter((_, i) => i !== idx));
  }

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

    // Prepare images for upload
    const imagesForUpload = form.images.map((file: File) => ({
      name: file.name,
      type: file.type,
      data: file,
    }));

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
          currency,
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

      <h1 className="text-3xl font-bold text-green-700 mb-6">Create Rental Property Listing</h1>
      
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
          className="w-full border rounded-lg px-4 py-2" 
          required 
        />
        
        <textarea 
          name="description" 
          placeholder="Detailed description of your rental property*" 
          value={form.description} 
          onChange={handleChange} 
          className="w-full border rounded-lg px-4 py-2" 
          required 
          rows={4} 
        />
        
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select 
            name="country" 
            value={selectedCountry} 
            onChange={e => setSelectedCountry(e.target.value)} 
            required 
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">Select Country</option>
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">Region/City</label>
          <select 
            name="region" 
            value={selectedRegion} 
            onChange={e => setSelectedRegion(e.target.value)} 
            required 
            className="w-full border rounded-lg px-4 py-2"
          >
            <option value="">Select Region/City</option>
            {regions.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Rent ({currency})</label>
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
            <label htmlFor="rentalType" className="block text-sm font-medium text-gray-700 mb-1">Rental Period</label>
            <select 
              name="rentalType" 
              value={form.rentalType} 
              onChange={handleChange} 
              className="w-full border rounded-lg px-4 py-2"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
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
        
        <div className="mb-2 font-semibold">Features/Amenities:</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {FEATURES.map(feature => (
            <label key={feature} className="flex items-center gap-2">
              <input 
                type="checkbox" 
                name="features" 
                value={feature} 
                checked={form.features.includes(feature)} 
                onChange={handleChange} 
              />
              {feature}
            </label>
          ))}
        </div>
        
        <div className="mb-2 font-semibold">Property Images (max {imageLimit}):</div>
        <input 
          type="file" 
          accept="image/*" 
          multiple 
          onChange={handleImageUpload} 
          disabled={form.images.length >= imageLimit} 
          className="w-full"
        />
        
        <div className="flex flex-wrap gap-4 mt-2">
          {imagePreviews.map((src, idx) => (
            <div key={idx} className="relative">
              <img src={src} alt="Preview" className="h-24 w-32 object-cover rounded-lg border" />
              <button 
                type="button" 
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs" 
                onClick={() => handleRemoveImage(idx)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        
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