'use client';

export default function AgentResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📚 Agent Resources
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to succeed as a Portal Home Hub agent
          </p>
        </div>

        {/* Professional Profile Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-blue-600 mr-3">📸</span>
            Professional Profile Setup
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Profile Photo Requirements</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  High-quality professional headshot
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Minimum 400x400 pixels
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Professional business attire
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Clear, well-lit face shot
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  No casual photos or selfies
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Bio & Specialties</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Highlight your real estate experience
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Mention your areas of expertise
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Include your service areas
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Keep it professional and concise
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Creating Listings Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-green-600 mr-3">🏠</span>
            Creating Property Listings
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Photo Guidelines</h3>
              <div className="space-y-3">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Best Formats:</h4>
                  <p className="text-blue-700 text-sm">JPEG, PNG • Max 5MB per photo</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Photo Tips:</h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>• Take photos during daylight hours</li>
                    <li>• Show multiple angles of each room</li>
                    <li>• Include exterior and interior shots</li>
                    <li>• Highlight unique features</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Writing Descriptions</h3>
              <div className="space-y-3">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">AI Description Tool:</h4>
                  <p className="text-purple-700 text-sm">Use our built-in AI to generate compelling property descriptions automatically</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-medium text-orange-900 mb-2">Manual Writing Tips:</h4>
                  <ul className="text-orange-700 text-sm space-y-1">
                    <li>• Start with the best features</li>
                    <li>• Include square footage and room counts</li>
                    <li>• Mention nearby amenities</li>
                    <li>• Use descriptive but honest language</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Marketing Materials Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-purple-600 mr-3">📋</span>
            Marketing Materials
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📄</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Business Cards</h3>
              <p className="text-gray-600 text-sm">Include Portal Home Hub branding and your contact info</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Company Info</h3>
              <p className="text-gray-600 text-sm">Prepare your agency details and certifications</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Digital Assets</h3>
              <p className="text-gray-600 text-sm">Logo files and social media graphics</p>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-pink-600 mr-3">📱</span>
            Social Media Guidelines
          </h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Follow Your Home Country Pages</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Examples:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>🇬🇾 Guyana Home Hub</li>
                  <li>🇹🇹 Trinidad Home Hub</li>
                  <li>🇯🇲 Jamaica Home Hub</li>
                  <li>🇧🇧 Barbados Home Hub</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Benefits:</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Stay updated on market trends</li>
                  <li>• Share relevant content</li>
                  <li>• Connect with local network</li>
                  <li>• Access promotional materials</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
          <p className="text-lg mb-6">
            Our support team is here to help you succeed
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:agents@portalhomehub.com" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              📧 Email Support
            </a>
            <a 
              href="https://portalhomehub.com" 
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-800 transition-colors border border-blue-400"
            >
              🌐 Visit Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}