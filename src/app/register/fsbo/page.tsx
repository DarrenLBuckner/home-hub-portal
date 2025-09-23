"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const countries = [
  { code: 'GY', name: 'Guyana', currency: 'GYD', symbol: 'G$' },
  { code: 'JM', name: 'Jamaica', currency: 'JMD', symbol: 'J$' },
  { code: 'TT', name: 'Trinidad & Tobago', currency: 'TTD', symbol: 'TT$' },
  { code: 'BB', name: 'Barbados', currency: 'BBD', symbol: 'Bds$' },
  { code: 'GH', name: 'Ghana', currency: 'GHS', symbol: 'GH₵' },
  { code: 'NG', name: 'Nigeria', currency: 'NGN', symbol: '₦' },
  { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$' },
];

const fsboPlans = [
  {
    id: 'basic',
    name: 'FSBO Basic',
    listings: '1 property listing',
    photos: '5 photos/property',
    support: 'Basic support',
    duration: '60 days',
    pricing: { GYD: 8400, JMD: 16800, TTD: 560, BBD: 210, GHS: 1680, NGN: 168000, KES: 13400, USD: 105, CAD: 140 },
    color: 'orange',
    recommended: false,
    badge: null
  },
  {
    id: 'extended',
    name: 'FSBO Extended',
    listings: '1 property listing',
    photos: '10 photos/property',
    support: 'Priority support',
    duration: '90 days',
    pricing: { GYD: 10500, JMD: 21000, TTD: 700, BBD: 265, GHS: 2100, NGN: 210000, KES: 16800, USD: 130, CAD: 175 },
    color: 'blue',
    recommended: true,
    badge: 'Most Popular'
  },
  {
    id: 'premium',
    name: 'FSBO Premium',
    listings: '1 property listing',
    photos: '15 photos/property',
    support: 'Premium support',
    duration: '180 days',
    pricing: { GYD: 15750, JMD: 31500, TTD: 1050, BBD: 395, GHS: 3150, NGN: 315000, KES: 25200, USD: 195, CAD: 260 },
    color: 'purple',
    recommended: false,
    badge: 'Best Value'
  }
];

export default function FSBORegistrationPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedPlan, setSelectedPlan] = useState('extended');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    // Step 1: Plan Selection
    plan: 'extended',
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
        return formData.plan && formData.country;
      case 2:
        return formData.firstName && formData.lastName && formData.email && formData.phone;
      case 3:
        return formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
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
      const response = await fetch('/api/register/fsbo', {
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
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      if (data.success) {
        if (data.skipPayment) {
          // Beta user - go directly to dashboard
          router.push(data.redirectTo || '/dashboard/fsbo');
        } else {
          // Regular user - go to payment
          sessionStorage.setItem('fsboRegistration', JSON.stringify({
            userId: data.userId,
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            plan: formData.plan,
            country: formData.country
          }));
          router.push('/register/payment');
        }
      }
      
    } catch (error: any) {
      setError(error.message);
      setIsSubmitting(false);
    }
  };

  const formatPrice = (amount: number, currency: string, symbol: string) => {
    return `${symbol}${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-100">
      {/* Mobile Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">FSBO Registration</h1>
            <div className="text-sm text-gray-500">Step {currentStep} of 3</div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
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
              <p className="text-gray-600 text-sm">Sell your property directly to buyers without agent fees</p>
            </div>

            {/* Country Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Location</label>
              <select 
                value={selectedCountry.code}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
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
              {fsboPlans.map(plan => {
                const price = plan.pricing[selectedCountry.currency as keyof typeof plan.pricing];
                const monthlyPrice = Math.round(price / (parseInt(plan.duration) / 30));
                const isSelected = formData.plan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setFormData({ ...formData, plan: plan.id })}
                    className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-orange-600 bg-orange-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute -top-2 left-4 bg-orange-600 text-white text-xs px-2 py-1 rounded">
                        {plan.badge}
                      </div>
                    )}
                    
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">{plan.name}</h3>
                        <div className="text-xs text-gray-500 mt-1">{plan.duration} listing period</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatPrice(price, selectedCountry.currency, selectedCountry.symbol)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ≈ {formatPrice(monthlyPrice, selectedCountry.currency, selectedCountry.symbol)}/month
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>• {plan.listings}</div>
                      <div>• {plan.photos}</div>
                      <div>• {plan.support}</div>
                    </div>

                    {/* Selection Indicator */}
                    <div className="absolute top-4 right-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-orange-600 bg-orange-600' : 'border-gray-300'
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
              })}
            </div>

            {/* Launch Special */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="text-sm text-amber-800">
                <strong>🏡 Early Access Special:</strong> Get premium exposure for your property during our launch period!
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Account Information */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Account Information</h2>
              <p className="text-gray-600 text-sm">Create your FSBO seller account</p>
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Benefits Preview */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-medium text-orange-900 mb-2">🏡 What's included:</h3>
              <div className="space-y-1 text-sm text-orange-800">
                <div>• Professional property listing page</div>
                <div>• Direct buyer inquiry management</div>
                <div>• Marketing tools and templates</div>
                <div>• Legal document assistance</div>
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
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
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-base"
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
                <div><strong>Plan:</strong> {fsboPlans.find(p => p.id === formData.plan)?.name}</div>
                <div><strong>Location:</strong> {selectedCountry.name}</div>
                <div><strong>Price:</strong> {formatPrice(
                  fsboPlans.find(p => p.id === formData.plan)?.pricing[selectedCountry.currency as keyof typeof fsboPlans[0]['pricing']] || 0,
                  selectedCountry.currency,
                  selectedCountry.symbol
                )}</div>
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
              className="flex-1 py-3 px-4 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Creating Account..." : "Create FSBO Account"}
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