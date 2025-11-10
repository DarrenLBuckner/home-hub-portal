"use client";
import React, { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getActiveCountries, getCountryRegions } from "@/lib/countries";
import { createClient } from "@/supabase";

const PROPERTY_TYPES = ["House", "Apartment", "Land", "Commercial"];
const FEATURES = ["Pool", "Garage", "Garden", "Security", "Furnished", "AC", "Internet", "Pet Friendly"];

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
  subscriptionPlan?: string;
};

export default function CreatePropertyPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
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

  // Subscription plan logic (example: limit images)
  const imageLimit = 10; // TODO: get from user plan

  useEffect(() => {
    getActiveCountries().then(setCountries);
    
    // Get current user
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
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
    // Enforce image limits (example: max 10 images for premium, 3 for basic)
    const plan = form.subscriptionPlan || "basic";
    const maxImages = plan === "premium" ? 10 : 3;
    if (form.images.length > maxImages) {
      setError(`Image limit exceeded (${maxImages} allowed)`);
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
      form.images.map((file: File) => {
        return new Promise<{name: string, type: string, data: string}>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              name: file.name,
              type: file.type,
              data: e.target?.result as string,
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      })
    );
    // Store property in DB via API
    try {
      const res = await fetch("/api/properties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          images: imagesForUpload,
          userId,
          status: "pending",
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        setError(result.error || "Failed to submit property. Please try again.");
        setIsSubmitting(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/owner"), 2000);
    } catch (err: any) {
      setError(err?.message || "Failed to submit property. Please try again.");
    }
    setIsSubmitting(false);
  }

  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-orange-600 mb-6">Create Property Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow">
        <input name="title" type="text" placeholder="Property Title/Headline*" value={form.title} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" required />
        <textarea name="description" placeholder="Description*" value={form.description} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" required rows={4} />
        <div>
          <label htmlFor="country">Country</label>
          <select name="country" value={selectedCountry} onChange={e => setSelectedCountry(e.target.value)} required className="w-full border rounded-lg px-4 py-2">
            <option value="">Select Country</option>
            {countries.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="region">Region/City</label>
          <select name="region" value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)} required className="w-full border rounded-lg px-4 py-2">
            <option value="">Select Region/City</option>
            {regions.map(r => (
              <option key={r.id} value={r.name}>{r.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="price">Price ({currency})</label>
          <input type="number" name="price" value={form.price} onChange={handleChange} required className="w-full border rounded-lg px-4 py-2" />
        </div>
        <input name="location" type="text" placeholder="Location*" value={form.location} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" required />
        <select name="propertyType" value={form.propertyType} onChange={handleChange} className="w-full border rounded-lg px-4 py-2">
          {PROPERTY_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-4">
          <input name="bedrooms" type="number" placeholder="Bedrooms*" value={form.bedrooms} onChange={handleChange} className="border rounded-lg px-4 py-2" required />
          <input name="bathrooms" type="number" placeholder="Bathrooms*" value={form.bathrooms} onChange={handleChange} className="border rounded-lg px-4 py-2" required />
        </div>
        <input name="squareFootage" type="number" placeholder="Square Footage*" value={form.squareFootage} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" required />
        <div className="mb-2 font-semibold">Features/Amenities:</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {FEATURES.map(feature => (
            <label key={feature} className="flex items-center gap-2">
              <input type="checkbox" name="features" value={feature} checked={form.features.includes(feature)} onChange={handleChange} />
              {feature}
            </label>
          ))}
        </div>
        <div className="mb-2 font-semibold">Property Images (max {imageLimit}):</div>
        <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={form.images.length >= imageLimit} />
        <div className="flex flex-wrap gap-4 mt-2">
          {imagePreviews.map((src, idx) => (
            <div key={idx} className="relative">
              <img src={src} alt="Preview" className="h-24 w-32 object-cover rounded-lg border" />
              <button type="button" className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs" onClick={() => handleRemoveImage(idx)}>Remove</button>
            </div>
          ))}
        </div>
        <label className="flex items-center gap-2 mt-4">
          <input type="checkbox" name="attestation" checked={form.attestation} onChange={handleChange} required />
          <span className="text-sm font-semibold text-red-700">By submitting this listing, I confirm under penalty of perjury that I am the legal owner of this property or have the legal authority to list it for sale.</span>
        </label>
        {error && <div className="text-red-500 text-sm font-semibold animate-shake">{error}</div>}
        {success && <div className="text-green-600 font-bold text-lg text-center">Property submitted! Redirecting to dashboard...</div>}
        <button type="submit" disabled={isSubmitting} className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-yellow-400 to-teal-400 text-white font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200">
          {isSubmitting ? "Submitting..." : "Submit Listing"}
        </button>
      </form>
    </main>
  );
}
