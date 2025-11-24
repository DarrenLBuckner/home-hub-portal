"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
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


function LandlordRegistrationContent() {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Promo code state
  const [validPromoCode, setValidPromoCode] = useState<string | null>(null);
  const [promoBenefits, setPromoBenefits] = useState<any>(null);
  const [promoSpotNumber, setPromoSpotNumber] = useState<number | null>(null);
  
  // Fetch pricing data for current country and landlord user type
  const { plans: landlordPlans, country: pricingCountry, loading: plansLoading } = usePricing(selectedCountry.code, 'landlord');

  const [formData, setFormData] = useState({
    // Step 1: Plan Selection
    plan: '',
    country: 'GY',
    
    // Step 2: Account Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    
    // Step 3: Security
    password: '',
    confirmPassword: '',
  });

  // Handle URL parameters on component mount
  useEffect(() => {
    if (!searchParams) return;
    
    const countryParam = searchParams.get('country');
    
    // Pre-fill country if provided
    if (countryParam) {
      const country = countries.find(c => c.code === countryParam);
      if (country) {
        setSelectedCountry(country);
        setFormData(prev => ({ ...prev, country: countryParam }));
      }
    }
  }, [searchParams]);

  // Set default plan when plans are loaded
  useEffect(() => {
    if (landlordPlans.length > 0 && !formData.plan) {
      // Find the popular plan or use the first one
      const popularPlan = landlordPlans.find(plan => plan.is_popular);
      const defaultPlan = popularPlan || landlordPlans[0];
      setFormData(prev => ({ ...prev, plan: defaultPlan.id }));
      setSelectedPlan(defaultPlan.id);
    }
  }, [landlordPlans, formData.plan]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode) || countries[0];
    setSelectedCountry(country);
    setFormData({ ...formData, country: countryCode });
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
    setFormData({ ...formData, plan: 'founding_member' });
    setSelectedPlan('founding_member');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.plan && formData.country);
      case 2:
        return !!(formData.firstName && formData.lastName && formData.email && formData.phone);
      case 3:
        return !!(formData.password && formData.confirmPassword && formData.password === formData.confirmPassword);
      default:
        return true;
    }
  };

  const validatePassword = (): boolean => {
    return formData.password.length >= 8 && /[!@#$%^&*(),.?":{}|<>]/.test(formData.password);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3 && !validatePassword()) {
        setError("Password must be at least 8 characters with at least one special character");
        return;
      }
      if (currentStep === 3 && formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      setCurrentStep(prev => Math.min(prev + 1, 3));
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
    setIsSubmitting(true);
    setError("");
    
    try {
      const response = await fetch('/api/register/landlord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          plan: formData.plan,
          country: formData.country,
          // Include promo code information
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
      
      // Store registration data for payment page
      sessionStorage.setItem('landlordRegistration', JSON.stringify({
        userId: data.user.id,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        plan: formData.plan,
        country: formData.country
      }));
      
      // Redirect to success page
      window.location.href = '/register-success';
      
    } catch (error: any) {
      setError(error.message);
      setIsSubmitting(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto lg:max-w-6xl px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">Landlord Registration</h1>
            <div className="text-sm text-gray-500">Step {currentStep} of 3</div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
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
              <p className="text-gray-600 text-sm lg:text-lg">Get your rental properties in front of qualified tenants</p>
            </div>

            {/* Country Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
              <select 
                value={selectedCountry.code}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
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
              userType="property_owner"
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
              ) : landlordPlans.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-500">No landlord plans available for {selectedCountry.name}</div>
                  <div className="text-sm text-gray-400">Please select a different country or contact support.</div>
                </div>
              ) : (
                landlordPlans.map(plan => {
                  const isSelected = formData.plan === plan.id;
                  const features = plan.features || {};
                  const monthlyPrice = plan.listing_duration_days ? Math.round(plan.price_display / (plan.listing_duration_days / 30)) : plan.price_display;
                  
                  return (
                    <div
                      key={plan.id}
                      onClick={() => setFormData({ ...formData, plan: plan.id })}
                      className={`relative flex flex-col h-full min-h-[200px] lg:min-h-[360px] p-3 lg:p-6 border-2 rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-xl touch-manipulation ${
                        isSelected 
                          ? 'border-green-600 bg-green-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      {plan.is_popular && (
                        <div className="absolute -top-2 left-3 bg-green-600 text-white text-xs px-2 py-0.5 rounded">
                          Most Popular
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-base lg:text-xl">{plan.plan_name}</h3>
                          <div className="text-xs text-gray-500 mt-0.5">{plan.listing_duration_days} days</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-base lg:text-2xl font-bold text-gray-900">
                            {plan.price_formatted}
                          </div>
                          {plan.plan_type === 'listing' && (
                            <div className="text-xs text-gray-500">
                              ≈ {pricingCountry?.currency_symbol || ''}${monthlyPrice.toLocaleString()}/mo
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-0.5 lg:space-y-1 text-xs lg:text-base text-gray-600 flex-grow">
                        <div>• {plan.max_properties ? `${plan.max_properties} ${plan.max_properties === 1 ? 'property' : 'properties'}` : 'Unlimited properties'}</div>
                        {plan.featured_listings_included > 0 && <div>• {plan.featured_listings_included} featured listings</div>}
                        <div>• {plan.listing_duration_days ? `${plan.listing_duration_days} days duration` : 'Listings never expire'}</div>
                        {features.photos && <div>• {features.photos}</div>}
                        {features.support && <div>• {features.support} support</div>}
                      </div>

                      {/* Selection Indicator */}
                      <div className="absolute top-3 right-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-green-600 bg-green-600' : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Launch Special */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="text-sm text-emerald-800">
                <strong>🏆 Launch Special:</strong> List your first property free for 7 days!
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Account Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Account Information</h2>
              <p className="text-gray-600 text-sm">Create your landlord account</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                    placeholder="Smith"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Benefits Preview */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-2">🏡 What's included:</h3>
              <div className="space-y-1 text-sm text-green-800">
                <div>• Professional property listing page</div>
                <div>• Tenant screening and inquiry management</div>
                <div>• Secure payment collection tools</div>
                <div>• 24/7 customer support</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Security */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Secure Your Account</h2>
              <p className="text-gray-600 text-sm">Create a strong password to protect your account</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                  placeholder="Create strong password"
                />
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <div className={`flex items-center ${formData.password.length >= 8 ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{formData.password.length >= 8 ? '✓' : '○'}</span>
                    At least 8 characters
                  </div>
                  <div className={`flex items-center ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : ''}`}>
                    <span className="mr-2">{/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '○'}</span>
                    One special character (!@#$%^&*)
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base"
                  placeholder="Confirm your password"
                />
                {formData.confirmPassword && (
                  <div className={`mt-2 text-xs ${formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Registration Summary:</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div><strong>Plan:</strong> {landlordPlans.find(p => p.id === formData.plan)?.plan_name || 'No plan selected'}</div>
                <div><strong>Location:</strong> {selectedCountry.name}</div>
                <div><strong>Price:</strong> {landlordPlans.find(p => p.id === formData.plan)?.price_formatted || 'N/A'}</div>
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
          
          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating Account..." : "Create Landlord Account"}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-6 text-xs text-gray-500">
        © 2025 Caribbean Home Hub
      </div>
    </div>
  );
}

export default function LandlordRegistrationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LandlordRegistrationContent />
    </Suspense>
  );
}