'use client';

// Property types with enabled/disabled status for FSBO owners
const FSBO_PROPERTY_TYPES = [
  { value: 'Single Family Home', label: 'House', icon: '🏠', enabled: true },
  { value: 'Duplex', label: 'Duplex', icon: '🏘️', enabled: true },
  { value: 'Apartment', label: 'Apartment', icon: '🏢', enabled: true },
  { value: 'Townhouse', label: 'Townhouse', icon: '🏠', enabled: true },
  { value: 'Condo', label: 'Condo', icon: '🏠', enabled: true },
  { value: 'Villa', label: 'Villa', icon: '🏡', enabled: true },
  { value: 'Bungalow', label: 'Bungalow', icon: '🏡', enabled: true },
  // Disabled - Agent Only
  { value: 'Residential Land', label: 'Land', icon: '🌿', enabled: false },
  { value: 'Residential Farmland', label: 'Farmland', icon: '🌾', enabled: false },
  { value: 'Commercial', label: 'Commercial', icon: '🏢', enabled: false },
];

interface Step1BasicInfoProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function Step1BasicInfo({ formData, setFormData }: Step1BasicInfoProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Get currency information from formData (set in Step3)
  const getCurrencySymbol = (currency: string) => {
    const currencyMap: Record<string, string> = {
      'GYD': 'GY$',
      'TTD': 'TT$',
      'JMD': 'J$',
      'BBD': 'Bds$',
      'GHS': 'GH₵',
      'NGN': '₦',
      'KES': 'KSh'
    };
    return currencyMap[currency] || 'GY$';
  };

  const currencyCode = formData.currency || 'GYD';
  const currencySymbol = getCurrencySymbol(currencyCode);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">📋 Basic Information</h2>

      <div>
        <label className="block text-base font-bold text-gray-900 mb-3">
          Property Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Beautiful 3-bedroom family home in Georgetown"
          className="w-full px-4 py-3 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 bg-white placeholder-gray-600 text-base"
          maxLength={100}
        />
        <p className="text-sm text-gray-500 mt-1">{formData.title.length}/100 characters</p>
      </div>

      <div>
        <label className="block text-base font-bold text-gray-900 mb-3">
          Property Type *
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {FSBO_PROPERTY_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => type.enabled && handleChange('property_type', type.value)}
              disabled={!type.enabled}
              className={`p-3 rounded-lg border-2 text-center transition-all relative ${
                !type.enabled
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : formData.property_type === type.value
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">{type.icon}</div>
              <div className={`text-xs font-medium truncate ${
                !type.enabled ? 'text-gray-400' : 'text-gray-700'
              }`}>
                {type.label}
              </div>
              {!type.enabled && (
                <div className="absolute -top-1 -right-1 bg-gray-400 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <span>🔒</span>
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Agent CTA */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            <span className="font-medium">🔒 Selling land, farmland, or commercial property?</span>
            <br />
            These property types require a licensed real estate agent.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            📞 Contact us for agent referral
            <span>→</span>
          </a>
        </div>
      </div>

      <div>
        <label className="block text-base font-bold text-gray-900 mb-3">
          💰 Asking Price ({currencySymbol}) *
        </label>
        <input
          type="text"
          inputMode="numeric"
          value={formData.price}
          onChange={(e) => {
            // Only allow numbers and remove any non-digit characters except for temporary input
            const value = e.target.value.replace(/[^0-9]/g, '');
            handleChange('price', value);
          }}
          placeholder="e.g., 25000000"
          className="w-full px-4 py-3 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 bg-white placeholder-gray-600 text-base"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.price && !isNaN(Number(formData.price)) && Number(formData.price) > 0
            ? `${Number(formData.price).toLocaleString()} ${currencyCode}`
            : `Enter the asking price for your property${formData.currency ? ` in ${currencyCode}` : ''}`
          }
        </p>
        {!formData.currency && (
          <p className="text-sm text-blue-600 mt-1">
            💡 Select your country in Step 3 to see the appropriate currency
          </p>
        )}
      </div>

      {/* Description moved to Step 2 after amenities for better UX flow */}
      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <div className="text-green-500 text-lg">📋</div>
          <div>
            <h4 className="font-medium text-green-900 mb-1">What's Next?</h4>
            <p className="text-sm text-green-800">
              After you provide the basic info above, you'll add property details and select amenities. 
              Then our AI can help create an amazing description using all the information you've provided!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}