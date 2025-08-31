"use client";
import React, { useState } from "react";

export default function FSBORegistrationPage() {
  const [step, setStep] = useState<'register' | 'payment' | 'property'>('register');
  const [registration, setRegistration] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    plan: 'flat',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration form handlers
  const handleRegChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setRegistration(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Registration submit logic
  async function handleRegistrationSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    if (registration.password.length < 8) {
      alert("Password must be at least 8 characters.");
      setIsSubmitting(false);
      return;
    }
    if (registration.password !== registration.confirmPassword) {
      alert("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }
    const { createClientSupabaseClient } = await import("@/lib/supabaseClient");
    const supabase = createClientSupabaseClient();
    // 1. Create Supabase Auth user
    const { data: authUser, error: authError } = await supabase.auth.signUp({
      email: registration.email,
      password: registration.password,
      options: {
        data: {
          first_name: registration.first_name,
          last_name: registration.last_name,
          phone: registration.phone
        }
      }
    });
    if (authError || !authUser?.user) {
      alert("Registration failed: " + (authError?.message || "Auth error"));
      setIsSubmitting(false);
      return;
    }
    // 2. Insert into users table
    const { error: userError } = await supabase.from("users").insert({
      id: authUser.user.id,
      first_name: registration.first_name,
      last_name: registration.last_name,
      email: registration.email,
      phone: registration.phone,
      plan: registration.plan,
      user_type: "owner",
      created_at: new Date().toISOString(),
    });
    if (userError) {
      alert("Registration failed: " + userError.message);
      console.error(userError);
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    setStep("payment");
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md space-y-6">
      {step === 'register' && (
        <form className="space-y-6" onSubmit={handleRegistrationSubmit} autoComplete="off">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 text-center">FSBO Registration</h2>
          <div className="flex gap-4 mb-3">
            <input type="text" name="first_name" value={registration.first_name} onChange={handleRegChange} placeholder="First Name" className="w-full px-4 py-2 border border-gray-300 rounded" required />
            <input type="text" name="last_name" value={registration.last_name} onChange={handleRegChange} placeholder="Last Name" className="w-full px-4 py-2 border border-gray-300 rounded" required />
          </div>
          <input type="tel" name="phone" value={registration.phone} onChange={handleRegChange} placeholder="Phone Number" className="w-full px-4 py-2 border border-gray-300 rounded mb-3" required />
          <input type="email" name="email" value={registration.email} onChange={handleRegChange} placeholder="Email Address" className="w-full px-4 py-2 border border-gray-300 rounded mb-3" required />
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={registration.password}
              onChange={handleRegChange}
              placeholder="Password (min 8 characters)"
              className="w-full px-4 py-2 border border-gray-300 rounded pr-10"
              required
              autoComplete="new-password"
            />
              <div className="text-xs text-gray-500 mt-1">
                Password requirements:<br />
                &bull; Minimum 8 characters<br />
                &bull; At least one special character (e.g., !@#$%^&*)
              </div>
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-500"
              tabIndex={-1}
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.175-6.125M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M6.1 6.1A9.96 9.96 0 002 12c0 5.523 4.477 10 10 10a9.96 9.96 0 006.125-2.175" /></svg>
              )}
            </button>
          </div>
          <div className="relative mb-3">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={registration.confirmPassword}
              onChange={handleRegChange}
              placeholder="Confirm Password"
              className="w-full px-4 py-2 border border-gray-300 rounded pr-10"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-2 top-2 text-gray-500"
              tabIndex={-1}
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10a9.96 9.96 0 012.175-6.125M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0012 15a3 3 0 002.12-5.12M6.1 6.1A9.96 9.96 0 002 12c0 5.523 4.477 10 10 10a9.96 9.96 0 006.125-2.175" /></svg>
              )}
            </button>
          </div>
          <label className="block font-semibold text-lg mb-2 text-center">Choose Your Listing Plan</label>
          <div className="flex flex-col md:flex-row gap-6 justify-center mb-6">
            {/* Flat Rate Card */}
            <div className={`flex-1 rounded-xl shadow-lg border-2 ${registration.plan === "flat" ? "border-orange-600" : "border-gray-200"} bg-white p-6 flex flex-col items-center transition-all duration-200`} onClick={() => setRegistration({ ...registration, plan: "flat" })} style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl text-orange-600">&#128176;</span>
                <span className="font-bold text-xl text-orange-700">FSBO Flat Rate</span>
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">G$10,000 / 60 days</div>
              <ul className="text-sm text-gray-700 mb-2 list-disc list-inside">
                <li>All features included</li>
                <li>5 photos per property</li>
                <li>Basic support</li>
              </ul>
              <input type="radio" name="plan" value="flat" checked={registration.plan === "flat"} onChange={handleRegChange} className="mt-2" />
            </div>
            {/* Extended Card */}
            <div className={`flex-1 rounded-xl shadow-lg border-2 ${registration.plan === "extended" ? "border-blue-600" : "border-gray-200"} bg-white p-6 flex flex-col items-center transition-all duration-200`} onClick={() => setRegistration({ ...registration, plan: "extended" })} style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl text-blue-600">&#128200;</span>
                <span className="font-bold text-xl text-blue-700">Extended Listing</span>
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">G$15,000 / 90 days</div>
              <ul className="text-sm text-gray-700 mb-2 list-disc list-inside">
                <li>All features included</li>
                <li>10 photos per property</li>
                <li>Priority support</li>
              </ul>
              <input type="radio" name="plan" value="extended" checked={registration.plan === "extended"} onChange={handleRegChange} className="mt-2" />
            </div>
            {/* Premium Card */}
            <div className={`flex-1 rounded-xl shadow-lg border-2 ${registration.plan === "premium" ? "border-yellow-500" : "border-gray-200"} bg-white p-6 flex flex-col items-center transition-all duration-200`} onClick={() => setRegistration({ ...registration, plan: "premium" })} style={{ cursor: 'pointer' }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl text-yellow-500">&#11088;</span>
                <span className="font-bold text-xl text-yellow-700">Premium Listing</span>
              </div>
              <div className="text-lg font-bold text-gray-900 mb-1">G$25,000 / 180 days</div>
              <ul className="text-sm text-gray-700 mb-2 list-disc list-inside">
                <li>All features included</li>
                <li>15 photos per property</li>
                <li>Premium support</li>
              </ul>
              <input type="radio" name="plan" value="premium" checked={registration.plan === "premium"} onChange={handleRegChange} className="mt-2" />
            </div>
          </div>
          <div className="text-center">
            <button
              type="submit"
              className={`bg-orange-600 text-white font-semibold px-8 py-3 rounded-xl text-lg shadow transition-opacity duration-200 ${isSubmitting || !registration.first_name || !registration.last_name || !registration.phone || !registration.email || !registration.password || !registration.confirmPassword || registration.password.length < 8 || registration.password !== registration.confirmPassword ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700'}`}
              disabled={isSubmitting || !registration.first_name || !registration.last_name || !registration.phone || !registration.email || !registration.password || !registration.confirmPassword || registration.password.length < 8 || registration.password !== registration.confirmPassword}
            >
              {isSubmitting ? 'Registering...' : 'Register & Continue'}
            </button>
            <div className="mt-4 text-xs text-gray-600 max-w-md mx-auto">
              By pressing "Register & Continue" you confirm that you are the property owner and attest under penalty of perjury that you are the rightful owner. False claims may result in account suspension and legal action.
            </div>
          </div>
        </form>
      )}
      {/* Payment and property steps would go here */}
    </div>
  );
}
