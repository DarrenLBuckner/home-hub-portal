// src/app/coming-soon/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ComingSoonPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      const response = await fetch('/api/email-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'coming-soon' }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        setError('Failed to subscribe. Please try again.');
      }
    } catch {
      setError('Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Coming Soon
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            We're preparing to launch HomeHub in your region. Be the first to know
            when we go live and get exclusive early access benefits!
          </p>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="mb-8">
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Notify Me
                </button>
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </form>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center mb-3">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                You're on the list!
              </h3>
              <p className="text-green-700">
                We'll notify you as soon as HomeHub launches in your region.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">🏠</div>
              <h3 className="font-semibold text-gray-800">Premium Listings</h3>
              <p className="text-sm text-gray-600">
                Showcase your properties beautifully
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">🤝</div>
              <h3 className="font-semibold text-gray-800">Connect</h3>
              <p className="text-sm text-gray-600">
                Match buyers with sellers instantly
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold text-gray-800">Easy to Use</h3>
              <p className="text-sm text-gray-600">
                Modern platform, mobile-friendly
              </p>
            </div>
          </div>

          <Link
            href="https://portalhomehub.com"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
          >
            <span>Learn more at Portal HomeHub</span>
            <svg
              className="w-4 h-4 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Portal HomeHub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
