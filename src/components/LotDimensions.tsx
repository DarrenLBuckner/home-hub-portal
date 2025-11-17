import React, { useState, useEffect } from 'react';
import { calculateLotArea, formatAreaDisplay, validateDimensions, DimensionUnit } from '@/lib/lotCalculations';

interface LotDimensionsProps {
  length: string;
  width: string;
  unit: DimensionUnit;
  onLengthChange: (length: string) => void;
  onWidthChange: (width: string) => void;
  onUnitChange: (unit: DimensionUnit) => void;
  onAreaCalculated?: (areaSqFt: number) => void;
  label?: string;
  required?: boolean;
}

const LotDimensions: React.FC<LotDimensionsProps> = ({
  length,
  width,
  unit,
  onLengthChange,
  onWidthChange,
  onUnitChange,
  onAreaCalculated,
  label = "Lot Dimensions",
  required = false
}) => {
  const [validationError, setValidationError] = useState<string>('');
  
  // Calculate area whenever dimensions change
  const calculatedArea = calculateLotArea(
    parseFloat(length) || 0,
    parseFloat(width) || 0,
    unit
  );

  // Notify parent of area calculation
  useEffect(() => {
    if (calculatedArea && onAreaCalculated) {
      onAreaCalculated(calculatedArea.sqFt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedArea]);

  // Validate on change
  useEffect(() => {
    if (length.trim() && width.trim()) {
      const validation = validateDimensions(length, width);
      setValidationError(validation.error || '');
    } else {
      setValidationError('');
    }
  }, [length, width]);

  return (
    <div className="space-y-4">
      <label className="block text-base font-bold text-gray-900 mb-3">
        📐 {label} {required && '*'}
      </label>
      
      {/* Dimension inputs */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Length
          </label>
          <input
            type="number"
            value={length}
            onChange={(e) => onLengthChange(e.target.value)}
            placeholder="100"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 bg-white placeholder-gray-600 text-base"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width
          </label>
          <input
            type="number"
            value={width}
            onChange={(e) => onWidthChange(e.target.value)}
            placeholder="80"
            min="0"
            step="0.1"
            className="w-full px-3 py-2 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 bg-white placeholder-gray-600 text-base"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unit
          </label>
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value as DimensionUnit)}
            className="w-full px-3 py-2 border-2 border-gray-400 focus:border-blue-500 rounded-lg text-gray-900 bg-white text-base"
          >
            <option value="ft">Feet</option>
            <option value="m">Meters</option>
          </select>
        </div>
      </div>
      
      {/* Validation error */}
      {validationError && (
        <div className="text-red-600 text-sm font-medium">
          ⚠️ {validationError}
        </div>
      )}
      
      {/* Auto-calculated area display */}
      {calculatedArea && !validationError && length.trim() && width.trim() && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-green-800 font-semibold text-sm mb-2">
            📊 Auto-calculated Total Area:
          </div>
          <div className="text-green-700 font-medium">
            {formatAreaDisplay(calculatedArea)}
          </div>
          <div className="text-green-600 text-xs mt-1">
            Based on {length} × {width} {unit}
          </div>
        </div>
      )}
      
      {/* Help text */}
      <div className="text-sm text-gray-600">
        💡 Enter the lot's length and width to automatically calculate total area in multiple units
      </div>
    </div>
  );
};

export default LotDimensions;