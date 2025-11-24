"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { usePricing } from '@/hooks/usePricing';
import PromoCodeInput from '@/components/PromoCodeInput';

const countries = [
  { code: 'GY', name: 'Guyana', currency: 'GYD', symbol: 'G$' },
  { code: 'JM', name: 'Jamaica', currency: 'JMD', symbol: 'J$' },
  { code: 'TT', name: 'Trinidad & Tobago', currency: 'TTD', symbol: 'TT$' },
  { code: 'BB', name: 'Barbados', currency: 'BBD', symbol: 'Bds$' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$' },
];


function RegistrationContent() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Promo code state
  const [validPromoCode, setValidPromoCode] = useState<string | null>(null);
  const [promoBenefits, setPromoBenefits] = useState<any>(null);
  const [promoSpotNumber, setPromoSpotNumber] = useState<number | null>(null);
  
  // Fetch pricing data for current country and agent user type
  const { plans: agentPlans, country: pricingCountry, loading: plansLoading } = usePricing(selectedCountry.code, 'agent');

  const [form, setForm] = useState({
    // Step 1: Plan Selection
    selected_plan: '',
    country: 'GY',
    
    // Step 2: Personal Info
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
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
    
    // Pre-fill plan based on type - will be set once plans load
  }, [searchParams]);

  // Set default plan when plans are loaded
  useEffect(() => {
    if (agentPlans.length > 0 && !form.selected_plan) {
      // Find the popular plan or use the first one
      const popularPlan = agentPlans.find(plan => plan.is_popular);
      const defaultPlan = popularPlan || agentPlans[0];
      setForm(prev => ({ ...prev, selected_plan: defaultPlan.id }));
      setSelectedPlan(defaultPlan.id);
    }
  }, [agentPlans, form.selected_plan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode) || countries[0];
    setSelectedCountry(country);
    setForm({ ...form, country: countryCode });
  };

  // Promo code handlers
  const handleValidPromoCode = (code: string, benefits: any, spotNumber: number) => {
    setValidPromoCode(code);
    setPromoBenefits(benefits);
    setPromoSpotNumber(spotNumber);
  };

  const handleClearPromoCode = () => {
    setValidPromoCode(null);
    setPromoBenefits(null);
    setPromoSpotNumber(null);
  };

  const handleSelectFoundingMember = () => {
    // Set a special founding member "plan" that will be handled during submission
    setForm({ ...form, selected_plan: 'founding_member' });
    setSelectedPlan('founding_member');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(form.selected_plan && form.country);
      case 2:
        return !!(form.first_name && form.last_name && form.phone && form.email && form.password && form.confirm_password && form.years_experience);
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
    
    // Validate passwords match
    if (form.password !== form.confirm_password) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (form.password.length < 8 || !/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) {
      setError("Password must be at least 8 characters with at least one special character");
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/register/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          // Add promo code information if available
          promo_code: validPromoCode,
          promo_benefits: promoBenefits,
          promo_spot_number: promoSpotNumber,
          is_founding_member: !!validPromoCode
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Success - redirect to success page with promo code info if applicable
      let successUrl = '/register-success';
      if (validPromoCode && promoSpotNumber) {
        successUrl += `?foundingMember=${promoSpotNumber}&code=${validPromoCode}`;
      }
      window.location.href = successUrl;
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto lg:max-w-6xl px-4 lg:px-8 py-4">
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
      <div className="max-w-md mx-auto lg:max-w-6xl px-4 lg:px-8 py-6">
        
        {/* Step 1: Plan Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl lg:text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
              <p className="text-gray-600 text-sm lg:text-lg">Select the plan that best fits your business needs</p>
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

            {/* Promo Code Input */}
            <PromoCodeInput
              userType="agent"
              countryId={selectedCountry.code}
              onValidCode={handleValidPromoCode}
              onClearCode={handleClearPromoCode}
            />

            {/* Founding Member CTA */}
            {validPromoCode && promoBenefits && (
              <div className="mb-6">
                <button
                  onClick={handleSelectFoundingMember}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-xl font-bold text-lg shadow-lg transform hover:scale-[1.02] transition-all"
                >
                  🚀 Continue as Founding Member
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">Or choose a paid plan</span>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 items-stretch">
              {plansLoading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 h-48 rounded-xl"></div>
                    </div>
                  ))}
                </>
              ) : agentPlans.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-500">No agent plans available for {selectedCountry.name}</div>
                  <div className="text-sm text-gray-400">Please select a different country or contact support.</div>
                </div>
              ) : (
                agentPlans.map(plan => {
                  const isSelected = form.selected_plan === plan.id;
                  const features = plan.features || {};
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setForm({ ...form, selected_plan: plan.id })}
                      className={`relative flex flex-col h-full min-h-[280px] lg:min-h-[360px] p-4 lg:p-6 border-2 rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-xl touch-manipulation ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {plan.is_popular && (
                        <div className="absolute -top-2 left-4 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Recommended
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-gray-900 text-lg lg:text-xl">{plan.plan_name}</h3>
                        <div className="text-right">
                          <div className="text-lg lg:text-2xl font-bold text-gray-900">
                            {plan.price_formatted}
                          </div>
                          <div className="text-xs lg:text-sm text-gray-500">/{plan.plan_type}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm lg:text-base text-gray-600 flex-grow min-h-[80px] lg:min-h-[120px]">
                        <div>• {plan.max_properties ? `${plan.max_properties} ${plan.max_properties === 1 ? 'property' : 'properties'}` : 'Unlimited properties'}</div>
                        {plan.featured_listings_included > 0 && <div>• {plan.featured_listings_included} featured listings</div>}
                        <div>• {plan.listing_duration_days ? `${plan.listing_duration_days} days duration` : 'Listings never expire'}</div>
                        {features.photos && <div>• {features.photos} photos/property</div>}
                        {features.support && <div>• {features.support} support</div>}
                      </div>
                    </div>
                  );
                })
              )}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="Create strong password"
                  />
                  <div className="mt-1 space-y-1 text-xs text-gray-600">
                    <div className={`flex items-center ${form.password.length >= 8 ? 'text-green-600' : ''}`}>
                      <span className="mr-1">{form.password.length >= 8 ? '✓' : '○'}</span>
                      At least 8 characters
                    </div>
                    <div className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? 'text-green-600' : ''}`}>
                      <span className="mr-1">{/[!@#$%^&*(),.?":{}|<>]/.test(form.password) ? '✓' : '○'}</span>
                      One special character
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                    placeholder="Confirm your password"
                  />
                  {form.confirm_password && (
                    <div className={`mt-1 text-xs ${form.password === form.confirm_password ? 'text-green-600' : 'text-red-600'}`}>
                      {form.password === form.confirm_password ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </div>
                  )}
                </div>
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