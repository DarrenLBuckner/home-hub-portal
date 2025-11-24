"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from 'next/navigation';
import FSBORegistrationNew from "@/components/FSBORegistrationNew";
import PromoCodeInput from "@/components/PromoCodeInput";

const countries = [
  { code: 'GY', name: 'Guyana', currency: 'GYD', symbol: 'G$' },
  { code: 'JM', name: 'Jamaica', currency: 'JMD', symbol: 'J$' },
  { code: 'TT', name: 'Trinidad & Tobago', currency: 'TTD', symbol: 'TT$' },
  { code: 'BB', name: 'Barbados', currency: 'BBD', symbol: 'Bds$' },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$' },
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$' },
];

function FSBORegistrationContent() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<'register' | 'plan'>('register');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [selectedPlan, setSelectedPlan] = useState('featured');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Promo code state
  const [validPromoCode, setValidPromoCode] = useState<string | null>(null);
  const [promoBenefits, setPromoBenefits] = useState<any>(null);
  const [promoSpotNumber, setPromoSpotNumber] = useState<number | null>(null);

  // Handle URL parameters on component mount
  useEffect(() => {
    if (!searchParams) return;
    
    const countryParam = searchParams.get('country');
    
    // Pre-fill country if provided
    if (countryParam) {
      const country = countries.find(c => c.code === countryParam);
      if (country) {
        setSelectedCountry(country);
      }
    }
  }, [searchParams]);

  const handleCountryChange = (countryCode: string) => {
    const country = countries.find(c => c.code === countryCode) || countries[0];
    setSelectedCountry(country);
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
    setSelectedPlan('founding_member');
  };

  // Registration form handlers


  // Registration submit logic
  async function handleRegistrationSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }
    if (formData.password.length < 8 || !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      setError("Password must be at least 8 characters with at least one special character");
      setIsSubmitting(false);
      return;
    }
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
          plan: selectedPlan,
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
      sessionStorage.setItem('fsboRegistration', JSON.stringify({
        userId: data.user.id,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        plan: selectedPlan
      }));
      
      setIsSubmitting(false);
      setStep('plan'); // Move to plan selection step after registration
    } catch (error: any) {
      setError(error.message);
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    // You can add logic here to handle plan selection and next steps
    alert(`Plan selected: ${selectedPlan}`);
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100">
      <div className="max-w-md mx-auto lg:max-w-4xl bg-white lg:bg-transparent p-4 lg:p-6 lg:rounded-2xl lg:shadow-xl space-y-6 lg:space-y-8">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-center text-orange-600 mb-2 tracking-tight drop-shadow-lg">For Sale By Owner Registration</h1>
      {/* Always show plan cards at the top */}
      {/* Registration step */}
      {step === 'register' && (
        <>
          {/* Country Selector */}
          <div className="mb-6">
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

          {/* Promo Code Input */}
          <div className="mb-6">
            <PromoCodeInput
              userType="fsbo"
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
          </div>

          <div className="mb-8">
            <FSBORegistrationNew.PlanSelection
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              onContinue={() => {}}
              isContinueEnabled={false}
            />
          </div>
          <FSBORegistrationNew.RegistrationForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleRegistrationSubmit}
            isSubmitting={isSubmitting}
            error={error}
          />
        </>
      )}
      {/* Plan selection step */}
      {step === 'plan' && (
        <div className="mt-6">
          <FSBORegistrationNew.PlanSelection
            selectedPlan={selectedPlan}
            setSelectedPlan={setSelectedPlan}
            onContinue={() => window.location.href = '/register/payment'}
            isContinueEnabled={!!selectedPlan}
          />
        </div>
      )}
      </div>
    </div>
  );
}

export default function FSBORegistrationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FSBORegistrationContent />
    </Suspense>
  );
}
