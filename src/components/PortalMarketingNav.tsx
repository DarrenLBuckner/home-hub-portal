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
              <img 
                src="/images/phh-logo-48.png" 
                alt="PHH" 
                className="w-8 h-8 mr-2"
              />
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
              <Link
                href="/franchise"
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Partnership Opportunities
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