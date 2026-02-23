"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import { usePricing } from '@/hooks/usePricing';

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

  // Force scroll to top on page load (fixes iOS Safari loading at bottom bug)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

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
          is_founding_member: false
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

            {/* Country Display (Read-only) */}
            <div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">📍 Location</div>
                <div className="text-base font-medium text-gray-900">{selectedCountry.name}</div>
              </div>
            </div>

            {/* Plan Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
              {plansLoading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 h-80 rounded-2xl"></div>
                    </div>
                  ))}
                </>
              ) : landlordPlans.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <div className="text-gray-500">No landlord plans available for {selectedCountry.name}</div>
                  <div className="text-sm text-gray-400">Please select a different country or contact support.</div>
                </div>
              ) : (
                landlordPlans.map((plan, index) => {
                  const isSelected = formData.plan === plan.id;
                  const features = plan.features || {};
                  const monthlyPrice = plan.listing_duration_days ? Math.round(plan.price_display / (plan.listing_duration_days / 30)) : plan.price_display;

                  // Tier icons and colors based on plan name/position
                  const tierConfig: Record<string, { icon: string; gradient: string; borderColor: string; description: string }> = {
                    'basic': {
                      icon: '🏠',
                      gradient: 'from-slate-50 to-slate-100',
                      borderColor: 'border-slate-300',
                      description: 'Perfect for getting started with your first rental property'
                    },
                    'standard': {
                      icon: '⭐',
                      gradient: 'from-emerald-50 to-green-100',
                      borderColor: 'border-emerald-400',
                      description: 'Most popular choice for growing landlords'
                    },
                    'premium': {
                      icon: '👑',
                      gradient: 'from-amber-50 to-yellow-100',
                      borderColor: 'border-amber-400',
                      description: 'Maximum visibility and premium features'
                    },
                    'multi-property': {
                      icon: '🏢',
                      gradient: 'from-blue-50 to-indigo-100',
                      borderColor: 'border-blue-400',
                      description: 'Ideal for managing multiple rental units'
                    },
                    'property manager': {
                      icon: '🏗️',
                      gradient: 'from-purple-50 to-violet-100',
                      borderColor: 'border-purple-400',
                      description: 'Professional tools for property managers'
                    },
                  };

                  // Determine tier based on plan name
                  const planNameLower = plan.plan_name.toLowerCase();
                  let tier = tierConfig['basic'];
                  if (planNameLower.includes('premium') || planNameLower.includes('pro')) {
                    tier = tierConfig['premium'];
                  } else if (planNameLower.includes('standard') || plan.is_popular) {
                    tier = tierConfig['standard'];
                  } else if (planNameLower.includes('multi') || planNameLower.includes('portfolio')) {
                    tier = tierConfig['multi-property'];
                  } else if (planNameLower.includes('manager') || planNameLower.includes('enterprise')) {
                    tier = tierConfig['property manager'];
                  }

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setFormData({ ...formData, plan: plan.id })}
                      className={`relative flex flex-col h-full min-h-[320px] lg:min-h-[400px] p-4 lg:p-6 border-2 rounded-2xl cursor-pointer transition-all duration-300 touch-manipulation
                        ${isSelected
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-100 shadow-xl shadow-green-200/50 scale-[1.02]'
                          : `${tier.borderColor} bg-gradient-to-br ${tier.gradient} shadow-lg hover:shadow-xl hover:scale-[1.02]`
                        }
                        ${plan.is_popular ? 'ring-2 ring-green-400 ring-offset-2' : ''}
                      `}
                    >
                      {/* RECOMMENDED Badge for popular plan */}
                      {plan.is_popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                            ✨ RECOMMENDED
                          </div>
                        </div>
                      )}

                      {/* Tier Icon */}
                      <div className="text-center mb-3 pt-2">
                        <span className="text-4xl lg:text-5xl">{tier.icon}</span>
                      </div>

                      {/* Plan Name & Duration */}
                      <div className="text-center mb-3">
                        <h3 className="font-bold text-gray-900 text-lg lg:text-xl">{plan.plan_name}</h3>
                        <div className="text-xs text-gray-500 mt-1">{plan.listing_duration_days} day listing</div>
                      </div>

                      {/* Price - Temporarily showing FREE during launch */}
                      <div className="text-center mb-4">
                        <div className="text-2xl lg:text-3xl font-bold text-green-600">
                          FREE
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Limited time offer
                        </div>
                      </div>

                      {/* Tier Description */}
                      <div className="text-center text-sm text-gray-600 mb-4 px-2">
                        {tier.description}
                      </div>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-3"></div>

                      {/* Features List */}
                      <div className="space-y-2 text-sm text-gray-700 flex-grow">
                        <div className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {plan.max_properties ? `${plan.max_properties} ${plan.max_properties === 1 ? 'property' : 'properties'}` : 'Unlimited properties'}
                        </div>
                        {plan.featured_listings_included > 0 && (
                          <div className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {plan.featured_listings_included} featured listing{plan.featured_listings_included > 1 ? 's' : ''}
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {plan.listing_duration_days ? `${plan.listing_duration_days} days active` : 'Never expires'}
                        </div>
                        {features.photos && (
                          <div className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {features.photos}
                          </div>
                        )}
                        {features.support && (
                          <div className="flex items-center">
                            <span className="text-green-500 mr-2">✓</span>
                            {features.support} support
                          </div>
                        )}
                      </div>

                      {/* Selection Button */}
                      <div className="mt-4">
                        <div className={`w-full py-2.5 rounded-lg text-center font-semibold transition-all ${
                          isSelected
                            ? 'bg-green-600 text-white'
                            : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-green-500 hover:text-green-600'
                        }`}>
                          {isSelected ? '✓ Selected' : 'Select Plan'}
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
                  placeholder={selectedCountry.code === 'GY' ? '+592 123 4567' : selectedCountry.code === 'JM' ? '+1 876 123 4567' : '+1 555 123 4567'}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Include country code (e.g., {selectedCountry.code === 'GY' ? '+592 for Guyana' : selectedCountry.code === 'JM' ? '+1 876 for Jamaica' : `+${selectedCountry.code === 'TT' ? '1 868' : '1'} for ${selectedCountry.name}`})
                </p>
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
                <div><strong>Price:</strong> <span className="text-green-600 font-bold">FREE</span> (Limited time offer)</div>
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