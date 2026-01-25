"use client";
import React, { useState } from 'react';

interface PropertyData {
  propertyType: string;
  propertyCategory?: 'residential' | 'commercial';
  listingType?: 'sale' | 'rent' | 'lease';
  bedrooms?: string;
  bathrooms?: string;
  commercialType?: string;
  floorSize?: string;
  price?: string;
  location?: string;
  neighborhood?: string;
  features?: string[];
}

interface AITitleSuggesterProps {
  propertyData: PropertyData;
  onTitleSelected: (title: string) => void;
  currentTitle: string;
}

const AITitleSuggester: React.FC<AITitleSuggesterProps> = ({
  propertyData,
  onTitleSelected,
  currentTitle
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState<'professional' | 'friendly' | 'luxury' | 'casual'>('professional');
  const [showToneOptions, setShowToneOptions] = useState(false);

  const toneDescriptions = {
    professional: 'Business-like, suitable for most listings',
    friendly: 'Warm and welcoming, great for families',
    luxury: 'Premium and exclusive, for high-end properties',
    casual: 'Relaxed and approachable'
  };

  const generateTitles = async () => {
    if (!propertyData.propertyType) {
      setError('Please select a property type first');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const response = await fetch('/api/ai/generate-title', {
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
        throw new Error(errorData.error || 'Failed to generate titles');
      }

      const data = await response.json();
      setSuggestions(data.titles || []);
    } catch (err: any) {
      setError(err.message || 'Failed to generate titles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectTitle = (title: string) => {
    onTitleSelected(title);
    setSuggestions([]); // Clear suggestions after selection
  };

  const hasRequiredFields = !!propertyData.propertyType;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">AI Title Suggestions</h3>
        </div>

        <button
          onClick={() => setShowToneOptions(!showToneOptions)}
          className="text-xs text-purple-600 hover:text-purple-800 font-medium"
        >
          Style: {selectedTone}
        </button>
      </div>

      <p className="text-gray-600 text-xs mb-3">
        Get 3 AI-generated title ideas based on your property details.
        {!hasRequiredFields && (
          <span className="text-amber-600 font-medium"> Select a property type first.</span>
        )}
      </p>

      {showToneOptions && (
        <div className="mb-3 p-2 bg-white rounded-lg border">
          <h4 className="font-medium text-gray-800 text-xs mb-2">Choose Style:</h4>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(toneDescriptions).map(([tone, description]) => (
              <button
                key={tone}
                onClick={() => {
                  setSelectedTone(tone as any);
                  setShowToneOptions(false);
                }}
                className={`p-2 text-left rounded border transition-colors ${
                  selectedTone === tone
                    ? 'border-purple-500 bg-purple-50 text-purple-800'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                <div className="font-medium capitalize text-xs">{tone}</div>
                <div className="text-[10px] text-gray-500">{description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 text-xs">{error}</p>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="mb-3 space-y-2">
          <p className="text-xs font-medium text-gray-700">Click a title to use it:</p>
          {suggestions.map((title, index) => (
            <button
              key={index}
              onClick={() => handleSelectTitle(title)}
              className="w-full p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all group"
            >
              <div className="flex items-start gap-2">
                <span className="text-purple-500 font-bold text-sm">{index + 1}.</span>
                <span className="text-gray-800 text-sm group-hover:text-purple-700">{title}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <button
        onClick={generateTitles}
        disabled={isLoading || !hasRequiredFields}
        className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
          isLoading || !hasRequiredFields
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-600 hover:to-blue-700 shadow-md hover:shadow-lg'
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
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {suggestions.length > 0 ? 'Generate New Titles' : 'Suggest Titles'}
          </div>
        )}
      </button>

      {currentTitle && suggestions.length === 0 && (
        <p className="text-[10px] text-gray-500 mt-2 text-center">
          Already have a title? You can still get AI suggestions for comparison.
        </p>
      )}
    </div>
  );
};

export default AITitleSuggester;
