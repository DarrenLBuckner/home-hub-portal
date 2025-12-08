'use client';

import React, { useState } from 'react';

interface PromoCodeBenefits {
  trialDays: number;
  propertyLimit: number;
  discountPercentage: number;
  tier: string | null;
  description: string | null;
}

interface PromoCodeInputProps {
  userType: 'agent' | 'property_owner' | 'fsbo';
  countryId: string;
  onValidCode: (code: string, benefits: PromoCodeBenefits, spotNumber: number) => void;
  onClearCode: () => void;
}

export default function PromoCodeInput({
  userType,
  countryId,
  onValidCode,
  onClearCode
}: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validatedData, setValidatedData] = useState<{
    code: string;
    benefits: PromoCodeBenefits;
    spotNumber: number;
    spotsRemaining: number;
    maxSpots: number;
  } | null>(null);

  const handleApplyCode = async () => {
    if (!code.trim()) {
      setError('Please enter a code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/promo-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          userType,
          countryId
        })
      });

      const data = await response.json();

      if (data.valid) {
        setValidatedData({
          code: data.code,
          benefits: data.benefits,
          spotNumber: data.spotNumber,
          spotsRemaining: data.spotsRemaining,
          maxSpots: data.maxSpots
        });
        onValidCode(data.code, data.benefits, data.spotNumber);
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch (err) {
      setError('Failed to validate code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCode = () => {
    setCode('');
    setValidatedData(null);
    setError(null);
    onClearCode();
  };

  // Get value display based on user type
  const getTrialValue = () => {
    if (!validatedData) return '';
    
    // Calculate approximate value based on cheapest plan
    const monthlyValues: Record<string, number> = {
      'agent': 14560, // GY$ per month
      'property_owner': 10400, // GY$ per listing
      'fsbo': 20592 // GY$ per listing
    };
    
    const monthlyValue = monthlyValues[userType] || 10000;
    const months = Math.floor(validatedData.benefits.trialDays / 30);
    const totalValue = monthlyValue * months;
    
    return `Worth GY$${totalValue.toLocaleString()}!`;
  };

  // SUCCESS STATE - Show validated benefits
  if (validatedData) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-xl p-6 mb-6">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="text-2xl font-bold text-green-800">
            Congratulations! You're Founding Member #{validatedData.spotNumber} of {validatedData.maxSpots}!
          </h3>
          <p className="text-green-600 text-sm mt-1">
            Code: {validatedData.code}
          </p>
        </div>

        {/* Benefits Box */}
        <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3">YOUR FOUNDING MEMBER BENEFITS:</h4>
          <ul className="space-y-2">
            <li className="flex items-center text-gray-700">
              <span className="text-green-500 mr-2 text-xl">✅</span>
              <span>
                <strong>{validatedData.benefits.trialDays} days FREE</strong>
                <span className="text-green-600 ml-2 text-sm">({getTrialValue()})</span>
              </span>
            </li>
            <li className="flex items-center text-gray-700">
              <span className="text-green-500 mr-2 text-xl">✅</span>
              <span>Up to <strong>{validatedData.benefits.propertyLimit} property listings</strong></span>
            </li>
            <li className="flex items-center text-gray-700">
              <span className="text-green-500 mr-2 text-xl">✅</span>
              <span><strong>{validatedData.benefits.discountPercentage}% off for life</strong> when you continue after trial</span>
            </li>
            <li className="flex items-center text-gray-700">
              <span className="text-green-500 mr-2 text-xl">✅</span>
              <span>Priority support</span>
            </li>
            <li className="flex items-center text-gray-700">
              <span className="text-green-500 mr-2 text-xl">✅</span>
              <span>Founding Member badge on your profile</span>
            </li>
          </ul>
        </div>

        {/* Urgency Message */}
        <div className="text-center text-sm text-orange-600 font-medium mb-4">
          ⚡ Only {validatedData.spotsRemaining} spots remaining!
        </div>

        {/* Change Code Link */}
        <div className="text-center">
          <button
            onClick={handleClearCode}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Use a different code
          </button>
        </div>
      </div>
    );
  }

  // INPUT STATE - Show code entry form
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-400 rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-center mb-4">
        <span className="text-2xl mr-2">🎉</span>
        <h3 className="text-xl font-bold text-amber-800">FOUNDING MEMBER SPECIAL</h3>
        <span className="text-2xl ml-2">🎉</span>
      </div>

      {/* Subtitle */}
      <p className="text-center text-amber-700 mb-4">
        Have an early access code? Get <strong>FREE</strong> access as a Founding Member!
      </p>

      {/* Input and Button */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          placeholder="Enter your code"
          className="flex-1 px-4 py-3 border-2 border-amber-300 rounded-lg text-center font-mono text-lg uppercase focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none"
          disabled={isLoading}
        />
        <button
          onClick={handleApplyCode}
          disabled={isLoading || !code.trim()}
          className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Checking...
            </span>
          ) : (
            'Apply Code'
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 text-center text-red-600 font-medium">
          ❌ {error}
        </div>
      )}

      {/* Teaser */}
      <p className="text-center text-amber-600 text-sm mt-4">
        ⭐ Limited spots available for early supporters!
      </p>
    </div>
  );
}