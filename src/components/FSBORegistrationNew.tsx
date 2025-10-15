"use client";
import React, { useState, useEffect } from "react";

// FSBO Plans - matches database structure
const fsboPlans = [
  {
    id: 'single',
    name: 'Single Property',
    description: 'Perfect for individual homeowners',
    listings: '1 property listing',
    photos: '8 photos',
    support: 'Email support',
    duration: '60 days',
    duration_days: 60,
    price_gyd: 15000,
    color: 'blue',
    recommended: false,
    badge: null,
    features: [
      '1 property listing',
      '8 high-quality photos',
      'Active for 60 days',
      'Standard placement',
      'Email support',
      'Search visibility',
      'Mobile-optimized'
    ]
  },
  {
    id: 'featured',
    name: 'Featured Listing',
    description: 'Get noticed with premium placement',
    listings: '1 property listing',
    photos: '15 photos',
    support: 'Priority support',
    duration: '90 days',
    duration_days: 90,
    price_gyd: 25000,
    color: 'green',
    recommended: true,
    badge: 'Most Popular',
    features: [
      '1 property listing',
      '15 high-quality photos',
      'Active for 90 days',
      '⭐ Featured badge',
      '📍 Priority placement',
      'Homepage feature potential',
      'Priority support',
      'Social media sharing'
    ]
  },
  {
    id: 'premium',
    name: 'Premium Listing',
    description: 'Maximum exposure for 6 months',
    listings: '1 property listing',
    photos: '20 photos',
    support: 'Premium support',
    duration: '180 days (6 months)',
    duration_days: 180,
    price_gyd: 35000,
    color: 'purple',
    recommended: false,
    badge: 'Best Value',
    features: [
      '1 property listing',
      '20 high-quality photos',
      'Active for 180 days',
      '🔝 Top placement',
      '⭐ Featured badge',
      'Homepage priority',
      'Premium support',
      'Virtual tour support',
      'Social media promotion'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For developers & large portfolios',
    listings: 'Up to 25 properties',
    photos: 'Unlimited photos',
    support: 'Dedicated support',
    duration: '1 year + custom terms',
    duration_days: 365,
    price_gyd: 150000,
    color: 'orange',
    recommended: false,
    badge: 'Call Required',
    requiresContact: true,
    features: [
      'Up to 25 properties',
      'Unlimited photos per property',
      'Custom listing duration',
      '🏢 Developer branding',
      'Dedicated account manager',
      'Bulk upload tools',
      'Advanced analytics',
      'API access',
      '✨ FREE setup assistance'
    ]
  }
];

type FSBORegistrationNewProps = {
  formData: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
  }>>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
  error: string;
};

type PlanSelectionProps = {
  selectedPlan: string;
  setSelectedPlan: React.Dispatch<React.SetStateAction<string>>;
  onContinue: () => void;
  isContinueEnabled: boolean;
  enterpriseStyle?: boolean;
};

export function RegistrationForm({ formData, setFormData, onSubmit, isSubmitting, error }: FSBORegistrationNewProps) {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="text"
        name="firstName"
        value={formData.firstName}
        onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))}
        placeholder="First Name*"
        required
        minLength={2}
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="text"
        name="lastName"
        value={formData.lastName}
        onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))}
        placeholder="Last Name*"
        required
        minLength={2}
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
        placeholder="Email Address*"
        required
        className="w-full px-4 py-2 border rounded"
      />
      <input
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
        placeholder="Phone Number*"
        required
        className="w-full px-4 py-2 border rounded"
      />
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
          placeholder="Password*"
          required
          minLength={8}
          className="w-full px-4 py-2 border rounded pr-10"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-2.5 text-gray-500 text-sm"
        >
          {showPassword ? "Hide" : "Show"}
        </button>
      </div>
      <div className="relative">
        <input
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={e => setFormData(f => ({ ...f, confirmPassword: e.target.value }))}
          placeholder="Confirm Password*"
          required
          minLength={8}
          className="w-full px-4 py-2 border rounded pr-10"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-3 top-2.5 text-gray-500 text-sm"
        >
          {showConfirmPassword ? "Hide" : "Show"}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Creating Account..." : "Create FSBO Account"}
      </button>
    </form>
  );
}

