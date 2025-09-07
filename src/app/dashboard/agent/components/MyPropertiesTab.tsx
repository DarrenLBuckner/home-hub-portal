import React, { useState } from 'react';
import UploadArea from './UploadArea';
import PropertyList from './PropertyList';
import { createClient } from '@/lib/supabase/client';
// import { createClient } from '@supabase/supabase-js';

// Replace with actual propertyId from context or selection
const propertyId = "demo-property-id";

const allFeatures = [
  'Swimming Pool', 'Garage', 'Garden', 'Air Conditioning', 'Security System', 'Solar Panels', 'Furnished', 'Pet Friendly', 'Gated Community', 'Fenced Yard', 'Fruit Trees', 'Paved Roads', 'Washer & Dryer', 'Kitchen Appliances', 'Backup Generator', 'Electric Gate'
];

export default function MyPropertiesTab({ userId }: { userId: string }) {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Toggle feature selection
  const handleFeatureClick = async (feature: string) => {
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
      .eq('id', propertyId);
    setSaving(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">My Properties</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Create Property</button>
      </div>
  <PropertyList userId={userId} />
      <UploadArea propertyId={propertyId} />
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Property Features</h3>
        <div className="flex flex-wrap gap-3 mb-6">
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
        <h3 className="text-lg font-semibold mb-2">Property Description</h3>
        <textarea
          className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 mb-4"
          placeholder="Write a detailed description of the property..."
          // TODO: Add state and AI integration
        />
        <p className="text-xs text-gray-400">AI assistance coming soon</p>
      </div>
    </div>
  );
}
