import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Portal Home Hub - Property Management Platform',
  description: 'Professional real estate management tools for agents, landlords, and property owners.',
};

export default async function PortalHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard');
  }

  // Show marketing page with pricing cards
  return (
    <Suspense fallback={<LoadingScreen />}>
      <PortalMarketingContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  );
}

// Marketing content for agents/landlords/FSBO to sign up
function PortalMarketingContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900">
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Portal Home Hub
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8">
            Professional Real Estate Management
          </p>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Manage your property listings, connect with customers, and grow your real estate business across the Caribbean, Africa and beyond
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <FeatureCard 
            icon="📸"
            title="Professional Listings"
            description="Create beautiful property listings with galleries and detailed information"
          />
          <FeatureCard 
            icon="💬"
            title="WhatsApp Integration"
            description="Get instant customer inquiries directly via WhatsApp"
          />
          <FeatureCard 
            icon="📊"
            title="Real-time Analytics"
            description="Track views, inquiries, and performance of your listings"
          />
        </div>
      </div>

      {/* Pricing Cards Section */}
      <div className="bg-white/5 backdrop-blur-sm py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Choose Your Plan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Real Estate Agent */}
            <PricingCard
              icon="🏢"
              title="Real Estate Agent"
              description="Manage sales & rentals with professional tools"
              price="$49-99/month"
              priceLabel="Subscription"
              features={[
                'Up to 10 active listings',
                'Professional profile page',
                'WhatsApp integration',
                'Priority support',
                'Advanced analytics'
              ]}
              buttonText="Get Started"
              buttonLink="/register/select-country"
            />

            {/* Landlord Services */}
            <PricingCard
              icon="🏠"
              title="Landlord Services"
              description="Professional rental property management"
              price="$79-149"
              priceLabel="Per listing"
              features={[
                '1 rental property listing',
                'WhatsApp integration',
                'Photo gallery',
                'Tenant inquiries',
                'Property management tools'
              ]}
              buttonText="Get Started"
              buttonLink="/register/select-country"
              highlighted
            />

            {/* Sell By Owner */}
            <PricingCard
              icon="🏆"
              title="Sell By Owner"
              description="Sell your property without an agent"
              price="$99-199"
              priceLabel="Per listing"
              features={[
                '1 property for sale',
                'Full platform exposure',
                'Direct buyer contact',
                'Marketing support',
                'Sales tools'
              ]}
              buttonText="Get Started"
              buttonLink="/register/select-country"
            />
          </div>

          {/* Already have account */}
          <div className="text-center mt-12">
            <p className="text-slate-300 mb-4">Already have an account?</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold text-lg"
            >
              Sign in to your dashboard
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 mb-2">Need help?</p>
        <a href="tel:+5927629797" className="text-blue-400 hover:text-blue-300 text-lg font-medium">
          Call +592-762-9797
        </a>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-300 text-sm">{description}</p>
    </div>
  );
}

// Pricing Card Component
function PricingCard({ 
  icon, 
  title, 
  description, 
  price, 
  priceLabel,
  features, 
  buttonText, 
  buttonLink,
  highlighted = false
}: {
  icon: string;
  title: string;
  description: string;
  price: string;
  priceLabel: string;
  features: string[];
  buttonText: string;
  buttonLink: string;
  highlighted?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-2xl p-8 flex flex-col ${highlighted ? 'ring-4 ring-emerald-500 transform scale-105' : ''}`}>
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
        <p className="text-center">
          <span className="text-sm text-gray-600">{priceLabel}:</span>
          <span className="text-lg font-bold text-gray-900 ml-1">{price}</span>
        </p>
      </div>
    </div>
  );
}

