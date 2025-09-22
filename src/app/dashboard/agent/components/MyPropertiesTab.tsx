import React, { useState } from 'react';
import PropertyList from './PropertyList';
import { createClient } from '@/supabase';

// This will be updated to work with selected property context in the future

const allFeatures = [
  'Swimming Pool', 'Garage', 'Garden', 'Air Conditioning', 'Security System', 'Solar Panels', 'Furnished', 'Pet Friendly', 'Gated Community', 'Fenced Yard', 'Fruit Trees', 'Paved Roads', 'Washer & Dryer', 'Kitchen Appliances', 'Backup Generator', 'Electric Gate'
];

export default function MyPropertiesTab({ userId }: { userId: string }) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

  // Toggle feature selection - only works if a property is selected
  const handleFeatureClick = async (feature: string) => {
    if (!selectedProperty) {
      alert('Please select a property first to manage features');
      return;
    }
    
    let updated;
    if (selectedFeatures.includes(feature)) {
      updated = selectedFeatures.filter(f => f !== feature);
    } else {
      updated = [...selectedFeatures, feature];
    }
    setSelectedFeatures(updated);
    setSaving(true);
    // Save to Supabase
    const supabase = createClient();
    await supabase
      .from('properties')
      .update({ features: updated })
      .eq('id', selectedProperty)
      .eq('user_id', userId); // Security check - agent can only update their own properties
    setSaving(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Properties</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Create Property</button>
      </div>
      
      <PropertyList userId={userId} />
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Property Management Tools</h3>
        
        {!selectedProperty ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">📋</div>
            <h4 className="text-lg font-semibold text-blue-800 mb-2">Select a Property</h4>
            <p className="text-blue-600 text-sm">
              Choose a property from your list above to manage its features and description.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg border p-6 mb-6">
              <h4 className="text-md font-semibold mb-4">Property Features</h4>
              <div className="flex flex-wrap gap-3 mb-4">
                {allFeatures.map((feature) => (
                  <button
                    key={feature}
                    className={`px-4 py-2 rounded-full border border-gray-300 bg-white hover:bg-green-50 text-gray-700 ${selectedFeatures.includes(feature) ? 'bg-green-100 text-green-700 border-green-400' : ''}`}
                    onClick={() => handleFeatureClick(feature)}
                    disabled={saving}
                  >
                    {feature}
                  </button>
                ))}
              </div>
              {saving && <p className="text-sm text-gray-500">Saving features...</p>}
            </div>

            <div className="bg-white rounded-lg border p-6">
              <h4 className="text-md font-semibold mb-4">Property Description</h4>
              <textarea
                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 mb-4"
                placeholder="Write a detailed description of the property..."
                // TODO: Add state and AI integration for selected property
              />
              <p className="text-xs text-gray-400">AI assistance and auto-save coming soon</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
