'use client';

import Link from 'next/link';

export default function PortalMarketingNav() {
  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          
          {/* Left Side - Logo & Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <svg className="w-8 h-8 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"/>
              </svg>
              <span className="text-xl font-bold text-white">Portal Home Hub</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/services"
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Professional Services
              </Link>
            </div>
          </div>

          {/* Right Side - Auth Links Only */}
          <div className="flex items-center space-x-4">
            <Link
              href="/register/select-country"
              className="text-slate-300 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sign Up
            </Link>
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}