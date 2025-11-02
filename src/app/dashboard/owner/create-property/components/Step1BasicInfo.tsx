

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
        <select
          value={formData.property_type}
          onChange={(e) => handleChange('property_type', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 bg-white text-base"
        >
          <optgroup label="🏘️ Residential Properties">
            <option value="Single Family Home">Single Family Home</option>
            <option value="Duplex">Duplex (Two-Family Home)</option>
            <option value="Triplex">Triplex (Three-Family Home)</option>
            <option value="Multi-Family Home">Multi-Family Home (4+ units)</option>
            <option value="Apartment">Apartment/Flat</option>
            <option value="Condominium">Condominium</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Villa">Villa</option>
            <option value="Bungalow">Bungalow</option>
            <option value="Cottage">Cottage</option>
          </optgroup>
          
          <optgroup label="🌾 Agricultural & Farmland">
            <option value="Rice Farm">Rice Farm/Paddy Land</option>
            <option value="Sugar Estate">Sugar Estate/Plantation</option>
            <option value="Cattle Ranch">Cattle Ranch/Pasture Land</option>
            <option value="Poultry Farm">Poultry Farm</option>
            <option value="Fruit Orchard">Fruit Orchard/Grove</option>
            <option value="Vegetable Farm">Vegetable Farm/Market Garden</option>
            <option value="Fish Farm">Fish Farm/Aquaculture</option>
            <option value="Mixed Farming">Mixed Farming Operation</option>
            <option value="Agricultural Land">General Agricultural Land</option>
            <option value="Farmland with House">Farmland with Residence</option>
          </optgroup>
          
          <optgroup label="🏗️ Land & Development">
            <option value="Residential Land">Residential Land/Lot</option>
            <option value="Commercial Land">Commercial Land</option>
            <option value="Industrial Land">Industrial Land</option>
            <option value="Mixed-Use Land">Mixed-Use Development Land</option>
            <option value="Waterfront Land">Waterfront/Coastal Land</option>
          </optgroup>
          
          <optgroup label="🏢 Commercial Properties">
            <option value="Office Building">Office Building</option>
            <option value="Retail Space">Retail/Shop Space</option>
            <option value="Restaurant">Restaurant/Food Service</option>
            <option value="Warehouse">Warehouse/Storage</option>
            <option value="Industrial Building">Industrial Building</option>
            <option value="Mixed-Use Building">Mixed-Use Building</option>
            <option value="Hotel/Guesthouse">Hotel/Guesthouse</option>
          </optgroup>
          
          <optgroup label="🏖️ Special Properties">
            <option value="Waterfront Property">Waterfront Property</option>
            <option value="Vacation Home">Vacation/Holiday Home</option>
            <option value="Investment Property">Investment Property</option>
            <option value="Fixer-Upper">Fixer-Upper/Renovation Project</option>
          </optgroup>
        </select>
        <p className="text-sm text-gray-500 mt-1">
          Choose the category that best describes your property
        </p>
      </div>

      <div>
        <label className="block text-base font-bold text-gray-900 mb-3">
          💰 Asking Price ({currencySymbol}) *
        </label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          placeholder="e.g., 25000000"
          className="w-full px-4 py-3 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 bg-white placeholder-gray-600 text-base"
          min="0"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.price && !isNaN(Number(formData.price)) 
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