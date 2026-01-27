import { useEffect, useState } from 'react';

interface Step5ContactProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function Step5Contact({ formData, setFormData }: Step5ContactProps) {
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate phone number format
  const validatePhone = (phone: string): string | null => {
    if (!phone || phone.trim() === '') {
      return 'WhatsApp number is required';
    }
    if (!phone.startsWith('+')) {
      return 'Phone number must start with + and country code (e.g., +592)';
    }
    // Remove non-digits except leading +
    const digitsOnly = phone.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
    if (digitsOnly.length < 8) {
      return 'Phone number seems too short. Include country code + full number';
    }
    return null;
  };

  // Handle phone input with auto-prefix and validation
  const handlePhoneChange = (value: string) => {
    let processedValue = value.trim();

    // Auto-add '+' if user starts typing digits (likely country code)
    // Only auto-add if they've typed at least 3 digits and forgot the +
    if (processedValue && !processedValue.startsWith('+')) {
      const digitsOnly = processedValue.replace(/\D/g, '');
      // Common country codes: 592 (Guyana), 1 (USA/Canada), etc.
      if (digitsOnly.length >= 3 && /^[1-9]/.test(digitsOnly)) {
        processedValue = '+' + processedValue;
      }
    }

    handleChange('owner_whatsapp', processedValue);

    // Validate on change if field was touched
    if (phoneTouched) {
      setPhoneError(validatePhone(processedValue));
    }
  };

  // Validate on blur (when leaving the field)
  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    setPhoneError(validatePhone(formData.owner_whatsapp || ''));
  };

  // Auto-populate with user's email on mount (optional)
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const { createClient } = await import('@/supabase');
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
          WhatsApp Number <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={formData.owner_whatsapp}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onBlur={handlePhoneBlur}
          placeholder="+592 123 4567"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            phoneError && phoneTouched ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          required
        />
        {phoneError && phoneTouched ? (
          <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
            <span>⚠️</span> {phoneError}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">
            <strong>Format:</strong> +592XXXXXXX (e.g., +5926227446)
          </p>
        )}
        <div className="bg-green-50 p-3 rounded mt-2">
          <p className="text-sm text-green-800">
            <strong>💬 Why WhatsApp?</strong> 90% of property inquiries in Guyana happen via WhatsApp. This ensures you get contacted quickly by serious buyers.
          </p>
        </div>
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