export function PlanSelection({ 
  selectedPlan, 
  setSelectedPlan, 
  onContinue, 
  isContinueEnabled 
}: PlanSelectionProps) {
  
  const formatPrice = (amount: number) => {
    return `G$${amount.toLocaleString()}`;
  };

  const handleEnterpriseClick = () => {
    if (selectedPlan === 'enterprise') {
      // Open contact instead of payment
      window.open('https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20I%27m%20interested%20in%20the%20FSBO%20Enterprise%20plan%20for%2025%2B%20properties.', '_blank');
    } else {
      setSelectedPlan('enterprise');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto lg:max-w-5xl">
      <h2 className="text-xl lg:text-2xl font-extrabold text-center mb-4 text-gradient bg-gradient-to-r from-orange-500 via-blue-500 to-yellow-500 bg-clip-text text-transparent drop-shadow-lg">
        Choose Your FSBO Plan
      </h2>
      <p className="text-center text-gray-600 mb-6 text-sm lg:text-base px-4">Sell your property by owner with professional listing exposure</p>
      
      {/* Plan Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8 px-4 lg:px-0">
        {fsboPlans.map(plan => {
          const isSelected = selectedPlan === plan.id;
          const colorClasses = {
            blue: isSelected ? 'border-blue-600 bg-gradient-to-br from-blue-100 to-blue-300' : 'border-gray-200 bg-white',
            green: isSelected ? 'border-green-600 bg-gradient-to-br from-green-100 to-green-300' : 'border-gray-200 bg-white',
            purple: isSelected ? 'border-purple-600 bg-gradient-to-br from-purple-100 to-purple-300' : 'border-gray-200 bg-white',
            orange: isSelected ? 'border-orange-600 bg-gradient-to-br from-orange-100 to-orange-300' : 'border-gray-200 bg-white'
          };
          
          return (
            <div
              key={plan.id}
              onClick={plan.requiresContact ? handleEnterpriseClick : () => setSelectedPlan(plan.id)}
              className={`relative p-4 lg:p-6 border-2 lg:border-4 rounded-xl lg:rounded-2xl cursor-pointer transition-all duration-200 shadow-lg lg:shadow-xl hover:shadow-xl lg:hover:shadow-2xl ${colorClasses[plan.color as keyof typeof colorClasses]}`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 text-white text-xs font-bold rounded-full shadow-lg z-10 ${
                  plan.color === 'blue' ? 'bg-blue-600' :
                  plan.color === 'green' ? 'bg-green-600' : 
                  plan.color === 'purple' ? 'bg-purple-600' : 'bg-orange-600'
                }`}>
                  {plan.badge}
                </div>
              )}
              
              <div className={`text-3xl lg:text-4xl mb-2 lg:mb-3 ${
                plan.color === 'blue' ? 'text-blue-600' :
                plan.color === 'green' ? 'text-green-600' : 
                plan.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
              }`}>
                {plan.id === 'single' ? '🏠' : 
                 plan.id === 'featured' ? '⭐' : 
                 plan.id === 'premium' ? '👑' : '🏢'}
              </div>
              
              <div className={`font-bold text-lg lg:text-xl mb-1 lg:mb-2 ${
                plan.color === 'blue' ? 'text-blue-700' :
                plan.color === 'green' ? 'text-green-700' : 
                plan.color === 'purple' ? 'text-purple-700' : 'text-orange-700'
              }`}>
                {plan.name}
              </div>
              
              <div className="text-base lg:text-lg font-bold text-gray-900 mb-2 lg:mb-3">
                {plan.requiresContact ? (
                  <div>
                    <div>{formatPrice(plan.price_gyd)}</div>
                    <div className="text-xs text-gray-600">Starting price • Call required</div>
                  </div>
                ) : (
                  <div>
                    {formatPrice(plan.price_gyd)} / {plan.duration}
                  </div>
                )}
              </div>
              
              <div className="text-xs lg:text-sm text-gray-600 mb-2 lg:mb-3">
                {plan.description}
              </div>
              
              <ul className="text-xs lg:text-sm text-gray-700 space-y-1">
                {plan.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-600 mr-1 lg:mr-2 text-xs">✓</span>
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
                {plan.features.length > 3 && (
                  <li className="text-xs text-gray-500 mt-1">
                    +{plan.features.length - 3} more features
                  </li>
                )}
              </ul>
              
              {plan.requiresContact && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm text-orange-800 font-medium">
                    📞 Contact us for custom setup
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    WhatsApp: +592 762-9797
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Continue Button */}
      <div className="text-center px-4 lg:px-0">
        <button
          onClick={onContinue}
          disabled={!isContinueEnabled}
          className="w-full lg:w-auto bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 lg:px-8 py-3 rounded-lg font-bold text-base lg:text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="block lg:inline">Continue with </span>
          <span className="block lg:inline">{fsboPlans.find(p => p.id === selectedPlan)?.name || 'Selected Plan'}</span>
        </button>
        
        {selectedPlan === 'enterprise' && (
          <p className="text-xs lg:text-sm text-gray-600 mt-3 px-2">
            Enterprise plan requires consultation. Our team will contact you within 24 hours.
          </p>
        )}
      </div>
      
      {/* Contact Info */}
      <div className="mt-6 lg:mt-8 mx-4 lg:mx-0 p-3 lg:p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-xs lg:text-sm text-gray-600">
          Need help choosing? WhatsApp us at{' '}
          <a 
            href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20I%20need%20help%20choosing%20an%20FSBO%20plan." 
            className="text-green-600 font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            +592 762-9797
          </a>
        </p>
      </div>
    </div>
  );
}

// Export the main component as default  
const FSBORegistrationNew = {
  RegistrationForm,
  PlanSelection
};

export default FSBORegistrationNew;