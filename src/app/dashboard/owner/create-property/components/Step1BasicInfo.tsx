

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
          <option value="">Select Property Type</option>
          <option value="Single Family Home">🏠 Single Family Home</option>
          <option value="Duplex">🏘️ Duplex</option>
          <option value="Apartment">🏢 Apartment/Flat</option>
          <option value="Residential Land">🌿 Residential Land/Lot</option>
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