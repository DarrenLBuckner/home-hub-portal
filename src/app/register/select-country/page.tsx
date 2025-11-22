"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCountryFromDomain } from '@/lib/country-detection';

// Available countries with their details
const countries = [
  {
    code: 'GY',
    name: 'Guyana',
    fullName: 'Cooperative Republic of Guyana',
    currency: 'GYD',
    symbol: 'G$',
    flag: '🇬🇾',
    domain: 'guyanahomehub.com',
    description: 'Land of Many Waters - Emerging real estate market with growing opportunities',
    features: ['Established market', 'English speaking', 'Growing economy'],
    samplePrices: {
      agent: 'G$49,99/month',
      landlord: 'G$79-149/listing',
      owner: 'G$99-199/listing'
    },
    active: true
  },
  {
    code: 'JM',
    name: 'Jamaica',
    fullName: 'Jamaica',
    currency: 'JMD',
    symbol: 'J$',
    flag: '🇯🇲',
    domain: 'jamaicahomehub.com',
    description: 'Out of Many, One People - Vibrant Caribbean real estate market',
    features: ['Tourism-driven', 'English speaking', 'High demand'],
    samplePrices: {
      agent: 'J$7,350/month',
      landlord: 'J$12,000-22,000/listing',
      owner: 'J$15,000-30,000/listing'
    },
    active: true
  },
  {
    code: 'TT',
    name: 'Trinidad & Tobago',
    fullName: 'Republic of Trinidad and Tobago',
    currency: 'TTD',
    symbol: 'TT$',
    flag: '🇹🇹',
    domain: 'trinidadhomehub.com',
    description: 'Together We Aspire, Together We Achieve - Twin island prosperity',
    features: ['Oil & gas economy', 'English speaking', 'Stable market'],
    samplePrices: {
      agent: 'TT$400/month',
      landlord: 'TT$500-750/listing',
      owner: 'TT$650-1,100/listing'
    },
    active: false, // Coming soon
    comingSoon: true
  },
  {
    code: 'BB',
    name: 'Barbados',
    fullName: 'Barbados',
    currency: 'BBD',
    symbol: 'Bds$',
    flag: '🇧🇧',
    domain: 'barbadoshomehub.com',
    description: 'Pride and Industry - Premium Caribbean real estate destination',
    features: ['Luxury market', 'English speaking', 'Tourism hub'],
    samplePrices: {
      agent: 'Bds$150/month',
      landlord: 'Bds$200-350/listing',
      owner: 'Bds$250-500/listing'
    },
    active: false, // Coming soon
    comingSoon: true
  },
  {
    code: 'GH',
    name: 'Ghana',
    fullName: 'Republic of Ghana',
    currency: 'GHS',
    symbol: 'GH₵',
    flag: '🇬🇭',
    domain: 'ghanahomehub.com',
    description: 'Gateway to Africa - Rapidly growing economy with emerging real estate opportunities',
    features: ['Growing economy', 'English speaking', 'Political stability'],
    samplePrices: {
      agent: 'GH₵180/month',
      landlord: 'GH₵250-400/listing',
      owner: 'GH₵300-600/listing'
    },
    active: false, // Coming soon
    comingSoon: true
  },
  {
    code: 'RW',
    name: 'Rwanda',
    fullName: 'Republic of Rwanda',
    currency: 'RWF',
    symbol: 'RF',
    flag: '🇷🇼',
    domain: 'rwandahomehub.com',
    description: 'Land of a Thousand Hills - East Africa\'s rising economic star',
    features: ['Fast-growing economy', 'Investment friendly', 'Clean & safe'],
    samplePrices: {
      agent: 'RF35,000/month',
      landlord: 'RF45,000-75,000/listing',
      owner: 'RF60,000-120,000/listing'
    },
    active: false, // Coming soon
    comingSoon: true
  },
  {
    code: 'ZA',
    name: 'South Africa',
    fullName: 'Republic of South Africa',
    currency: 'ZAR',
    symbol: 'R',
    flag: '🇿🇦',
    domain: 'southafricahomehub.com',
    description: 'Rainbow Nation - Africa\'s most developed real estate market',
    features: ['Developed market', 'Multiple languages', 'Investment hub'],
    samplePrices: {
      agent: 'R750/month',
      landlord: 'R1,000-1,800/listing',
      owner: 'R1,200-2,500/listing'
    },
    active: false, // Coming soon
    comingSoon: true
  },
  {
    code: 'NA',
    name: 'Namibia',
    fullName: 'Republic of Namibia',
    currency: 'NAD',
    symbol: 'N$',
    flag: '🇳🇦',
    domain: 'namibiahomehub.com',
    description: 'Land of the Brave - Southern Africa\'s diamond in the rough',
    features: ['Mining economy', 'English speaking', 'Tourism potential'],
    samplePrices: {
      agent: 'N$450/month',
      landlord: 'N$600-1,000/listing',
      owner: 'N$750-1,500/listing'
    },
    active: false, // Coming soon
    comingSoon: true
  },
  {
    code: 'DO',
    name: 'Dominican Republic',
    fullName: 'Dominican Republic',
    currency: 'DOP',
    symbol: 'RD$',
    flag: '🇩🇴',
    domain: 'dominicanrepublichomehub.com',
    description: 'Caribbean Paradise - Premier Caribbean real estate destination',
    features: ['Tourism economy', 'Spanish speaking', 'Beach properties'],
    samplePrices: {
      agent: 'RD$2,800/month',
      landlord: 'RD$3,500-6,000/listing',
      owner: 'RD$4,500-8,500/listing'
    },
    active: false, // Coming soon
    comingSoon: true
  },
];

function SelectCountryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [userType, setUserType] = useState<'agent' | 'landlord' | 'owner' | null>(null);

  // Auto-detect country from domain and cookies, plus handle URL type parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Handle URL type parameter from GuyanaHomeHub links
      const typeParam = searchParams?.get('type');
      if (typeParam && ['agent', 'landlord', 'fsbo'].includes(typeParam)) {
        setUserType(typeParam === 'fsbo' ? 'owner' : typeParam as 'agent' | 'landlord');
      }
      
      // Try domain-based detection first
      const detectedCountryCode = getCountryFromDomain(window.location.hostname);
      const detectedCountry = countries.find(c => c.code === detectedCountryCode);
      
      if (detectedCountry && detectedCountry.active) {
        setSelectedCountry(detectedCountry.code);
      }
      
      // Also check for existing country cookie
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('country-code='))
        ?.split('=')[1];
      
      if (cookieValue && countries.find(c => c.code === cookieValue && c.active)) {
        setSelectedCountry(cookieValue);
      }
    }
  }, [searchParams]);

  const handleCountrySelect = (countryCode: string, type: 'agent' | 'landlord' | 'owner') => {
    const country = countries.find(c => c.code === countryCode);
    if (!country || !country.active) return;

    // Set country cookie
    document.cookie = `country-code=${countryCode}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    
    // Route to appropriate registration page
    switch (type) {
      case 'agent':
        router.push(`/register?type=agent&country=${countryCode}`);
        break;
      case 'landlord':
        router.push(`/register/landlord?type=landlord&country=${countryCode}`);
        break;
      case 'owner':
        router.push(`/register/fsbo?type=fsbo&country=${countryCode}`);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Portal Home Hub</h1>
            </div>
            <Link 
              href="/"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Choose Your Country
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Portal Home Hub serves multiple countries across the Caribbean and beyond. 
            Select your country to see local pricing and get started with the right plan for your market.
          </p>
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Same powerful platform, local pricing & currency</span>
          </div>
        </div>

        {/* Active Countries Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            🚀 Available Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {countries.filter(country => country.active).map((country) => (
              <div 
                key={country.code}
                className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                  selectedCountry === country.code 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {/* Country Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-4xl">{country.flag}</span>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">{country.name}</h3>
                        <p className="text-sm text-gray-500">{country.fullName}</p>
                      </div>
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Available Now
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{country.description}</p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {country.features.map((feature, idx) => (
                      <span 
                        key={idx}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing Preview */}
                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Sample Pricing in {country.currency}:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Real Estate Agent:</span>
                        <span className="font-medium text-gray-900">{country.samplePrices.agent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Landlord Services:</span>
                        <span className="font-medium text-gray-900">{country.samplePrices.landlord}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sell By Owner:</span>
                        <span className="font-medium text-gray-900">{country.samplePrices.owner}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={() => handleCountrySelect(country.code, 'agent')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Start as Real Estate Agent
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleCountrySelect(country.code, 'landlord')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        Landlord Services
                      </button>
                      <button
                        onClick={() => handleCountrySelect(country.code, 'owner')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        Sell By Owner
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming Soon Countries Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            🚧 Coming Soon
          </h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            We're working hard to expand Portal Home Hub to these exciting markets. 
            Stay tuned for launch announcements!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {countries.filter(country => country.comingSoon).map((country) => (
            <div 
              key={country.code}
              className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 ${
                selectedCountry === country.code 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200 hover:border-blue-300'
              } ${!country.active ? 'opacity-60' : ''}`}
            >
              {/* Country Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <span className="text-4xl">{country.flag}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{country.name}</h3>
                      <p className="text-sm text-gray-500">{country.fullName}</p>
                    </div>
                  </div>
                  {country.active && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                      Available Now
                    </div>
                  )}
                  {country.comingSoon && (
                    <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                      Coming Soon
                    </div>
                  )}
                </div>
                
                <p className="text-gray-600 mb-4">{country.description}</p>
                
                {/* Features */}
                <div className="flex flex-wrap gap-2">
                  {country.features.map((feature, idx) => (
                    <span 
                      key={idx}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Pricing Preview */}
              <div className="p-6">
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Sample Pricing in {country.currency}:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Real Estate Agent:</span>
                      <span className="font-medium text-gray-900">{country.samplePrices.agent}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Landlord Services:</span>
                      <span className="font-medium text-gray-900">{country.samplePrices.landlord}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sell By Owner:</span>
                      <span className="font-medium text-gray-900">{country.samplePrices.owner}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {country.active ? (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleCountrySelect(country.code, 'agent')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
                    >
                      Start as Real Estate Agent
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleCountrySelect(country.code, 'landlord')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        Landlord Services
                      </button>
                      <button
                        onClick={() => handleCountrySelect(country.code, 'owner')}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        Sell By Owner
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 px-4 py-3 rounded-lg font-medium cursor-not-allowed"
                    >
                      Coming Soon - Stay Tuned!
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      We're working hard to bring Portal Home Hub to {country.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
            ))}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            One Platform, Multiple Markets
          </h3>
          <p className="text-gray-600 mb-6">
            After selecting your country, you'll have access to the same powerful property management tools, 
            but with local pricing, currency, and market-specific features. Your dashboard and all functionality 
            remain consistent across all countries.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Your data is completely secure and isolated by country</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SelectCountryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SelectCountryContent />
    </Suspense>
  );
}