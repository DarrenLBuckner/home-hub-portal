'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ContactForm from '@/components/ContactForm';
import Link from 'next/link';
import PageTracker from '@/components/PageTracker';

function ContactPageContent() {
  const searchParams = useSearchParams();
  const type = searchParams?.get('type') as 'general' | 'technical_support' | 'agent_question' | 'landlord_question' | 'partnership' | 'advertising' || 'general';

  const getPageTitle = () => {
    const titles = {
      general: 'Contact Portal Home Hub',
      technical_support: 'Technical Support',
      agent_question: 'Agent Support',
      landlord_question: 'Landlord Support',
      partnership: 'Partnership Inquiries',
      advertising: 'Advertising Opportunities'
    };
    return titles[type] || 'Contact Us';
  };

  const getPageDescription = () => {
    const descriptions = {
      general: 'Get in touch with our team for any questions about Portal Home Hub\'s professional real estate platform.',
      technical_support: 'Our technical support team is here to help with any platform issues or questions.',
      agent_question: 'Questions about our real estate agent tools, subscriptions, and features.',
      landlord_question: 'Learn more about our landlord services and property management solutions.',
      partnership: 'Interested in bringing Portal Home Hub to your country or region?',
      advertising: 'Reach thousands of real estate professionals and property seekers across our markets.'
    };
    return descriptions[type] || 'We\'re here to help with any questions about Portal Home Hub.';
  };

  return (
    <>
      <PageTracker path="/contact" />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/"
              className="flex items-center space-x-3"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white">Portal Home Hub</h1>
            </Link>
            <Link 
              href="/"
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {getPageTitle()}
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            {getPageDescription()}
          </p>
        </div>

        {/* Contact Form */}
        <ContactForm inquiryType={type} />

        {/* Additional Contact Methods */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* WhatsApp */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center border border-white/20">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="text-lg font-semibold text-white mb-2">WhatsApp</h3>
            <p className="text-slate-300 text-sm mb-4">Get instant support via WhatsApp</p>
            <a
              href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20I%20need%20help%20with%20my%20account."
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 font-medium"
            >
              +592 762-9797
            </a>
          </div>

          {/* Email */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center border border-white/20">
            <div className="text-3xl mb-3">📧</div>
            <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
            <p className="text-slate-300 text-sm mb-4">Send us a direct email</p>
            <a
              href="mailto:manager@portalhomehub.com"
              className="text-blue-400 hover:text-blue-300 font-medium break-all"
            >
              manager@portalhomehub.com
            </a>
          </div>

          {/* Business Hours */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center border border-white/20">
            <div className="text-3xl mb-3">🕒</div>
            <h3 className="text-lg font-semibold text-white mb-2">Response Time</h3>
            <p className="text-slate-300 text-sm">
              We respond within 24 hours<br/>
              Technical issues: Same day<br/>
              WhatsApp: Usually instant
            </p>
          </div>
        </div>

        {/* Contact Type Switcher */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            Need a different type of support?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href="/contact?type=agent_question"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-colors"
            >
              🏢 Agent Questions
            </Link>
            <Link
              href="/contact?type=landlord_question"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-colors"
            >
              🏠 Landlord Support
            </Link>
            <Link
              href="/contact?type=technical_support"
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-colors"
            >
              🔧 Technical Support
            </Link>
            <Link
              href="/contact?type=partnership"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-colors"
            >
              🤝 Partnerships
            </Link>
            <Link
              href="/contact?type=advertising"
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-colors"
            >
              📢 Advertising
            </Link>
            <Link
              href="/contact?type=general"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-center font-medium transition-colors"
            >
              📩 General Inquiry
            </Link>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-bold text-white mb-6">Other Ways to Get Started</h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register/select-country"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              🚀 Start Your Free Trial
            </Link>
            <Link
              href="/franchise"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
            >
              🌍 Franchise Opportunities
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <ContactPageContent />
    </Suspense>
  );
}