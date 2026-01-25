
import LotDimensions from '@/components/LotDimensions';
import { DimensionUnit } from '@/lib/lotCalculations';
import AIDescriptionAssistant from '@/components/AIDescriptionAssistant';

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

      {/* Lot Dimensions with N/A option */}
      <div>
        {!formData.land_size_na && (
          <LotDimensions
            length={formData.lot_length || ''}
            width={formData.lot_width || ''}
            unit={(formData.lot_dimension_unit as DimensionUnit) || 'ft'}
            onLengthChange={(length) => handleChange('lot_length', length)}
            onWidthChange={(width) => handleChange('lot_width', width)}
            onUnitChange={(unit) => handleChange('lot_dimension_unit', unit)}
            onAreaCalculated={(areaSqFt) => {
              // Auto-update land_size_value with calculated area (only if different)
              const newValue = areaSqFt.toString();
              if (formData.land_size_value !== newValue) {
                handleChange('land_size_value', newValue);
                handleChange('land_size_unit', 'sq ft');
              }
            }}
          />
        )}
        {formData.land_size_na && (
          <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-sm">Lot dimensions not applicable for this property type</p>
          </div>
        )}
        {/* N/A Checkbox - for apartment/unit where land size doesn't apply */}
        <label className="flex items-center gap-2 mt-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={formData.land_size_na || false}
            onChange={(e) => {
              handleChange('land_size_na', e.target.checked);
              if (e.target.checked) {
                // Clear the values when N/A is checked
                handleChange('land_size_value', '');
                handleChange('lot_length', '');
                handleChange('lot_width', '');
              }
            }}
            className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-600 group-hover:text-gray-800">
            Not applicable (e.g., apartment/unit)
          </span>
        </label>
      </div>

      {/* Helpful hint about amenities and AI */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-lg">💡</div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Pro Tip: Select amenities first!</h4>
            <p className="text-sm text-blue-800">
              The more amenities you select here, the better our AI will generate your property description in the next section. 
              Each amenity gives the AI more context to create compelling, detailed descriptions.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Amenities & Features
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {commonAmenities.map((amenity) => (
            <label key={amenity} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
              <input
                type="checkbox"
                checked={formData.amenities?.includes(amenity) || false}
                onChange={() => handleAmenityChange(amenity)}
                className="w-4 h-4 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 font-medium">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Property Description - Moved from Step 1 */}
      <div className="border-t pt-6 mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          📝 Property Description *
        </label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Write at least 30-50 words about your property... OR use the AI assistant below for professional descriptions! The more details you provide, the better the AI can help. Describe what makes this property special."
          rows={6}
          maxLength={1000}
          className="w-full px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-lg text-gray-900 placeholder-gray-400"
          required
        />
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>💡 Tip: {(formData.description || '').trim().split(/\s+/).filter((word: string) => word.length > 0).length < 30 ? `Add ${30 - (formData.description || '').trim().split(/\s+/).filter((word: string) => word.length > 0).length} more words for better AI results` : 'Great! AI can now generate excellent descriptions'}</span>
          <span className={(formData.description || '').trim().split(/\s+/).filter((word: string) => word.length > 0).length >= 30 ? 'text-green-600' : 'text-amber-600'}>{(formData.description || '').trim().split(/\s+/).filter((word: string) => word.length > 0).length} words • {(formData.description || '').length}/1000 characters</span>
        </div>
      </div>

      {/* AI Description Assistant */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <div className="mb-3 text-sm text-blue-800">
          <span className="font-medium">🤖 AI Power Boost:</span> You've selected {(formData.amenities || []).length} amenities above - this gives the AI more context to create amazing descriptions!
        </div>
        <AIDescriptionAssistant
          propertyData={{
            title: formData.title || '',
            propertyType: formData.property_type || 'House',
            bedrooms: formData.bedrooms?.toString() || '',
            bathrooms: formData.bathrooms?.toString() || '',
            price: formData.price?.toString() || '',
            location: formData.location || '',
            squareFootage: formData.house_size_value ? `${formData.house_size_value} ${formData.house_size_unit || 'sq ft'}` : '',
            features: formData.amenities || [],
            rentalType: "sale"
          }}
          currentDescription={formData.description || ''}
          onDescriptionGenerated={(description) => handleChange('description', description)}
        />
      </div>
    </div>
  );
}