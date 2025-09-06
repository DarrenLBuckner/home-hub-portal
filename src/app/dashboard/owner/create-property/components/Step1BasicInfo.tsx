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

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Title *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          placeholder="e.g., Beautiful 3-bedroom family home in Georgetown"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={100}
        />
        <p className="text-sm text-gray-500 mt-1">{formData.title.length}/100 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Type *
        </label>
        <select
          value={formData.property_type}
          onChange={(e) => handleChange('property_type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Asking Price (GYD) *
        </label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => handleChange('price', e.target.value)}
          placeholder="e.g., 25000000"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          min="0"
        />
        <p className="text-sm text-gray-500 mt-1">
          {formData.price && !isNaN(Number(formData.price)) 
            ? `${Number(formData.price).toLocaleString()} GYD`
            : 'Enter the asking price for your property'
          }
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe your property's features, condition, and what makes it special..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={1000}
        />
        <p className="text-sm text-gray-500 mt-1">{formData.description.length}/1000 characters</p>
      </div>
    </div>
  );
}