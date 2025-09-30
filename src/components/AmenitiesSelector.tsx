import React, { useState, useEffect } from 'react';
import { AMENITIES_CATEGORIES } from '@/lib/constants/amenities';

interface AmenitiesSelectorProps {
  value: string[];
  onChange: (amenities: string[]) => void;
}

export default function AmenitiesSelector({ value = [], onChange }: AmenitiesSelectorProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(value);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['climate', 'outdoor']);

  useEffect(() => {
    setSelectedAmenities(value);
  }, [value]);

  const handleToggleAmenity = (amenityId: string) => {
    const newSelectedAmenities = selectedAmenities.includes(amenityId)
      ? selectedAmenities.filter(id => id !== amenityId)
      : [...selectedAmenities, amenityId];
    
    setSelectedAmenities(newSelectedAmenities);
    onChange(newSelectedAmenities);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="amenities-selector">
      <h3 className="text-lg font-medium mb-2">Amenities</h3>
      <p className="text-sm text-gray-500 mb-4">Select all that apply</p>
      
      {AMENITIES_CATEGORIES.map(category => (
        <div key={category.id} className="category-section mb-4">
          <button
            type="button"
            className="flex justify-between items-center w-full text-left py-2 border-b"
            onClick={() => toggleCategory(category.id)}
          >
            <span className="font-medium">{category.name}</span>
            <svg 
              className={`w-5 h-5 transition-transform ${
                expandedCategories.includes(category.id) ? 'transform rotate-180' : ''
              }`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          {expandedCategories.includes(category.id) && (
            <div className="amenities-grid mt-2">
              {category.amenities.map(amenity => (
                <div key={amenity.id} className="amenity-checkbox">
                  <input
                    type="checkbox"
                    id={`amenity-${amenity.id}`}
                    checked={selectedAmenities.includes(amenity.id)}
                    onChange={() => handleToggleAmenity(amenity.id)}
                    className="w-4 h-4"
                  />
                  <label 
                    htmlFor={`amenity-${amenity.id}`}
                    className="ml-2 text-sm cursor-pointer"
                  >
                    {amenity.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {selectedAmenities.length > 0 && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
          <p className="text-sm font-medium text-gray-700">
            ✨ {selectedAmenities.length} amenities selected
          </p>
          {selectedAmenities.length < 3 && (
            <p className="text-xs text-blue-600 mt-1">
              💡 Add {3 - selectedAmenities.length} more to boost your listing score!
            </p>
          )}
          {selectedAmenities.length >= 3 && selectedAmenities.length < 5 && (
            <p className="text-xs text-green-600 mt-1">
              🎯 Great! Add {5 - selectedAmenities.length} more to maximize appeal!
            </p>
          )}
          {selectedAmenities.length >= 5 && (
            <p className="text-xs text-green-700 mt-1">
              🏆 Excellent! Your property has premium appeal with {selectedAmenities.length} amenities!
            </p>
          )}
        </div>
      )}
      
      <style jsx>{`
        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 10px;
        }
        
        .amenity-checkbox {
          display: flex;
          align-items: center;
          padding: 6px;
          border-radius: 4px;
        }
        
        .amenity-checkbox:hover {
          background-color: #f3f4f6;
        }
        
        @media (max-width: 640px) {
          .amenities-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}