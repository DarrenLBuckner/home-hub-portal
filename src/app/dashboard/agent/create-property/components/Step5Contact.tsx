import { useEffect, useState } from 'react';

interface Step5ContactProps {
  formData: any;
  setFormData: (data: any) => void;
  // Target user info for admin-on-behalf-of creation
  targetUserProfile?: {
    email: string;
    phone: string;
  } | null;
  isCreatingForUser?: boolean;
}

export default function Step5Contact({
  formData,
  setFormData,
  targetUserProfile,
  isCreatingForUser
}: Step5ContactProps) {
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Validate phone number format - accepts both local and international
  const validatePhone = (phone: string): string | null => {
    if (!phone || phone.trim() === '') {
      return 'WhatsApp number is required';
    }
    // Remove non-digits except leading +
    const digitsOnly = phone.replace(/[^\d]/g, '');

    // Local Guyana number (7 digits)
    if (digitsOnly.length === 7) {
      return null; // Valid local format
    }

    // International format with country code (10+ digits)
    if (digitsOnly.length >= 10) {
      return null; // Valid international format
    }

    // Too short
    if (digitsOnly.length < 7) {
      return 'Phone number seems too short';
    }

    // Between 7 and 10 - ambiguous
    return 'Enter local format (6221234) or international (+5926221234)';
  };

  // Handle phone input with validation - accepts local or international
  const handlePhoneChange = (value: string) => {
    const processedValue = value.trim();
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

  // Auto-populate with appropriate user's email/phone on mount
  // When admin creates for another user, use target user's info instead of admin's
  useEffect(() => {
    const populateContactInfo = async () => {
      try {
        // If creating for another user and we have their profile, use their info
        if (isCreatingForUser && targetUserProfile) {
          if (targetUserProfile.email && !formData.owner_email) {
            handleChange('owner_email', targetUserProfile.email);
          }
          if (targetUserProfile.phone && !formData.owner_whatsapp) {
            handleChange('owner_whatsapp', targetUserProfile.phone);
          }
          return;
        }

        // Otherwise, use the logged-in user's email (normal flow)
        const { createClient } = await import('@/supabase');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user?.email && !formData.owner_email) {
          handleChange('owner_email', user.email);
        }
      } catch (error) {
        console.warn('Could not auto-populate contact info:', error);
      }
    };

    populateContactInfo();
  }, [isCreatingForUser, targetUserProfile]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">YOUR Contact Information</h2>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-medium text-blue-900 mb-2">How Buyers Reach YOU (The Agent)</h3>
        <p className="text-sm text-blue-800">
          Interested buyers will contact <strong>you</strong> through the information provided below.
          This is YOUR contact info as the listing agent, not the property owner's.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your Email Address <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Buyers will contact YOU at this email. This is YOUR email, not the property owner's.
        </p>
        <input
          type="email"
          value={formData.owner_email}
          onChange={(e) => handleChange('owner_email', e.target.value)}
          placeholder="your@email.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your WhatsApp Number <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Buyers will message YOU on WhatsApp. This is YOUR number, not the property owner's.
        </p>
        <input
          type="tel"
          value={formData.owner_whatsapp}
          onChange={(e) => handlePhoneChange(e.target.value)}
          onBlur={handlePhoneBlur}
          placeholder="e.g., 6221234 or +5926221234"
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
            Enter local format (6221234) or international (+5926221234)
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