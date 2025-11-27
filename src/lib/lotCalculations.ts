// Lot dimensions calculation utilities

export type DimensionUnit = 'ft' | 'm';
export type AreaUnit = 'sq ft' | 'sq m' | 'acres' | 'hectares';

// Unit conversion factors to square feet
const AREA_CONVERSION_FACTORS = {
  'sq ft': 1,
  'sq m': 10.764, // 1 sq m = 10.764 sq ft
  'acres': 1/43560, // 1 acre = 43,560 sq ft
  'hectares': 1/10764 // 1 hectare = 10,764 sq ft
};

// Dimension conversion factors to feet
const DIMENSION_CONVERSION_FACTORS = {
  'ft': 1,
  'm': 3.28084 // 1 meter = 3.28084 feet
};

/**
 * Calculate total area in square feet from length and width
 */
export function calculateAreaInSqFt(
  length: number, 
  width: number, 
  unit: DimensionUnit
): number {
  const lengthInFt = length * DIMENSION_CONVERSION_FACTORS[unit];
  const widthInFt = width * DIMENSION_CONVERSION_FACTORS[unit];
  return lengthInFt * widthInFt;
}

/**
 * Convert area from square feet to specified unit
 */
export function convertAreaFromSqFt(areaSqFt: number, toUnit: AreaUnit): number {
  return areaSqFt * AREA_CONVERSION_FACTORS[toUnit];
}

/**
 * Calculate area and return in multiple units for display
 */
export function calculateLotArea(
  length: number,
  width: number,
  dimensionUnit: DimensionUnit
) {
  if (!length || !width || length <= 0 || width <= 0) {
    return null;
  }

  const areaSqFt = calculateAreaInSqFt(length, width, dimensionUnit);
  
  return {
    sqFt: Math.round(areaSqFt),
    sqM: Math.round(convertAreaFromSqFt(areaSqFt, 'sq m')),
    acres: Number((convertAreaFromSqFt(areaSqFt, 'acres')).toFixed(3)),
    hectares: Number((convertAreaFromSqFt(areaSqFt, 'hectares')).toFixed(3))
  };
}

/**
 * Format area display text
 */
export function formatAreaDisplay(area: ReturnType<typeof calculateLotArea>): string {
  if (!area) return '';
  
  const parts = [];
  
  if (area.sqFt >= 1000) {
    parts.push(`${area.sqFt.toLocaleString()} sq ft`);
  } else {
    parts.push(`${area.sqFt} sq ft`);
  }
  
  if (area.acres >= 0.1) {
    parts.push(`${area.acres} acres`);
  }
  
  if (area.hectares >= 0.1) {
    parts.push(`${area.hectares} hectares`);
  }
  
  return parts.join(' • ');
}

/**
 * Validate dimension inputs
 */
export function validateDimensions(length: string, width: string): {
  isValid: boolean;
  error?: string;
} {
  const lengthNum = parseFloat(length);
  const widthNum = parseFloat(width);
  
  if (!length.trim() || !width.trim()) {
    return { isValid: false, error: 'Both length and width are required' };
  }
  
  if (isNaN(lengthNum) || isNaN(widthNum)) {
    return { isValid: false, error: 'Length and width must be valid numbers' };
  }
  
  if (lengthNum <= 0 || widthNum <= 0) {
    return { isValid: false, error: 'Length and width must be greater than 0' };
  }
  
  if (lengthNum > 100000 || widthNum > 100000) {
    return { isValid: false, error: 'Dimensions seem unreasonably large' };
  }
  
  return { isValid: true };
}