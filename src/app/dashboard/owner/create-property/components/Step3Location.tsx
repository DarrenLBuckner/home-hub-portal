import { useState, useMemo } from 'react';
import GlobalSouthLocationSelector from '@/components/GlobalSouthLocationSelector';
import { detectNeighborhoods, type GuyanaNeighborhood } from '@/lib/guyana-neighborhoods';

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

  // Neighborhood detection from title + description
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const detectedNeighborhoods = useMemo(() => {
    const text = [formData.title, formData.description].filter(Boolean).join(' ');
    return detectNeighborhoods(text);
  }, [formData.title, formData.description]);

  const topSuggestion = detectedNeighborhoods[0] || null;
  const neighborhoodIsEmpty = !formData.neighborhood?.trim();
  const showSuggestionBanner = topSuggestion && neighborhoodIsEmpty && !suggestionDismissed;

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
        <div className="text-xs bg-gray-100 p-2 rounded mt-2">
          <span className="font-semibold text-gray-800">🔒 NEVER shown publicly.</span>
          <span className="text-gray-600"> For verification only (fraud prevention, legal compliance).</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Neighborhood/Area <span className="text-red-500">*</span>
        </label>

        {/* Neighborhood detection banner */}
        {showSuggestionBanner && (
          <div className="mb-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <p className="text-sm font-semibold text-emerald-900 mb-1">
              We noticed &quot;{topSuggestion.name}&quot; in your listing
            </p>
            <p className="text-sm text-emerald-700 mb-3">
              Is this property located in {topSuggestion.name}, {topSuggestion.area}?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  handleChange('neighborhood', topSuggestion.name);
                  setSuggestionDismissed(true);
                }}
                className="px-4 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Yes, use {topSuggestion.name}
              </button>
              <button
                type="button"
                onClick={() => setSuggestionDismissed(true)}
                className="px-4 py-1.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                No, let me enter it
              </button>
            </div>
            {detectedNeighborhoods.length > 1 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="text-xs text-emerald-600">Also detected:</span>
                {detectedNeighborhoods.slice(1, 4).map(h => (
                  <button
                    key={h.name}
                    type="button"
                    onClick={() => {
                      handleChange('neighborhood', h.name);
                      setSuggestionDismissed(true);
                    }}
                    className="text-xs text-emerald-700 underline hover:text-emerald-900"
                  >
                    {h.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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

      <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
        <strong>What buyers see:</strong> Neighborhood only (unless you check "show address" above)
      </div>
    </div>
  );
}