import { useEffect } from 'react';

interface Step5ContactProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function Step5Contact({ formData, setFormData }: Step5ContactProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Auto-populate with user's email on mount (optional)
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email && !formData.owner_email) {
          handleChange('owner_email', user.email);
        }
      } catch (error) {
        console.warn('Could not auto-populate email:', error);
      }
    };
    
    getUserEmail();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-blue-900 mb-2">How buyers will contact you</h3>
        <p className="text-sm text-blue-800">
          Interested buyers will be able to contact you through the information provided below. 
          Your contact details will only be shown to serious inquiries.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          value={formData.owner_email}
          onChange={(e) => handleChange('owner_email', e.target.value)}
          placeholder="your@email.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          We'll use this email for notifications and buyer inquiries
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          WhatsApp Number (Optional)
        </label>
        <input
          type="tel"
          value={formData.owner_whatsapp}
          onChange={(e) => handleChange('owner_whatsapp', e.target.value)}
          placeholder="592-xxx-xxxx"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          Include country code (e.g., +592 for Guyana). WhatsApp is popular for quick communication.
        </p>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="font-medium text-yellow-900 mb-2">Privacy & Security</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Your contact information is never shared with third parties</li>
          <li>• We screen inquiries to reduce spam and time-wasters</li>
          <li>• You control who gets your contact details</li>
          <li>• You can update this information anytime in your dashboard</li>
        </ul>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Response Tips</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Respond to inquiries promptly (within 24 hours if possible)</li>
          <li>• Be professional and courteous in all communications</li>
          <li>• Have key property details ready (utilities, taxes, etc.)</li>
          <li>• Consider scheduling viewings during daylight hours</li>
        </ul>
      </div>
    </div>
  );
}