"use client";
import Link from "next/link";
import { useState } from "react";

const registerDropdown = [
  { label: "For Sale By Owner", href: "/register/fsbo" },
  { label: "Agent", href: "/register" },
  { label: "Landlord", href: "/register/landlord" },
];

const consumerSites = [
  { label: "Guyana Home Hub", href: "https://guyanahomehub.com", active: true, flag: "🇬🇾" },
  { label: "Ghana Home Hub", active: false, flag: "🇬🇭" },
  { label: "Rwanda Home Hub", active: false, flag: "🇷🇼" },
  { label: "South Africa Home Hub", active: false, flag: "🇿🇦" },
  { label: "Trinidad Home Hub", active: false, flag: "🇹🇹" },
  { label: "Jamaica Home Hub", active: false, flag: "🇯🇲" },
  { label: "Namibia Home Hub", active: false, flag: "🇳🇦" },
  { label: "DR Home Hub", active: false, flag: "🇩🇴" },
  { label: "Caribbean Home Hub", active: false, flag: "🏝️" },
];

export default function PublicNavBar() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSitesDropdown, setShowSitesDropdown] = useState(false);

  return (
    <nav className="bg-blue-900 text-white px-4 py-3 flex flex-col sm:flex-row justify-between items-center shadow-md w-full">
      <Link href="/" className="font-bold text-lg mb-2 sm:mb-0 hover:underline">
        Portal Home Hub
      </Link>
      
      <ul className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative items-center">
        {/* Consumer Sites Dropdown */}
        <li className="relative">
          <button
            className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-600 flex items-center"
            onClick={() => setShowSitesDropdown(prev => !prev)}
            onBlur={() => setTimeout(() => setShowSitesDropdown(false), 200)}
          >
            Consumer Sites
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showSitesDropdown && (
            <ul className="absolute left-0 top-full mt-2 bg-white text-blue-900 rounded shadow-lg min-w-[220px] z-20">
              {consumerSites.map(site => (
                <li key={site.label} className="flex items-center px-4 py-2">
                  <span className="mr-2 text-lg">{site.flag}</span>
                  {site.active ? (
                    <a href={site.href} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-900">
                      {site.label}
                    </a>
                  ) : (
                    <span className="text-gray-400 cursor-not-allowed" title="Coming Soon">
                      {site.label} <span className="ml-1 text-xs">(Coming Soon)</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>

        {/* Register Dropdown */}
        <li className="relative">
          <button
            className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-600 flex items-center"
            onClick={() => setShowDropdown(prev => !prev)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          >
            Register
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showDropdown && (
            <ul className="absolute left-0 top-full mt-2 bg-white text-blue-900 rounded shadow-lg min-w-[180px] z-10">
              {registerDropdown.map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="block px-4 py-2 hover:bg-blue-100">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>

        {/* Login Button */}
        <li>
          <Link href="/login" className="bg-green-600 px-4 py-2 rounded hover:bg-green-500 font-semibold">
            Login
          </Link>
        </li>
      </ul>
    </nav>
  );
}