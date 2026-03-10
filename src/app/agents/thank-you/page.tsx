import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile Submitted | Portal Home Hub',
  description: 'Your agent profile has been submitted for review.',
};

export default function AgentThankYouPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-10">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Profile Submitted
          </h1>

          <p className="text-gray-600 mb-6 leading-relaxed">
            Your profile has been submitted. Our team will review and approve it within 48 hours.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm">
              Once approved, your profile will be visible to diaspora buyers searching for agents in your area.
              We will notify you by email when your profile goes live.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/agents/join"
              className="block w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Edit Your Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
