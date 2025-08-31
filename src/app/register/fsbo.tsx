"use client";
import { useState } from 'react';

export default function FSBORegistrationPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    property_address: "",
    country: "",
    ownership_status: "yes",
    years_ownership: "",
    property_type: "house",
    bio: "",
    agree: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!form.first_name || !form.last_name || !form.email || !form.phone || !form.property_address || !form.country || !form.agree) {
      setError("Please fill out all required fields and agree to the terms.");
      return;
    }
    setLoading(true);
    // TODO: Submit to Supabase or backend
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1200);
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-10 text-center animate-fade-in">
        <h2 className="text-2xl font-bold mb-4 text-orange-700">Registration Received</h2>
        <p className="text-lg text-gray-700">Thank you for registering as a property owner. We will review your information and contact you soon.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-10 animate-fade-in">
      <h1 className="text-3xl font-extrabold mb-2 text-orange-600 tracking-tight">Join Portal Home Hub</h1>
      <p className="mb-6 text-gray-600 text-lg">Unlock new opportunities. List, rent, or sell properties with confidence. Registration takes less than 3 minutes!</p>
      <h2 className="text-xl font-bold mb-4 text-gray-800">FSBO Listing Plan</h2>
      <div className="bg-orange-50 rounded-2xl shadow border border-orange-200 p-6 flex flex-col items-center mb-8">
        <h3 className="text-lg font-bold text-orange-700 mb-2">Flat Rate</h3>
        <div className="text-2xl font-extrabold text-orange-700 mb-1">G$10,000<span className="text-base font-normal">/60 days</span></div>
        <ul className="mb-4 text-gray-700 text-sm space-y-1">
          <li>List your property for 60 days</li>
          <li>All features included</li>
        </ul>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="first_name" type="text" placeholder="First Name*" value={form.first_name} onChange={handleChange} className="border rounded-lg px-4 py-2" required />
          <input name="last_name" type="text" placeholder="Last Name*" value={form.last_name} onChange={handleChange} className="border rounded-lg px-4 py-2" required />
          <input name="email" type="email" placeholder="Email*" value={form.email} onChange={handleChange} className="border rounded-lg px-4 py-2" required />
          <input name="phone" type="text" placeholder="Phone*" value={form.phone} onChange={handleChange} className="border rounded-lg px-4 py-2" required />
        </div>
        <input name="property_address" type="text" placeholder="Property Address*" value={form.property_address} onChange={handleChange} className="border rounded-lg px-4 py-2" required />
        <input name="country" type="text" placeholder="Country*" value={form.country} onChange={handleChange} className="border rounded-lg px-4 py-2" required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select name="ownership_status" value={form.ownership_status} onChange={handleChange} className="border rounded-lg px-4 py-2">
            <option value="yes">I am the legal owner</option>
            <option value="no">I am not the legal owner</option>
          </select>
          <input name="years_ownership" type="number" placeholder="Years of Ownership" value={form.years_ownership} onChange={handleChange} className="border rounded-lg px-4 py-2" />
        </div>
        <select name="property_type" value={form.property_type} onChange={handleChange} className="border rounded-lg px-4 py-2">
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="land">Land</option>
          <option value="commercial">Commercial</option>
        </select>
        <textarea name="bio" placeholder="Bio/Description" value={form.bio} onChange={handleChange} className="border rounded-lg px-4 py-2" />
        <label className="flex items-center gap-2">
          <input name="agree" type="checkbox" checked={form.agree} onChange={handleChange} />
          <span>I agree to the terms and conditions</span>
        </label>
        {error && <div className="text-red-500 text-sm font-semibold animate-shake">{error}</div>}
        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-500 via-yellow-400 to-teal-400 text-white text-lg py-4 rounded-xl font-bold shadow-lg hover:scale-105 transition-all duration-200">
          {loading ? "Submitting..." : "Register as Owner"}
        </button>
      </form>
    </div>
  );
}
