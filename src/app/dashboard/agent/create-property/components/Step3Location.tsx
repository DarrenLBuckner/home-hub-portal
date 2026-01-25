import { useState, useEffect } from 'react';
import GlobalSouthLocationSelector from '@/components/GlobalSouthLocationSelector';

interface Step3LocationProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function Step3Location({ formData, setFormData }: Step3LocationProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>(formData.country || "GY");
  const [selectedRegion, setSelectedRegion] = useState<string>(formData.region || "");
  const [currencyCode, setCurrencyCode] = useState<string>(formData.currency || "GYD");
  const [currencySymbol, setCurrencySymbol] = useState<string>("GY$");

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field: 'country' | 'region', value: string, displayName?: string) => {
    if (field === 'country') {
      setSelectedCountry(value);
      setSelectedRegion('');
      setFormData((prev: any) => ({
        ...prev,
        country: value,
        region: '',
        city: '', // Clear city when country changes
        currency: currencyCode
      }));
    } else {
      setSelectedRegion(value);
      setFormData((prev: any) => ({
        ...prev,
        region: value,
        city: displayName || value // Use display name for city (e.g., "Georgetown" not "GY-R4-Georgetown")
      }));
    }
  };

  const handleCurrencyChange = (code: string, symbol: string) => {
    setCurrencyCode(code);
    setCurrencySymbol(symbol);
    setFormData((prev: any) => ({
      ...prev,
      currency: code
    }));
  };

  // Check if owner info is provided for protection checkbox logic
  const hasOwnerInfo = !!(formData.property_owner_whatsapp?.trim() || formData.property_owner_email?.trim());

  // Auto-enable protection when owner info is first entered
  useEffect(() => {
    if (hasOwnerInfo && formData.listing_protection === false) {
      // Only auto-check if user hasn't explicitly unchecked it
      handleChange('listing_protection', true);
    }
  }, [hasOwnerInfo]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Property Location</h2>
      
      <GlobalSouthLocationSelector
        selectedCountry={selectedCountry}
        selectedRegion={selectedRegion}
        onLocationChange={handleLocationChange}
        onCurrencyChange={handleCurrencyChange}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Address <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.address || ''}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Full property address"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border-l-4 border-blue-400 mt-2">
          <span className="font-medium text-blue-800">🔒 Privacy Protected:</span> Address is required for property verification only. It will never be shown to buyers until you approve them.
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Neighborhood/Area <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.neighborhood || ''}
          onChange={(e) => handleChange('neighborhood', e.target.value)}
          placeholder="e.g., Lamaha Gardens, Kitty, Bel Air Park, Eccles"
          required
          minLength={2}
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          Enter the neighborhood or area name that locals would recognize. This will be shown publicly on your listing.
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <input
          type="checkbox"
          id="show_address"
          checked={formData.show_address || false}
          onChange={(e) => handleChange('show_address', e.target.checked)}
          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <div>
          <label htmlFor="show_address" className="block text-sm font-medium text-gray-700 cursor-pointer">
            Show street address publicly on listing
          </label>
          <p className="text-xs text-gray-500 mt-1">
            If unchecked, only the neighborhood will display. Buyers will see "Contact agent for exact address"
          </p>
        </div>
      </div>

      {/* Owner Information - Duplicate Protection */}
      <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">🛡️</span>
          <h3 className="text-lg font-semibold text-gray-900">STOP COPYCATS</h3>
        </div>

        <p className="text-gray-700 mb-4">
          We check every new listing to see if the property is already posted.
          If another agent tries to list the same owner's property, we catch it
          and protect yours.
        </p>

        <div className="space-y-4">
          {/* Owner WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner WhatsApp <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="tel"
              value={formData.property_owner_whatsapp || ''}
              onChange={(e) => handleChange('property_owner_whatsapp', e.target.value)}
              placeholder="+592 XXX XXXX"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Owner Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Owner Email <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="email"
              value={formData.property_owner_email || ''}
              onChange={(e) => handleChange('property_owner_email', e.target.value)}
              placeholder="owner@email.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Protection Checkbox */}
          <div className="flex items-start gap-3 mt-4">
            <input
              type="checkbox"
              id="listing_protection"
              disabled={!hasOwnerInfo}
              checked={hasOwnerInfo && (formData.listing_protection ?? true)}
              onChange={(e) => handleChange('listing_protection', e.target.checked)}
              className={`mt-1 h-5 w-5 border-gray-300 rounded focus:ring-blue-500 ${
                hasOwnerInfo
                  ? 'text-blue-600 cursor-pointer'
                  : 'text-gray-300 cursor-not-allowed bg-gray-100'
              }`}
            />
            <div>
              <label
                htmlFor="listing_protection"
                className={`text-sm ${hasOwnerInfo ? 'text-gray-700' : 'text-gray-400'}`}
              >
                <span className="font-medium">Protect this listing</span> - Block copycats automatically
              </label>
              <p className={`text-xs mt-1 ${hasOwnerInfo ? 'text-green-600' : 'text-gray-400'}`}>
                {hasOwnerInfo
                  ? '✓ Your listing will be protected from copycats'
                  : 'Enter owner contact info above to enable protection'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
          <span>🔒</span>
          <p>
            100% Private. We only use this to match against other listings.
            Never shared. Never public. See our{' '}
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
            for details.
          </p>
        </div>
      </div>

      {/* Regional Information */}
      {selectedCountry && selectedRegion && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">
            📍 {selectedRegion}
          </h3>
          <p className="text-sm text-green-800">
            Selected region in {selectedCountry === 'GY' ? 'Guyana' : 
                              selectedCountry === 'TT' ? 'Trinidad and Tobago' :
                              selectedCountry === 'JM' ? 'Jamaica' :
                              selectedCountry === 'BB' ? 'Barbados' :
                              selectedCountry === 'GH' ? 'Ghana' :
                              selectedCountry === 'NG' ? 'Nigeria' :
                              selectedCountry === 'KE' ? 'Kenya' : selectedCountry}. 
            Currency: {currencySymbol}
          </p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Location Display & Privacy</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Neighborhood</strong> is always shown publicly on your listing</li>
          <li>• <strong>Street address</strong> is only shown if you enable the checkbox above</li>
          <li>• If address is hidden, buyers see "Contact agent for exact address"</li>
          <li>• Full address is always stored securely for verification purposes</li>
        </ul>
      </div>
    </div>
  );
}