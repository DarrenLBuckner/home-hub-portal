interface Step3LocationProps {
  formData: any;
  setFormData: (data: any) => void;
}

export default function Step3Location({ formData, setFormData }: Step3LocationProps) {
  const handleChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  // Complete list of Guyana's 10 Administrative Regions with their major areas
  const guyanaRegionsData = {
    'Region 1 - Barima-Waini': [
      'Mabaruma', 'Port Kaituma', 'Matthew\'s Ridge', 'Moruca', 'Koriabo'
    ],
    'Region 2 - Pomeroon-Supenaam': [
      'Anna Regina', 'Charity', 'Adventure', 'Supenaam', 'Spring Garden'
    ],
    'Region 3 - Essequibo Islands-West Demerara': [
      'Vreed-en-Hoop', 'Parika', 'Wales', 'Uitvlugt', 'Leonora', 'Best', 'Versailles'
    ],
    'Region 4 - Demerara-Mahaica': [
      'Georgetown', 'Diamond', 'Grove', 'Timehri', 'Soesdyke', 'Mahaica', 'Bagotstown',
      'Campbellville', 'Kitty', 'Alberttown', 'Newtown', 'Queenstown', 'Stabroek',
      'Bel Air', 'Ruimveldt', 'South Georgetown', 'East Georgetown', 'North Georgetown',
      'Cummings Lodge', 'Turkeyen', 'Sophia', 'Better Hope', 'Enmore'
    ],
    'Region 5 - Mahaica-Berbice': [
      'Mahaicony', 'Fort Wellington', 'Onverwagt', 'Blairmont', 'Bath Settlement'
    ],
    'Region 6 - East Berbice-Corentyne': [
      'New Amsterdam', 'Rose Hall', 'Corriverton', 'Skeldon', 'Springlands',
      'Port Mourant', 'Albion', 'Nigg', 'Canje', 'Number 19 Village'
    ],
    'Region 7 - Cuyuni-Mazaruni': [
      'Bartica', 'Mazaruni', 'Issano', 'Kartabo', 'Monkey Mountain'
    ],
    'Region 8 - Potaro-Siparuni': [
      'Mahdia', 'Tumatumari', 'Kangaruma', 'Paramakatoi'
    ],
    'Region 9 - Upper Takutu-Upper Essequibo': [
      'Lethem', 'Annai', 'Sand Creek', 'Karasabai', 'Aishalton'
    ],
    'Region 10 - Upper Demerara-Berbice': [
      'Linden', 'Ituni', 'Kwakwani', 'Rockstone', 'Berbice River'
    ]
  };

  const selectedRegionAreas = formData.region ? guyanaRegionsData[formData.region] || [] : [];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold mb-4">Property Location</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Administrative Region *
        </label>
        <select
          value={formData.region}
          onChange={(e) => {
            handleChange('region', e.target.value);
            // Clear city when region changes
            handleChange('city', '');
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a region</option>
          {Object.keys(guyanaRegionsData).map((region) => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-1">
          Select your administrative region (all 10 regions of Guyana)
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          City/Town/Area *
        </label>
        {formData.region ? (
          <select
            value={formData.city}
            onChange={(e) => handleChange('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select city/town/area</option>
            {selectedRegionAreas.map((area) => (
              <option key={area} value={area}>{area}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            disabled
            placeholder="Please select a region first"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
          />
        )}
        <p className="text-sm text-gray-500 mt-1">
          {formData.region ? 'Select from major areas in your region' : 'Choose a region to see available areas'}
        </p>
      </div>

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
      {formData.region && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">
            📍 {formData.region}
          </h3>
          <p className="text-sm text-green-800">
            {selectedRegionAreas.length} major areas available in this region. 
            {formData.region.includes('Region 4') && ' This includes the capital Georgetown and surrounding areas.'}
            {formData.region.includes('Region 6') && ' This includes New Amsterdam and the Corentyne coast.'}
            {formData.region.includes('Region 10') && ' This includes Linden and the Upper Demerara area.'}
          </p>
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">Location & Privacy</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your exact address will not be shown publicly</li>
          <li>• Only the region and general area will be displayed to buyers</li>
          <li>• Specific location details shared only with approved inquiries</li>
          <li>• All 10 administrative regions of Guyana are supported</li>
        </ul>
      </div>
    </div>
  );
}