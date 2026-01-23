// src/app/maintenance/page.tsx
import Link from 'next/link';

export const metadata = {
  title: 'Under Maintenance | HomeHub',
  description: 'This HomeHub territory is currently under maintenance. Please check back soon.',
};

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-md mx-auto px-6 py-12 text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Under Maintenance
          </h1>

          <p className="text-gray-600 mb-6">
            This HomeHub territory is currently undergoing scheduled maintenance.
            We apologize for any inconvenience and will be back online shortly.
          </p>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="font-semibold text-gray-800 mb-2">Need assistance?</h2>
            <p className="text-sm text-gray-600 mb-4">
              Contact our support team for urgent inquiries.
            </p>
            <a
              href="mailto:support@portalhomehub.com"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              support@portalhomehub.com
            </a>
          </div>

          <Link
            href="https://portalhomehub.com"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Visit Portal HomeHub
          </Link>
        </div>

        <p className="text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Portal HomeHub. All rights reserved.
        </p>
      </div>
    </div>
  );
}
