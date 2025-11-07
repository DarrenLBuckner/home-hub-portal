import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Franchise Opportunities - Portal Home Hub',
  description: 'Partner with Portal Home Hub to bring professional real estate services to your country. Proven platform, complete support, scalable technology.',
};

export default function FranchisePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="text-6xl mb-6">🌍</div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Expand Portal Home Hub
            <span className="block text-blue-400">to Your Country</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Ready to bring professional real estate services to your market? 
            Partner with us to launch your own Portal Home Hub franchise.
          </p>
        </div>

        {/* Key Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-3">Proven Platform</h3>
            <p className="text-slate-300">
              Already operating successfully in Guyana & Jamaica with growing user base and proven revenue model.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-white mb-3">White-Label Solution</h3>
            <p className="text-slate-300">
              Complete customization for your country including currency, language, local features, and branding.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-white mb-3">Business Support</h3>
            <p className="text-slate-300">
              Marketing guidance, business development support, and ongoing technical assistance.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-white mb-3">Fast Launch</h3>
            <p className="text-slate-300">
              Multi-country platform architecture allows rapid deployment - launch in weeks, not months.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-bold text-white mb-3">Scalable Technology</h3>
            <p className="text-slate-300">
              Built on modern, scalable infrastructure that grows with your market and handles increasing demand.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-xl font-bold text-white mb-3">Revenue Streams</h3>
            <p className="text-slate-300">
              Multiple income sources: professional services, platform fees, premium listings, and more.
            </p>
          </div>
        </div>

        {/* What's Included */}
        <div className="bg-slate-800/30 backdrop-blur rounded-lg p-8 mb-16 border border-slate-700">
          <h2 className="text-3xl font-bold text-white mb-6 text-center">What's Included</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-4">Platform & Technology</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Complete property listing platform</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Professional services marketplace</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> User management & authentication</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Payment processing integration</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Mobile-responsive design</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Admin dashboard & analytics</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-400 mb-4">Support & Training</h3>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Initial setup & configuration</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Marketing materials & strategies</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Business development guidance</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Ongoing technical support</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Regular platform updates</li>
                <li className="flex items-center"><span className="text-green-400 mr-2">✓</span> Partnership community access</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Target Countries */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Priority Markets</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            We're particularly interested in partners for these high-potential markets:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              '🇹🇹 Trinidad & Tobago',
              '🇧🇧 Barbados', 
              '🇱🇨 Saint Lucia',
              '🇬🇩 Grenada',
              '🇰🇳 St. Kitts & Nevis',
              '🇦🇬 Antigua & Barbuda',
              '🇩🇲 Dominica',
              '🇻🇨 St. Vincent'
            ].map((country, index) => (
              <div key={index} className="bg-slate-800/50 rounded-lg p-3 text-white text-sm">
                {country}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Let's discuss how we can bring Portal Home Hub to your market. 
            We're looking for ambitious partners who understand their local real estate landscape.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <a 
              href="mailto:partnerships@portalhomehub.com?subject=Franchise Opportunity Inquiry"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors inline-flex items-center"
            >
              📧 partnerships@portalhomehub.com
            </a>
            
            <Link
              href="/register/select-country"
              className="bg-blue-800 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-900 transition-colors"
            >
              Start Your Application
            </Link>
          </div>
          
          <p className="text-blue-200 text-sm mt-4">
            Include your country/region of interest and brief background in your inquiry
          </p>
        </div>
      </div>
    </div>
  );
}