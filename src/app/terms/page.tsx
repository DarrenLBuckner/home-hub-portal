import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Use - Portal Home Hub',
  description: 'Terms of Use for Portal Home Hub property management platform and services.',
};

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PORTAL HOME HUB</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">TERMS OF USE</h2>
          <p className="text-gray-600 mb-8">Last Updated: November 6, 2025</p>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              Welcome to Portal Home Hub. By accessing or using our Services (as defined below), you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our Services.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">1. DEFINITIONS AND SCOPE OF SERVICES</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">1.1 Definitions</h4>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
              <li><strong>"Services"</strong> means the Portal Home Hub platform, all associated websites, mobile applications, software, and services provided by Portal Home Hub, Inc.</li>
              <li><strong>"We," "Us," or "Our"</strong> refers to Portal Home Hub, Inc., a United States company.</li>
              <li><strong>"User," "You," or "Your"</strong> refers to any individual or entity accessing or using the Services.</li>
              <li><strong>"Property Professional"</strong> means real estate agents, brokers, landlords, property managers, or other individuals acting in a professional capacity.</li>
              <li><strong>"User Content"</strong> means any information, data, text, photos, videos, or other materials uploaded or submitted by Users through the Services.</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">1.2 Nature of Services</h4>
            <p className="text-gray-700 mb-6">
              Portal Home Hub operates a multi-tenant software platform that enables property listings, searches, and connections between property seekers and Property Professionals across multiple markets. We provide technology infrastructure but are not a real estate broker, agent, landlord, property manager, or financial advisor.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">2. ELIGIBILITY AND ACCOUNT REGISTRATION</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">2.1 Eligibility Requirements</h4>
            <p className="text-gray-700 mb-4">
              You must be at least 18 years of age to use the Services. By using the Services, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms of Use.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">2.2 Account Registration</h4>
            <p className="text-gray-700 mb-4">
              To access certain features of the Services, you may be required to create an account. You agree to provide accurate, current, and complete information during registration and to keep this information up to date. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">2.3 Account Security</h4>
            <p className="text-gray-700 mb-6">
              You may not share your account with others or allow others to access your account. If you become aware of any unauthorized use of your account, you must notify us immediately.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">3. USER RESPONSIBILITIES AND ACCEPTABLE USE</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">3.1 General Conduct</h4>
            <p className="text-gray-700 mb-3">
              You agree to use the Services only for lawful purposes and in accordance with these Terms of Use. You agree not to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Violate any applicable local, state, national, or international law or regulation</li>
              <li>Engage in any discriminatory practices prohibited by fair housing or anti-discrimination laws</li>
              <li>Upload, post, or transmit any content that is fraudulent, misleading, false, or inaccurate</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
              <li>Interfere with or disrupt the Services or servers or networks connected to the Services</li>
              <li>Attempt to gain unauthorized access to any portion of the Services, other user accounts, or systems</li>
              <li>Use any automated means (including bots, scrapers, or crawlers) to access the Services without our prior written consent</li>
              <li>Upload viruses, malware, or any other malicious code</li>
              <li>Collect or harvest personal information about other Users without their consent</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">3.2 Property Professional Responsibilities</h4>
            <p className="text-gray-700 mb-3">
              If you are a Property Professional using the Services, you additionally agree to:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>Maintain all required licenses and certifications in your jurisdiction</li>
              <li>Comply with all applicable real estate laws and regulations</li>
              <li>Provide accurate and truthful information about properties</li>
              <li>Obtain necessary permissions and rights to list properties on the Services</li>
              <li>Respond promptly to inquiries from potential clients</li>
            </ul>

            {/* Contact Section - moved to end for better flow */}
            <div className="bg-gray-100 p-6 rounded-lg mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">CONTACT INFORMATION</h3>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Use, please contact us at:
              </p>
              <div className="space-y-2">
                <p className="text-gray-800 font-semibold">Portal Home Hub, Inc.</p>
                <p className="text-gray-700">Email: legal@portalhomehub.com</p>
                <p className="text-gray-700">Website: www.portalhomehub.com</p>
              </div>

              <div className="mt-6 space-y-3">
                <a 
                  href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20I%20have%20a%20question%20about%20your%20terms%20of%20use." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <span className="mr-2">💬</span>
                  WhatsApp Support
                </a>
                <p className="text-sm text-gray-600">
                  Preferred method for fastest response • +592 762-9797
                </p>
              </div>
            </div>

            <hr className="my-8" />

            <p className="text-center text-gray-600 font-medium">
              By using Portal Home Hub, you acknowledge that you have read, understood, and agree to be bound by these Terms of Use.
            </p>
            
            <div className="text-center text-xs text-gray-500 mt-4">
              © 2025 Portal Home Hub, Inc. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
