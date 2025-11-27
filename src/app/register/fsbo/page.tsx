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
  const [currentStep, setCurrentStep] = useState(1);
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

  // Force scroll to top on page load (fixes iOS Safari loading at bottom bug)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    setCurrentStep(3); // Skip plan selection, go directly to registration
  };

  const handleChooseRegularPlans = () => {
    setCurrentStep(2); // Go to plan selection
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
      
      // Store temporary registration data for payment page
      sessionStorage.setItem('fsboRegistration', JSON.stringify({
        tempRegistrationId: data.tempRegistrationId,
        registrationData: data.registrationData,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        plan: selectedPlan,
        isTemporary: true // Flag to indicate this is not a completed registration
      }));
      
      setIsSubmitting(false);
      setCurrentStep(4); // Move to completion step after validation
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
        
        {/* Step 1: Initial promo code entry */}
        {currentStep === 1 && (
        <>
          {/* Country Display (Read-only) */}
          <div className="mb-6">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="text-sm text-gray-600 mb-1">📍 Location</div>
              <div className="text-base font-medium text-gray-900">{selectedCountry.name}</div>
            </div>
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

              {/* Regular Plans CTA */}
              <div className="mt-6">
                <button
                  onClick={handleChooseRegularPlans}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-medium text-lg shadow-lg transform hover:scale-[1.02] transition-all"
                >
                  Choose Regular Plan
                </button>
              </div>
            </div>
        </>
        )}

        {/* Step 2: Plan selection for regular users */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                ← Back to Start
              </button>
            </div>
            
            <FSBORegistrationNew.PlanSelection
              selectedPlan={selectedPlan}
              setSelectedPlan={setSelectedPlan}
              onContinue={() => setCurrentStep(3)}
              isContinueEnabled={!!selectedPlan}
            />
          </div>
        )}

        {/* Step 3: Registration form */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setCurrentStep(selectedPlan === 'founding_member' ? 1 : 2)}
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                ← Back
              </button>
              {selectedPlan === 'founding_member' && validPromoCode && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
                  Founding Member #{promoSpotNumber}
                </div>
              )}
            </div>
            
            <FSBORegistrationNew.RegistrationForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleRegistrationSubmit}
              isSubmitting={isSubmitting}
              error={error}
            />
          </div>
        )}

        {/* Step 4: Completion - redirect happens automatically */}
        {currentStep === 4 && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing your registration...</p>
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
