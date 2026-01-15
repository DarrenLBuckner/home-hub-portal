import type { Metadata } from "next";
import "./globals.css";
import AuthNavBar from '../components/AuthNavBar';
import Link from 'next/link';
import { CountryThemeProvider } from '@/components/CountryThemeProvider';
import { getCountryFromHeaders } from '@/lib/country-detection-server';

// Facebook Pixel ID for conversion tracking
const FB_PIXEL_ID = '1245060350797314';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Portal Home Hub - Professional Real Estate Management',
    description: 'Portal Home Hub - Comprehensive real estate management platform for professionals across the Caribbean, Africa and beyond.',
    keywords: 'real estate, property management, portal, agents, landlords, FSBO, Caribbean, Africa, professional',
    authors: [{ name: 'Portal Home Hub' }],
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const country = await getCountryFromHeaders();
  
  return (
    <html lang="en">
      <head>
        {/* Next.js automatically serves favicon.ico from /public/ - no manual link needed */}
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png" />
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png" />
        
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Microsoft Tile */}
        <meta name="msapplication-TileColor" content="#0a2540" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        
        {/* Theme Colors */}
        <meta name="theme-color" content="#0a2540" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Facebook Pixel - in head for immediate loading */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${FB_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
            alt=""
          />
        </noscript>

        <CountryThemeProvider initialCountry={country}>
          <AuthNavBar />
          <main>
            {children}
          </main>
          
          <footer className="bg-gray-100 border-t">
            <div className="max-w-7xl mx-auto px-4 py-8">
              {/* Main Footer Links */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Platform</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <Link href="/services" className="block hover:text-gray-800">Professional Services</Link>
                    <Link href="/login" className="block hover:text-gray-800">Login</Link>
                    <Link href="/register/select-country" className="block hover:text-gray-800">Sign Up</Link>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Business</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <Link href="/franchise" className="block hover:text-gray-800 font-medium">Franchise Opportunities</Link>
                    <a href="mailto:partnerships@portalhomehub.com" className="block hover:text-gray-800">Partnership Inquiries</a>
                    <a href="mailto:support@portalhomehub.com" className="block hover:text-gray-800">Support</a>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Countries</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <a href="https://guyanahomehub.com" className="block hover:text-gray-800">🇬🇾 Guyana</a>
                    <a href="https://jamaicahomehub.com" className="block hover:text-gray-800">🇯🇲 Jamaica</a>
                    <span className="block text-gray-400">More coming soon...</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">Contact</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <a href="tel:+5927629797" className="block hover:text-gray-800">+592-762-9797</a>
                    <a href="mailto:info@portalhomehub.com" className="block hover:text-gray-800">info@portalhomehub.com</a>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legal Links */}
            <div className="border-t border-gray-200 pt-4">
              <div className="max-w-7xl mx-auto px-4 pb-2">
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 mb-4">
                  <Link href="/terms" className="hover:text-gray-800">Terms of Use</Link>
                  <Link href="/privacy" className="hover:text-gray-800">Privacy Policy</Link>
                  <Link href="/cookies" className="hover:text-gray-800">Cookie Policy</Link>
                  <Link href="/acceptable-use" className="hover:text-gray-800">Acceptable Use</Link>
                  <Link href="/professional-services" className="hover:text-gray-800">Service Agreement</Link>
                  <span className="text-gray-400">|</span>
                  <a href="mailto:legal@portalhomehub.com" className="hover:text-gray-800">Legal</a>
                </div>
              </div>
            </div>
            
            {/* Admin access - subtle link at the very bottom */}
            <div className="border-t border-gray-200 pt-4">
              <div className="max-w-7xl mx-auto px-4 pb-4">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>© 2025 Portal Home Hub</span>
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
        </CountryThemeProvider>
      </body>
    </html>
  );
}
