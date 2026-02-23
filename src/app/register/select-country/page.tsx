"use client";
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCountryFromDomain } from '@/lib/country-detection';
import { usePricingSummary } from '@/hooks/usePricing';

// Hook to fetch founding agent spots for a country
function useFoundingAgentSpots(countryCode: string) {
  const [data, setData] = useState<{
    spotsRemaining: number;
    isLoading: boolean;
    isActive: boolean; // Whether the founding program is actually active
  }>({
    spotsRemaining: 0,
    isLoading: true,
    isActive: false
  });

  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const response = await fetch('/api/founding-agent/counter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userType: 'agent', countryId: countryCode })
        });
        const result = await response.json();
        if (result.success && !result.programClosed && result.spotsRemaining > 0) {
          // Program is active with spots remaining
          setData({ spotsRemaining: result.spotsRemaining, isLoading: false, isActive: true });
        } else {
          // Program closed or no spots remaining
          setData({ spotsRemaining: 0, isLoading: false, isActive: false });
        }
      } catch {
        setData({ spotsRemaining: 0, isLoading: false, isActive: false });
      }
    };
    fetchSpots();
  }, [countryCode]);

  return data;
}

// Available countries with their details - organized by region
const countries = [
  // Caribbean - Available Now
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
    region: 'caribbean',
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
    region: 'caribbean',
    active: true
  },
  // Caribbean - Coming Soon
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
    region: 'caribbean',
    active: false,
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
    region: 'caribbean',
    active: false,
    comingSoon: true
  },
  {
    code: 'BS',
    name: 'Bahamas',
    fullName: 'Commonwealth of The Bahamas',
    currency: 'BSD',
    symbol: 'B$',
    flag: '🇧🇸',
    domain: 'bahamashomehub.com',
    description: 'Caribbean Paradise - Luxury real estate haven in the Atlantic',
    features: ['Luxury market', 'English speaking', 'Tourism hub'],
    region: 'caribbean',
    active: false,
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
    region: 'caribbean',
    active: false,
    comingSoon: true
  },
  {
    code: 'HT',
    name: 'Haiti',
    fullName: 'Republic of Haiti',
    currency: 'HTG',
    symbol: 'G',
    flag: '🇭🇹',
    domain: 'haitihomehub.com',
    description: 'Pearl of the Antilles - Emerging market with investment potential',
    features: ['Emerging market', 'French/Creole speaking', 'Investment potential'],
    region: 'caribbean',
    active: false,
    comingSoon: true
  },
  {
    code: 'BZ',
    name: 'Belize',
    fullName: 'Belize',
    currency: 'BZD',
    symbol: 'BZ$',
    flag: '🇧🇿',
    domain: 'belizehomehub.com',
    description: 'Caribbean Coast meets Central America - Diverse real estate opportunities',
    features: ['Caribbean coast', 'English speaking', 'Diverse market'],
    region: 'caribbean',
    active: false,
    comingSoon: true
  }
];

interface PricingDisplayProps {
  countryCode: string;
  foundingAgentSpots?: number;
  foundingProgramActive?: boolean; // Whether the founding program is live (vs coming soon)
}

