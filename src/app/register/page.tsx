"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const countries = [
  { code: 'GY', name: 'Guyana', currency: 'GYD', symbol: 'G$' },
  { code: 'JM', name: 'Jamaica', currency: 'JMD', symbol: 'J$' },
  { code: 'TT', name: 'Trinidad & Tobago', currency: 'TTD', symbol: 'TT$' },
  { code: 'BB', name: 'Barbados', currency: 'BBD', symbol: 'Bds$' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$' },
];

const agentPlans = [
  {
    id: 'basic',
    name: 'Basic Agent',
    listings: '5 listings',
    photos: '8 photos/property',
    support: 'Basic support',
    pricing: { GYD: 6000, JMD: 12000, TTD: 400, BBD: 150, USD: 75, CAD: 100 },
    color: 'green',
    recommended: false
  },
  {
    id: 'pro',
    name: 'Pro Agent',
    listings: '20 listings',
    photos: '15 photos/property',
    support: 'Priority support',
    pricing: { GYD: 11000, JMD: 22000, TTD: 750, BBD: 275, USD: 135, CAD: 180 },
    color: 'blue',
    recommended: true
  },
  {
    id: 'elite',
    name: 'Elite Agent',
    listings: 'Unlimited listings',
    photos: '25 photos/property',
    support: 'Premium support',
    pricing: { GYD: 25000, JMD: 50000, TTD: 1700, BBD: 625, USD: 310, CAD: 420 },
    color: 'purple',
    recommended: false
  }
];

function RegistrationContent() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    // Step 1: Plan Selection
    selected_plan: 'pro',
    country: 'GY',
    
    // Step 2: Personal Info
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    years_experience: "",
    
    // Step 3: Professional Info
    company_name: "",
    license_number: "",
    license_type: "",
    specialties: "",
    target_region: "",
    
    // Step 4: References (Optional)
    reference1_name: "",
    reference1_phone: "",
    reference1_email: "",
    reference2_name: "",
    reference2_phone: "",
    reference2_email: "",
  });

  // Handle URL parameters on component mount
  useEffect(() => {
    if (!searchParams) return;
    
    const typeParam = searchParams.get('type');
    const countryParam = searchParams.get('country');
    
    // Pre-fill country if provided
    if (countryParam) {
      const country = countries.find(c => c.code === countryParam);
      if (country) {
        setSelectedCountry(country);
        setForm(prev => ({ ...prev, country: countryParam }));
      }
    }
    
    // Pre-fill plan based on type
    if (typeParam === 'agent') {
      setSelectedPlan('pro'); // Default to Pro for agents
      setForm(prev => ({ ...prev, selected_plan: 'pro' }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode) || countries[0];
    setSelectedCountry(country);
    setForm({ ...form, country: countryCode });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(form.selected_plan && form.country);
      case 2:
        return !!(form.first_name && form.last_name && form.phone && form.email && form.years_experience);
      case 3:
        return !!(form.company_name && form.license_number);
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      setError("");
    } else {
      setError("Please fill in all required fields to continue");
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    
    try {
      const supabase = createClientComponentClient();
      const { error: dbError } = await supabase.from("agent_vetting").insert({
        ...form,
        user_type: "agent",
        status: "pending_review",
        submitted_at: new Date().toISOString(),
      });

      if (dbError) {
        setError(dbError.message);
        setLoading(false);
        return;
      }

      // Success - redirect to success page
      window.location.href = '/register-success';
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const formatPrice = (amount: number, currency: string, symbol: string) => {
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Agent Registration</h1>
            <div className="text-sm text-gray-500">Step {currentStep} of 4</div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        
        {/* Step 1: Plan Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
              <p className="text-gray-600 text-sm">Select the plan that best fits your business needs</p>
            </div>

            {/* Country Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
              <select 
                value={selectedCountry.code}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              >
                {countries.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Plan Cards */}
            <div className="space-y-3">
              {agentPlans.map(plan => {
                const price = plan.pricing[selectedCountry.currency as keyof typeof plan.pricing];
                const isSelected = form.selected_plan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setForm({ ...form, selected_plan: plan.id })}
                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute -top-2 left-4 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        Recommended
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900">{plan.name}</h3>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatPrice(price, selectedCountry.currency, selectedCountry.symbol)}
                        </div>
                        <div className="text-xs text-gray-500">/month</div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>• {plan.listings}</div>
                      <div>• {plan.photos}</div>
                      <div>• {plan.support}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Free Trial Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800">
                <strong>🎉 Launch Special:</strong> Get your first month free when you register now!
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Personal Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-gray-600 text-sm">Tell us about yourself</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience *</label>
                <select
                  name="years_experience"
                  value={form.years_experience}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                >
                  <option value="">Select experience level</option>
                  <option value="0-1">New Agent (0-1 years)</option>
                  <option value="2-5">Experienced (2-5 years)</option>
                  <option value="6-10">Senior Agent (6-10 years)</option>
                  <option value="10+">Expert (10+ years)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Professional Information */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Professional Details</h2>
              <p className="text-gray-600 text-sm">Your business and licensing information</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company/Brokerage Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="ABC Realty"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                  <input
                    type="text"
                    name="license_number"
                    value={form.license_number}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="RE123456"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Type</label>
                  <select
                    name="license_type"
                    value={form.license_type}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                    <option value="">Select type</option>
                    <option value="sales">Sales Agent</option>
                    <option value="broker">Broker</option>
                    <option value="associate">Associate Broker</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                <input
                  type="text"
                  name="specialties"
                  value={form.specialties}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="Residential, Commercial, Luxury"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Market Area</label>
                <input
                  type="text"
                  name="target_region"
                  value={form.target_region}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                  placeholder="Georgetown, East Coast"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: References (Optional) */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Professional References</h2>
              <p className="text-gray-600 text-sm">Optional - helps speed up verification process</p>
            </div>

            <div className="space-y-6">
              {/* Reference 1 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Reference 1 (Optional)</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    name="reference1_name"
                    value={form.reference1_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="Reference name"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel"
                      name="reference1_phone"
                      value={form.reference1_phone}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="Phone"
                    />
                    <input
                      type="email"
                      name="reference1_email"
                      value={form.reference1_email}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>

              {/* Reference 2 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Reference 2 (Optional)</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    name="reference2_name"
                    value={form.reference2_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="Reference name"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel"
                      name="reference2_phone"
                      value={form.reference2_phone}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="Phone"
                    />
                    <input
                      type="email"
                      name="reference2_email"
                      value={form.reference2_email}
                      onChange={handleChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="Email"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-800">
                  <strong>💡 Tip:</strong> References from previous brokers, clients, or industry professionals help us verify your application faster.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-6">
          {currentStep > 1 && (
            <button
              onClick={prevStep}
              className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          
          {currentStep < 4 ? (
            <button
              onClick={nextStep}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Complete Registration"}
            </button>
          )}
        </div>

        {/* Skip References Option */}
        {currentStep === 4 && (
          <div className="text-center pt-4">
            <button
              onClick={handleSubmit}
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
            >
              Skip references and complete registration
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-500">
        © 2025 Caribbean Home Hub
      </div>
    </div>
  );
}

export default function RegistrationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegistrationContent />
    </Suspense>
  );
}