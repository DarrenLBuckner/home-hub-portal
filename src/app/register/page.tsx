"use client";
import React, { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
const requiredFields = ["phone", "email", "country", "years_experience"];

export default function RegistrationPage() {
  const [form, setForm] = useState({
    user_type: "agent",
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    country: "",
    years_experience: "",
    company_name: "",
    company_address: "",
    company_phone: "",
    company_email: "",
    license_number: "",
    license_type: "",
    specialties: "",
    target_region: "",
    business_desc: "",
    website: "",
    linkedin_profile: "",
    reference1_name: "",
    reference1_contact: "",
    reference1_phone: "",
    reference1_email: "",
    reference2_name: "",
    reference2_contact: "",
    reference2_phone: "",
    reference2_email: "",
    bio: "",
    social_media: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [redirect, setRedirect] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name as keyof typeof form]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    for (const field of requiredFields) {
      if (!form[field as keyof typeof form]) {
        setError(`Please fill out the required field: ${field}`);
        return;
      }
    }
    setLoading(true);
    const supabase = createClientComponentClient();
    const { error: dbError } = await supabase.from("agent_vetting").insert({
      ...form,
      status: "pending_review",
      submitted_at: new Date().toISOString(),
    });
    setLoading(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
  setSuccess(true);
  setTimeout(() => setRedirect(true), 500); // short delay for UX
  };

  if (success) {
    if (redirect) {
      if (typeof window !== 'undefined') {
        window.location.href = '/register-success';
      }
      return null;
    }
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 mt-10 animate-fade-in">
      <h1 className="text-3xl font-extrabold mb-2 text-teal-600 tracking-tight">Join Portal Home Hub</h1>
      <p className="mb-6 text-gray-600 text-lg">Unlock new opportunities. List, rent, or sell properties with confidence. Registration takes less than 3 minutes!</p>

      {/* Enterprise Agent Plan Selection */}
      <section className="mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Choose Your Agent Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Basic Agent */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col items-center hover:shadow-xl transition-all">
            <h3 className="text-lg font-bold text-green-700 mb-2">Basic Agent</h3>
            <div className="text-2xl font-extrabold text-green-700 mb-1">G$6,000<span className="text-base font-normal">/month</span></div>
            <ul className="mb-4 text-gray-700 text-sm space-y-1">
              <li>Perfect for new agents getting started</li>
              <li>5 active listings</li>
              <li>8 photos per property</li>
              <li>Basic support</li>
            </ul>
            <button className="mt-auto px-5 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition">Select</button>
          </div>
          {/* Pro Agent */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col items-center hover:shadow-xl transition-all">
            <h3 className="text-lg font-bold text-blue-700 mb-2">Pro Agent</h3>
            <div className="text-2xl font-extrabold text-blue-700 mb-1">G$11,000<span className="text-base font-normal">/month</span></div>
            <ul className="mb-4 text-gray-700 text-sm space-y-1">
              <li>Ideal for established agents</li>
              <li>20 active listings</li>
              <li>15 photos per property</li>
              <li>Priority support</li>
            </ul>
            <button className="mt-auto px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Select</button>
          </div>
          {/* Elite Agent */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col items-center hover:shadow-xl transition-all">
            <h3 className="text-lg font-bold text-yellow-700 mb-2">Elite Agent</h3>
            <div className="text-2xl font-extrabold text-yellow-700 mb-1">G$25,000<span className="text-base font-normal">/month</span></div>
            <ul className="mb-4 text-gray-700 text-sm space-y-1">
              <li>Top-performing agents and teams</li>
              <li>Unlimited listings*</li>
              <li>20 photos per property</li>
              <li>Premium support</li>
            </ul>
            <button className="mt-auto px-5 py-2 rounded-lg bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition">Select</button>
          </div>
        </div>
      </section>
      {/* End Enterprise Agent Plan Selection */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex gap-4">
          <select name="user_type" value={form.user_type} onChange={handleChange} className="border-2 border-teal-600 rounded-lg px-4 py-2 font-semibold bg-teal-50 focus:ring-2 focus:ring-teal-400">
            <option value="agent">Agent</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="first_name" type="text" placeholder="First Name" value={form.first_name} onChange={handleChange} className="border rounded-lg px-4 py-2" />
          <input name="last_name" type="text" placeholder="Last Name" value={form.last_name} onChange={handleChange} className="border rounded-lg px-4 py-2" />
          <input name="phone" type="text" placeholder="Phone*" value={form.phone} onChange={handleChange} required className="border-2 border-teal-600 bg-teal-50 rounded-lg px-4 py-2" />
          <input name="email" type="email" placeholder="Email*" value={form.email} onChange={handleChange} required className="border-2 border-teal-600 bg-teal-50 rounded-lg px-4 py-2" />
          <input name="country" type="text" placeholder="Country*" value={form.country} onChange={handleChange} required className="border-2 border-teal-600 bg-teal-50 rounded-lg px-4 py-2" />
          <input name="years_experience" type="number" placeholder="Years Experience*" value={form.years_experience} onChange={handleChange} required className="border-2 border-teal-600 bg-teal-50 rounded-lg px-4 py-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="company_name" type="text" placeholder="Company Name" value={form.company_name} onChange={handleChange} className="border rounded-lg px-4 py-2" />
          <input name="company_address" type="text" placeholder="Company Address" value={form.company_address} onChange={handleChange} className="border rounded-lg px-4 py-2" />
          <input name="company_phone" type="text" placeholder="Company Phone" value={form.company_phone} onChange={handleChange} className="border rounded-lg px-4 py-2" />
          <input name="company_email" type="email" placeholder="Company Email" value={form.company_email} onChange={handleChange} className="border rounded-lg px-4 py-2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="license_number" type="text" placeholder="License Number" value={form.license_number} onChange={handleChange} className="border rounded-lg px-4 py-2" />
          <input name="license_type" type="text" placeholder="License Type" value={form.license_type} onChange={handleChange} className="border rounded-lg px-4 py-2" />
          <input name="specialties" type="text" placeholder="Specialties" value={form.specialties} onChange={handleChange} className="border rounded-lg px-4 py-2" />
          <input name="target_region" type="text" placeholder="Target Region" value={form.target_region} onChange={handleChange} className="border rounded-lg px-4 py-2" />
        </div>
        <input name="business_desc" type="text" placeholder="Business Description" value={form.business_desc} onChange={handleChange} className="border rounded-lg px-4 py-2" />
        <input name="website" type="text" placeholder="Website" value={form.website} onChange={handleChange} className="border rounded-lg px-4 py-2" />
        <input name="linkedin_profile" type="text" placeholder="LinkedIn Profile" value={form.linkedin_profile} onChange={handleChange} className="border rounded-lg px-4 py-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input name="reference1_name" type="text" placeholder="Reference 1 Name*" value={form.reference1_name} onChange={handleChange} required className="border-2 border-orange-500 bg-orange-50 rounded-lg px-4 py-2" />
          <input name="reference1_contact" type="text" placeholder="Reference 1 Contact*" value={form.reference1_contact} onChange={handleChange} required className="border-2 border-orange-500 bg-orange-50 rounded-lg px-4 py-2" />
          <input name="reference1_phone" type="text" placeholder="Reference 1 Phone*" value={form.reference1_phone} onChange={handleChange} required className="border-2 border-orange-500 bg-orange-50 rounded-lg px-4 py-2" />
          <input name="reference1_email" type="email" placeholder="Reference 1 Email*" value={form.reference1_email} onChange={handleChange} required className="border-2 border-orange-500 bg-orange-50 rounded-lg px-4 py-2" />
          <input name="reference2_name" type="text" placeholder="Reference 2 Name*" value={form.reference2_name} onChange={handleChange} required className="border-2 border-orange-500 bg-orange-50 rounded-lg px-4 py-2" />
          <input name="reference2_contact" type="text" placeholder="Reference 2 Contact*" value={form.reference2_contact} onChange={handleChange} required className="border-2 border-orange-500 bg-orange-50 rounded-lg px-4 py-2" />
          <input name="reference2_phone" type="text" placeholder="Reference 2 Phone*" value={form.reference2_phone} onChange={handleChange} required className="border-2 border-orange-500 bg-orange-50 rounded-lg px-4 py-2" />
          <input name="reference2_email" type="email" placeholder="Reference 2 Email*" value={form.reference2_email} onChange={handleChange} required className="border-2 border-orange-500 bg-orange-50 rounded-lg px-4 py-2" />
        </div>
        <textarea name="bio" placeholder="Bio" value={form.bio} onChange={handleChange} className="border rounded-lg px-4 py-2" />
        <input name="social_media" type="text" placeholder="Social Media Links" value={form.social_media} onChange={handleChange} className="border rounded-lg px-4 py-2" />
        {error && <div className="text-red-500 text-sm font-semibold animate-shake">{error}</div>}
        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-teal-500 via-green-400 to-orange-400 text-white text-lg py-4 rounded-xl font-bold shadow-lg hover:scale-105 hover:from-teal-600 hover:to-orange-500 transition-all duration-200 animate-bounce-in">
          {loading ? "Submitting..." : "Register Now & Get Started!"}
        </button>
      </form>
    </div>
  );
}