function PricingDisplay({ countryCode, foundingAgentSpots, foundingProgramActive = false }: PricingDisplayProps) {
  const { summary, country, loading, error } = usePricingSummary(countryCode);
  const hasFoundingSpots = foundingAgentSpots !== undefined && foundingAgentSpots > 0;

  if (loading) {
    return (
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Loading pricing...</h4>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !summary || !country) {
    return (
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2">Sample Pricing in {countryCode}:</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Real Estate Agent:</span>
            <span className="font-medium text-gray-900">Coming Soon</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Landlord Services:</span>
            <span className="font-medium text-gray-900">Coming Soon</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sell By Owner:</span>
            <span className="font-medium text-gray-900">Coming Soon</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {/* Founding Agent Banner */}
      {hasFoundingSpots && foundingProgramActive && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-300 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-center gap-2 text-yellow-800 font-semibold">
            <span>🏆</span>
            <span>FOUNDING AGENT PROGRAM</span>
            <span className="text-orange-600">- Only {foundingAgentSpots} spots left!</span>
          </div>
          <p className="text-center text-sm text-yellow-700 mt-1">
            Get FREE access + 20% off for life
          </p>
        </div>
      )}

      {/* Founding Agent Coming Soon Banner */}
      {hasFoundingSpots && !foundingProgramActive && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-300 rounded-lg p-3 mb-4 opacity-75">
          <div className="flex items-center justify-center gap-2 text-gray-700 font-semibold">
            <span>🏆</span>
            <span>FOUNDING AGENT PROGRAM</span>
            <span className="text-blue-600">- Coming Soon!</span>
          </div>
          <p className="text-center text-sm text-gray-600 mt-1">
            {foundingAgentSpots} spots available · FREE access + 20% off for life
          </p>
        </div>
      )}

      <h4 className="font-semibold text-gray-900 mb-2">Pricing in {country.currency_code}:</h4>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-start">
          <span className="text-gray-600">Real Estate Agent:</span>
          {hasFoundingSpots && foundingProgramActive ? (
            <div className="text-right">
              <span className="text-green-600 font-bold">FREE* for Founding Agents</span>
              <p className="text-xs text-gray-500">*Regular: {summary.agent.starting ? `${summary.agent.starting}${summary.agent.suffix}` : 'N/A'}</p>
            </div>
          ) : (
            <span className="font-medium text-gray-900">
              {summary.agent.starting ? `${summary.agent.starting}${summary.agent.suffix}` : 'Coming Soon'}
            </span>
          )}
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Landlord Services:</span>
          <span className="font-medium text-gray-900">
            {summary.landlord.range ? `${summary.landlord.range}${summary.landlord.suffix}` : 'Coming Soon'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Sell By Owner:</span>
          <span className="font-medium text-gray-900">
            {summary.fsbo.range ? `${summary.fsbo.range}${summary.fsbo.suffix}` : 'Coming Soon'}
          </span>
        </div>
      </div>
    </div>
  );
}

// Country Card Component - uses the founding agent hook
interface CountryCardProps {
  country: typeof countries[0];
  selectedCountry: string | null;
  onCountrySelect: (countryCode: string, type: 'agent' | 'landlord' | 'owner', foundingProgramActive?: boolean) => void;
}

function CountryCard({ country, selectedCountry, onCountrySelect }: CountryCardProps) {
  const { spotsRemaining, isLoading, isActive } = useFoundingAgentSpots(country.code);
  const hasActiveFoundingProgram = !isLoading && spotsRemaining > 0 && isActive;

  return (
    <div
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
        <PricingDisplay
          countryCode={country.code}
          foundingAgentSpots={spotsRemaining}
          foundingProgramActive={isActive}
        />

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => onCountrySelect(country.code, 'agent', hasActiveFoundingProgram)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            {hasActiveFoundingProgram ? 'Start as Real Estate Agent - Claim Your Spot' : 'Start as Real Estate Agent'}
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onCountrySelect(country.code, 'landlord')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Landlord Services
            </button>
            <button
              onClick={() => onCountrySelect(country.code, 'owner')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Sell By Owner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  // Promo codes for founding agent programs by country
  // Note: GY founding program closed (26 agents enrolled). JM still available for future launch.
  const foundingAgentPromoCodes: Record<string, string> = {
    'JM': 'FOUNDING-AGENT-JM',
  };

  const handleCountrySelect = (countryCode: string, type: 'agent' | 'landlord' | 'owner', foundingProgramActive?: boolean) => {
    const country = countries.find(c => c.code === countryCode);
    if (!country || !country.active) return;

    // Set country cookie
    document.cookie = `country-code=${countryCode}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;

    // Route to appropriate registration page
    switch (type) {
      case 'agent':
        // Include promo code if founding agent program is active for this country
        const promoCode = foundingProgramActive ? foundingAgentPromoCodes[countryCode] : null;
        const agentUrl = promoCode
          ? `/register?type=agent&country=${countryCode}&code=${promoCode}`
          : `/register?type=agent&country=${countryCode}`;
        router.push(agentUrl);
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

        {/* Caribbean Available Now Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            🌴 CARIBBEAN - Available Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {countries.filter(country => country.region === 'caribbean' && country.active).map((country) => (
              <CountryCard
                key={country.code}
                country={country}
                selectedCountry={selectedCountry}
                onCountrySelect={handleCountrySelect}
              />
            ))}
          </div>
        </div>

        {/* Caribbean Coming Soon Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-4">
            🌴 CARIBBEAN - Coming Soon
          </h2>
          <p className="text-gray-600 text-center mb-8 max-w-2xl mx-auto">
            We're working hard to expand Portal Home Hub to these exciting Caribbean markets. 
            Stay tuned for launch announcements!
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {countries.filter(country => country.region === 'caribbean' && country.comingSoon).map((country) => (
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
                <PricingDisplay countryCode={country.code} />

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