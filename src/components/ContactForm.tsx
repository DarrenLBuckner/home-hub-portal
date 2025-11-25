'use client';

import { useState } from 'react';

interface ContactFormProps {
  inquiryType: 'general' | 'technical_support' | 'agent_question' | 'landlord_question' | 'partnership' | 'advertising';
  title?: string;
  subtitle?: string;
  className?: string;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  subject: string;
  message: string;
}

export default function ContactForm({ 
  inquiryType, 
  title, 
  subtitle, 
  className = '' 
}: ContactFormProps) {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    country: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          country: formData.country,
          subject: formData.subject,
          message: formData.message,
          inquiryType: inquiryType,
          source: 'portal_contact_form',
          pageUrl: window.location.href
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccess(true);
      } else {
        setError(result.error || 'Failed to submit your inquiry. Please try again.');
      }
    } catch (error) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFormTitle = () => {
    if (title) return title;
    
    const titles = {
      general: '📩 Contact Portal Home Hub',
      technical_support: '🔧 Technical Support',
      agent_question: '🏢 Agent Inquiry',
      landlord_question: '🏠 Landlord Services', 
      partnership: '🤝 Partnership Opportunities',
      advertising: '📢 Advertising & Business Listings'
    };
    return titles[inquiryType] || 'Contact Us';
  };

  const getFormSubtitle = () => {
    if (subtitle) return subtitle;
    
    const subtitles = {
      general: 'Get in touch with our team for any questions about Portal Home Hub',
      technical_support: 'Having technical issues? Our support team is here to help',
      agent_question: 'Questions about our agent tools and subscription plans?',
      landlord_question: 'Learn more about our landlord services and property management tools',
      partnership: 'Interested in bringing Portal Home Hub to your country?',
      advertising: 'Reach customers across our Caribbean markets with targeted advertising'
    };
    return subtitles[inquiryType] || 'We\'ll get back to you within 24 hours';
  };

  const getSubjectPlaceholder = () => {
    const placeholders = {
      general: 'How can we help you?',
      technical_support: 'Describe the technical issue you\'re experiencing',
      agent_question: 'Questions about agent plans or features?',
      landlord_question: 'Questions about landlord services?',
      partnership: 'Which country are you interested in?',
      advertising: 'Tell us about your advertising needs'
    };
    return placeholders[inquiryType] || 'What can we help you with?';
  };

  if (isSuccess) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-2xl font-bold text-green-800 mb-2">Message Sent Successfully!</h3>
          <p className="text-gray-600 mb-6">
            Thank you for contacting Portal Home Hub. Our team will get back to you within 24 hours.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">
              📧 Confirmation sent to {formData.email}
            </p>
            <p className="text-green-700 text-sm mt-1">
              Need immediate assistance? WhatsApp us at +592 762-9797
            </p>
          </div>
          <button
            onClick={() => {
              setIsSuccess(false);
              setFormData({
                firstName: '', lastName: '', email: '', phone: '', 
                company: '', country: '', subject: '', message: ''
              });
            }}
            className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-8 ${className}`}>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          {getFormTitle()}
        </h2>
        <p className="text-gray-600">
          {getFormSubtitle()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="John"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Smith"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="+592 XXX-XXXX"
            />
          </div>
        </div>

        {/* Business Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
              Company/Agency
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your Company Name"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Country</option>
              <option value="GY">Guyana</option>
              <option value="JM">Jamaica</option>
              <option value="TT">Trinidad & Tobago</option>
              <option value="BB">Barbados</option>
              <option value="BS">Bahamas</option>
              <option value="DO">Dominican Republic</option>
              <option value="BZ">Belize</option>
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
            Subject *
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={getSubjectPlaceholder()}
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Please provide details about your inquiry..."
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Sending...' : 'Send Message'}
        </button>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>We typically respond within 24 hours</p>
          <p className="mt-1">
            Need immediate help? WhatsApp us at{' '}
            <a 
              href="https://wa.me/5927629797" 
              className="text-green-600 hover:text-green-800 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              +592 762-9797
            </a>
          </p>
        </div>
      </form>
    </div>
  );
}