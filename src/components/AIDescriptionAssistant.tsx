"use client";
import React, { useState } from 'react';

interface PropertyData {
  title?: string;
  propertyType: string;
  propertyCategory?: string; // 'residential' | 'commercial'
  // Residential fields
  bedrooms: string;
  bathrooms: string;
  // Commercial fields
  commercialType?: string;
  floorSize?: string;
  price: string;
  location: string;
  squareFootage?: string;
  features: string[];
  rentalType?: string;
}

interface AIDescriptionAssistantProps {
  propertyData: PropertyData;
  onDescriptionGenerated: (description: string) => void;
  currentDescription: string;
}

const AIDescriptionAssistant: React.FC<AIDescriptionAssistantProps> = ({
  propertyData,
  onDescriptionGenerated,
  currentDescription
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'luxury' | 'casual'>('professional');
  const [showToneOptions, setShowToneOptions] = useState(false);

  const toneDescriptions = {
    professional: 'Business-like, suitable for corporate listings',
    friendly: 'Warm and welcoming, perfect for families',
    luxury: 'Premium and exclusive, for high-end properties',
    casual: 'Relaxed and approachable, easy-going vibe'
  };

  const generateDescription = async () => {
    // Smart validation based on property category
    const isCommercial = propertyData.propertyCategory === 'commercial';
    
    if (!propertyData.propertyType) {
      setError('Please select a property type first');
      return;
    }
    
    if (isCommercial) {
      // For commercial properties, require commercial type and floor size
      if (!propertyData.commercialType || !propertyData.floorSize) {
        setError('Please fill in commercial type and floor size first');
        return;
      }
    } else {
      // For residential properties, require bedrooms and bathrooms
      if (!propertyData.bedrooms || !propertyData.bathrooms) {
        setError('Please fill in bedrooms and bathrooms first');
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...propertyData,
          tone: selectedTone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate description');
      }

      const data = await response.json();
      onDescriptionGenerated(data.description);
      setShowToneOptions(false);
    } catch (err: any) {
      setError(err.message || 'Failed to generate description');
    } finally {
      setIsLoading(false);
    }
  };

  // Smart validation for required fields based on property category
  const isCommercial = propertyData.propertyCategory === 'commercial';
  const hasRequiredFields = propertyData.propertyType && (
    isCommercial 
      ? (propertyData.commercialType && propertyData.floorSize)
      : (propertyData.bedrooms && propertyData.bathrooms)
  );

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v1a1 1 0 01-.293.707L12 10.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-6.586L3.293 5.707A1 1 0 013 5V4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">AI Description Assistant</h3>
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full font-medium">NEW</span>
        </div>
        
        <button
          onClick={() => setShowToneOptions(!showToneOptions)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Style: {selectedTone} ⚙️
        </button>
      </div>

      <p className="text-gray-600 text-sm mb-4">
        Let AI create a compelling property description based on your details. 
        {!hasRequiredFields && (
          <span className="text-amber-600 font-medium">
            {isCommercial 
              ? ' Fill in property type, commercial type, and floor size first.'
              : ' Fill in property type, bedrooms, and bathrooms first.'
            }
          </span>
        )}
      </p>

      {showToneOptions && (
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <h4 className="font-medium text-gray-800 mb-2">Choose Description Style:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(toneDescriptions).map(([tone, description]) => (
              <button
                key={tone}
                onClick={() => setSelectedTone(tone as any)}
                className={`p-2 text-left rounded-lg border transition-colors ${
                  selectedTone === tone
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-medium capitalize">{tone}</div>
                <div className="text-xs text-gray-700">{description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={generateDescription}
          disabled={isLoading || !hasRequiredFields}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            isLoading || !hasRequiredFields
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {currentDescription ? 'Regenerate' : 'Generate'} Description
            </div>
          )}
        </button>
        
        {currentDescription && (
          <button
            onClick={() => onDescriptionGenerated('')}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
          >
            Clear
          </button>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-700">
        💡 Tip: Fill in more details (features, location, size) for better descriptions
      </div>
      {currentDescription && (
        <div className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
          ⚡ After generating: Review and select matching amenities below to ensure they align with your description
        </div>
      )}
    </div>
  );
};

export default AIDescriptionAssistant;