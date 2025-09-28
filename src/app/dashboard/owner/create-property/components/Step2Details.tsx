interface Step2DetailsProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function Step2Details({ formData, setFormData }: Step2DetailsProps) {
  const handleChange = (field: string, value: string | string[]) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityChange = (amenity: string) => {
    const currentAmenities = formData.amenities || [];
    if (currentAmenities.includes(amenity)) {
      handleChange('amenities', currentAmenities.filter((a: string) => a !== amenity));
    } else {
      handleChange('amenities', [...currentAmenities, amenity]);
    }
  };

  const commonAmenities = [
    'Air Conditioning', 'Parking', 'Swimming Pool', 'Garden', 'Security System',
    'Furnished', 'Balcony', 'Walk-in Closet', 'Laundry Room', 'Fireplace',
    'Solar Panels', 'Generator', 'Water Tank', 'Internet/WiFi Ready', 'Gated',
    'Fruit Trees', 'Farmland', 'Backup Generator', 'Solar', 'Electric Gate'
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Property Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bedrooms *
          </label>
          <input
            type="number"
            value={formData.bedrooms}
            onChange={(e) => handleChange('bedrooms', e.target.value)}
            min="0"
            max="20"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bathrooms *
          </label>
          <input
            type="number"
            value={formData.bathrooms}
            onChange={(e) => handleChange('bathrooms', e.target.value)}
            min="0"
            max="20"
            step="0.5"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            House Size
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.house_size_value}
              onChange={(e) => handleChange('house_size_value', e.target.value)}
              placeholder="2000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
            <select
              value={formData.house_size_unit}
              onChange={(e) => handleChange('house_size_unit', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="sq ft">sq ft</option>
              <option value="sq m">sq m</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Land Size
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              value={formData.land_size_value}
              onChange={(e) => handleChange('land_size_value', e.target.value)}
              placeholder="5000"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="0"
            />
            <select
              value={formData.land_size_unit}
              onChange={(e) => handleChange('land_size_unit', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="sq ft">sq ft</option>
              <option value="sq m">sq m</option>
              <option value="acres">acres</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year Built
        </label>
        <input
          type="number"
          value={formData.year_built}
          onChange={(e) => handleChange('year_built', e.target.value)}
          min="1800"
          max={new Date().getFullYear()}
          placeholder="e.g., 2010"
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Amenities & Features
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {commonAmenities.map((amenity) => (
            <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.amenities?.includes(amenity) || false}
                onChange={() => handleAmenityChange(amenity)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{amenity}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}