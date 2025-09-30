

import type { Metadata } from "next";
import "./globals.css";
import AuthNavBar from '../components/AuthNavBar';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Portal Home Hub - Real Estate Portal",
  description: "Portal Home Hub - Real estate portal for agents, landlords, and FSBO. Find and list properties in Guyana and beyond.",
  keywords: "real estate, property, homes, agents, landlords, FSBO, Guyana, Portal Home Hub",
  authors: [{ name: "Portal Home Hub" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Standard favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        
        {/* Android/Chrome Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/android-icon-192x192.png" />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Microsoft Tile Icons */}
        <meta name="msapplication-TileColor" content="#0a2540" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* Theme Colors */}
        <meta name="theme-color" content="#0a2540" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased">
        <AuthNavBar />
        <main>
          {children}
        </main>
        
        <footer className="bg-gray-100 border-t">
          {/* Admin access - subtle link at the very bottom */}
          <div className="border-t border-gray-200 mt-8 pt-4">
            <div className="max-w-7xl mx-auto px-4 pb-4">
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>© 2024 Portal Home Hub</span>
                <Link 
                  href="/admin-login" 
                  className="hover:text-gray-600 transition-colors"
                >
                  Staff Access
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
