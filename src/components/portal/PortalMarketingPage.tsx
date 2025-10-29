'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function PortalMarketingPage() {
  const [selectedCountry, setSelectedCountry] = useState('GY');

  // Country configuration
  const countries = {
    GY: { name: 'Guyana', currency: 'GYD', flag: '🇬🇾' },
    JM: { name: 'Jamaica', currency: 'JMD', flag: '🇯🇲' },
    TT: { name: 'Trinidad & Tobago', currency: 'TTD', flag: '🇹🇹' },
    BB: { name: 'Barbados', currency: 'BBD', flag: '🇧🇧' },
  };

  const currentCountry = countries[selectedCountry as keyof typeof countries];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          
          {/* Main Heading */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
              Manage Properties Across the Caribbean
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8">
              List, manage, and grow your real estate business with professional tools
            </p>

            {/* Country Selector */}
            <div className="inline-flex flex-col items-center gap-2">
              <label className="text-sm text-slate-400">
                Select Your Country:
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                {Object.entries(countries).map(([code, country]) => (
                  <option key={code} value={code} className="bg-slate-800">
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-slate-400">
                Pricing shown in {currentCountry.currency}
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">📸</div>
              <h3 className="text-lg font-semibold text-white mb-2">Professional Listings</h3>
              <p className="text-slate-300 text-sm">
                Create beautiful property listings with multiple photos and detailed descriptions
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="text-lg font-semibold text-white mb-2">WhatsApp Integration</h3>
              <p className="text-slate-300 text-sm">
                Get instant inquiries from potential buyers and renters via WhatsApp
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="text-lg font-semibold text-white mb-2">Analytics & Insights</h3>
              <p className="text-slate-300 text-sm">
                Track views, inquiries, and performance of your listings in real-time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Choose Your Plan
        </h2>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Real Estate Agent Card */}
          <PricingCard
            title="Real Estate Agent"
            icon="🏢"
            description="Manage sales & rentals with professional tools"
            pricing="Subscription: $49-99/month"
            buttonText="Get Started"
            buttonLink={`/register?type=agent&country=${selectedCountry}`}
            features={[
              'Up to 10 active listings',
              'Professional profile page',
              'Priority customer support',
              'Advanced analytics',
            ]}
          />

          {/* Property Owner Card */}
          <PricingCard
            title="Property Owner"
            icon="🏠"
            description="Rent out your properties easily"
            pricing="Per listing: $79-149"
            buttonText="Get Started"
            buttonLink={`/register/landlord?country=${selectedCountry}`}
            features={[
              '1 rental property listing',
              'WhatsApp integration',
              'Photo gallery',
              'Tenant screening tools',
            ]}
          />

          {/* Sell By Owner Card */}
          <PricingCard
            title="Sell By Owner"
            icon="🏆"
            description="Sell your property without an agent"
            pricing="Per listing: $99-199"
            buttonText="Get Started"
            buttonLink={`/register/fsbo?country=${selectedCountry}`}
            features={[
              '1 property for sale',
              'Full exposure on platform',
              'Direct buyer contact',
              'Marketing support',
            ]}
          />
        </div>

        {/* Already have account */}
        <div className="text-center mt-12">
          <p className="text-slate-300 mb-4">
            Already have an account?
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium"
          >
            Sign in to your dashboard
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Pricing Card Component
function PricingCard({ 
  title, 
  icon, 
  description, 
  pricing, 
  buttonText, 
  buttonLink, 
  features 
}: {
  title: string;
  icon: string;
  description: string;
  pricing: string;
  buttonText: string;
  buttonLink: string;
  features: string[];
}) {
  return (
    <div className="bg-white rounded-xl shadow-2xl p-8 flex flex-col">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">{icon}</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="mb-6">
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto">
        <Link
          href={buttonLink}
          className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-center font-semibold py-3 px-6 rounded-lg transition-colors mb-4"
        >
          {buttonText}
        </Link>
        <p className="text-center text-sm font-semibold text-gray-900">
          {pricing}
        </p>
      </div>
    </div>
  );
}