import { useState } from 'react';
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

  const handleLocationChange = (field: 'country' | 'region', value: string) => {
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
        city: value // Set city to the same value as region for validation
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