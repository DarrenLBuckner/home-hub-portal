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

  const handleChange = (field: string, value: string) => {
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
        currency: currencyCode
      }));
    } else {
      setSelectedRegion(value);
      setFormData((prev: any) => ({
        ...prev,
        region: value
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
        required={true}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specific Neighborhood/Street (Optional)
        </label>
        <input
          type="text"
          value={formData.neighborhood}
          onChange={(e) => handleChange('neighborhood', e.target.value)}
          placeholder="e.g., Sheriff Street, Main Street, Housing Scheme Block A"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          Optional: Add specific street, housing scheme, or neighborhood details
        </p>
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
        <h3 className="font-medium text-blue-900 mb-2">Global South Coverage & Privacy</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your exact address will not be shown publicly</li>
          <li>• Only the region and general area will be displayed to buyers</li>
          <li>• Specific location details shared only with approved inquiries</li>
          <li>• Serving 7 Global South countries: Caribbean & Africa markets</li>
          <li>• Automatic currency adaptation for your selected country</li>
        </ul>
      </div>
    </div>
  );
}