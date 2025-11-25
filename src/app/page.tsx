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
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-lg">
              <img 
                src="/images/phh-logo-192.png" 
                alt="PHH" 
                className="w-20 h-20 object-contain"
              />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Portal Home Hub
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-4">
            Professional Real Estate Management
          </p>
          <p className="text-lg text-slate-400 mb-8">
            Property Management Platform
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
              description="Professional tools for sales & rental management"
              price="Flexible Plans"
              priceLabel="Monthly Subscription"
              features={[
                'Unlimited listing capability',
                'Photo & video upload',
                'Professional profile page',
                'WhatsApp lead integration',
                'Priority customer support',
                'Advanced analytics & reporting',
                'Professional marketing tools'
              ]}
              buttonText="Get Started"
              buttonLink="/register/select-country"
            />

            {/* Landlord Services */}
            <PricingCard
              icon="🏠"
              title="Landlord Services"
              description="Professional rental property management"
              price="Competitive Rates"
              priceLabel="Per Property"
              features={[
                '1 rental property listing',
                'High-quality photo gallery',
                'WhatsApp tenant inquiries',
                'Professional property showcase',
                'Application processing (upgrade)',
                'Premium listing exposure',
                'Tenant screening tools (coming soon)'
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
              price="Affordable Pricing"
              priceLabel="Per Listing"
              features={[
                '1 property for sale',
                'Professional photo upload',
                'Full platform exposure',
                'Direct buyer contact',
                'Marketing & promotion tools',
                'Featured listing placement',
                'Expert listing guidance (add-on service)'
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

      {/* Franchise Opportunity Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="text-5xl mb-6">🌍</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Expand Portal Home Hub to Your Country
          </h2>
          <p className="text-xl text-blue-100 mb-6 max-w-3xl mx-auto">
            Ready to bring professional real estate services to your market? Partner with us to launch your own Portal Home Hub franchise.
          </p>
          
          {/* Quick Regional Overview */}
          <div className="flex flex-wrap justify-center gap-4 mb-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-blue-100 text-sm">
              <span className="font-medium">🏝️ Caribbean:</span> Trinidad, Barbados, Bahamas +12 more
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-blue-100 text-sm">
              <span className="font-medium">🌍 Africa:</span> Ghana, Kenya, Rwanda, Uganda, Namibia, Tanzania
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 text-blue-100 text-sm">
              <span className="font-medium">🌎 Latin America:</span> Colombia, Panama, Costa Rica +3 more
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl mb-2">🚀</div>
              <h3 className="font-bold text-white mb-2">Proven Platform</h3>
              <p className="text-blue-100 text-sm">Operating successfully in multiple countries</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-bold text-white mb-2">Fast Launch</h3>
              <p className="text-blue-100 text-sm">Launch in weeks with our proven infrastructure</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="text-2xl mb-2">📈</div>
              <h3 className="font-bold text-white mb-2">Full Support</h3>
              <p className="text-blue-100 text-sm">Marketing, training, and ongoing assistance</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="/franchise"
              className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
            >
              Learn More About Partnership
            </Link>
            <a 
              href="mailto:partnerships@portalhomehub.com?subject=Franchise Opportunity Inquiry"
              className="bg-purple-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-900 transition-colors"
            >
              Contact Partnerships Team
            </a>
          </div>
        </div>
      </div>

      {/* Business Contact Section */}
      <div className="bg-slate-800/50 backdrop-blur py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Grow Your Business?
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Get in touch with our team for personalized support, technical assistance, or partnership opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* General Business Inquiries */}
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🏢</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Business Inquiries</h3>
              <p className="text-gray-600 mb-4">Questions about our platform, pricing, or features?</p>
              <Link
                href="/contact?type=general"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Contact Sales
              </Link>
            </div>

            {/* Technical Support */}
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Technical Support</h3>
              <p className="text-gray-600 mb-4">Need help with your account or experiencing technical issues?</p>
              <Link
                href="/contact?type=technical_support"
                className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Get Support
              </Link>
            </div>

            {/* Advertising */}
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Advertising</h3>
              <p className="text-gray-600 mb-4">Reach customers across our Caribbean markets</p>
              <Link
                href="/contact?type=advertising"
                className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Advertise
              </Link>
            </div>
          </div>

          {/* Quick Contact Options */}
          <div className="mt-12 text-center">
            <p className="text-slate-300 mb-4">Need immediate assistance?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20I%27m%20interested%20in%20your%20platform." 
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                📱 WhatsApp +592 762-9797
              </a>
              <a 
                href="mailto:manager@portalhomehub.com?subject=Portal Home Hub Inquiry" 
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                📧 Email Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 mb-2">Portal Home Hub - Professional Real Estate Platform</p>
        <p className="text-slate-500 text-sm">Serving the Caribbean, Africa & Beyond</p>
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

