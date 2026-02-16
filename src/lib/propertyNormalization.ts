/**
 * Property data normalization utilities
 * Maps legacy values to current values for backward compatibility
 *
 * When loading properties from DB, call normalizePropertyData()
 * This ensures old properties display correctly in the UI
 * When saved, properties use the new normalized values (gradual migration)
 */

// Property type mapping: old value → new value
const PROPERTY_TYPE_MAP: Record<string, string> = {
  // Residential merges
  'Single Family Home': 'House',
  'Villa': 'House',
  'Bungalow': 'House',
  'Cottage': 'House',
  'Duplex': 'Multi-family',
  'Condo': 'Apartment',
  'Townhouse': 'House',

  // Land types - normalize legacy values
  'Residential Farmland': 'Residential Land',
  'Farmland': 'Land',
  'Agricultural Land': 'Land',

  // Commercial merges
  'Industrial': 'Warehouse',
  'Medical': 'Office', // Rare, map to closest
};

// Amenity mapping: old value → new value
const AMENITY_MAP: Record<string, string> = {
  'Air Conditioning': 'AC',
  'Swimming Pool': 'Pool',
  'Security System': 'Security',
  'Backup Generator': 'Generator',
  'Laundry Room': 'Laundry',
  'Internet/WiFi Ready': 'Internet',
  'Fence/Gated': 'Gated',
  'Solar Panels': 'Solar',
  'Conference Room': 'Conference',
  'Kitchen/Break Room': 'Kitchen',
  'Reception Area': 'Reception',
  'Handicap Accessible': 'Handicap',
  'Elevator Access': 'Elevator',
  // Values that stay the same (for completeness)
  'Garden': 'Garden',
  'Garage': 'Garage',
  'Balcony': 'Balcony',
  'Parking': 'Parking',
  'Furnished': 'Furnished',
  'Water Tank': 'Water Tank',
  'Storage': 'Storage',
  'CCTV': 'CCTV',
  'Fiber Internet': 'Fiber Internet',
};

/**
 * Normalize a property type value
 */
export function normalizePropertyType(propertyType: string | null | undefined): string {
  if (!propertyType) return '';
  return PROPERTY_TYPE_MAP[propertyType] || propertyType;
}

/**
 * Normalize an array of amenities
 */
export function normalizeAmenities(amenities: string[] | null | undefined): string[] {
  if (!amenities || !Array.isArray(amenities)) return [];

  const normalized = amenities.map(amenity => AMENITY_MAP[amenity] || amenity);

  // Remove duplicates (in case old and new values both existed)
  return [...new Set(normalized)];
}

/**
 * Normalize full property data object
 * Call this when loading property from database for editing
 */
export function normalizePropertyData<T extends Record<string, any>>(property: T): T {
  return {
    ...property,
    property_type: normalizePropertyType(property.property_type),
    amenities: normalizeAmenities(property.amenities),
  };
}

/**
 * Get display label for a property type
 * Used when showing property type in UI (cards, lists, etc.)
 */
export function getPropertyTypeLabel(propertyType: string): string {
  const normalized = normalizePropertyType(propertyType);

  const labels: Record<string, string> = {
    'House': 'House',
    'Apartment': 'Apartment',
    'Multi-family': 'Multi-family',
    'Land': 'Land',
    'Residential Land': 'Residential Land',
    'Commercial Land': 'Commercial Land',
    'Office': 'Office',
    'Retail': 'Retail',
    'Warehouse': 'Warehouse/Industrial',
    'Mixed Use': 'Mixed Use',
    'Restaurant': 'Restaurant',
  };

  return labels[normalized] || normalized;
}

/**
 * Get display label for an amenity
 * Used when showing amenities in UI (property cards, details, etc.)
 */
export function getAmenityLabel(amenity: string): string {
  const normalized = AMENITY_MAP[amenity] || amenity;

  const labels: Record<string, string> = {
    'AC': 'Air Conditioning',
    'Pool': 'Swimming Pool',
    'Garden': 'Garden/Yard',
    'Garage': 'Garage',
    'Security': 'Security System',
    'Balcony': 'Balcony/Patio',
    'Laundry': 'Laundry Room',
    'Generator': 'Backup Generator',
    'Water Tank': 'Water Tank',
    'Gated': 'Gated/Fenced',
    'Furnished': 'Fully Furnished',
    'Internet': 'Internet Ready',
    'Parking': 'Parking',
    'Solar': 'Solar Panels',
    'Conference': 'Conference Room',
    'Kitchen': 'Kitchen/Break Room',
    'Reception': 'Reception Area',
    'Storage': 'Storage',
    'Fiber Internet': 'Fiber Internet',
    'CCTV': 'CCTV',
    'Handicap': 'Handicap Accessible',
    'Elevator': 'Elevator Access',
  };

  return labels[normalized] || normalized;
}

/**
 * Get display labels for an array of amenities
 */
export function getAmenityLabels(amenities: string[]): string[] {
  return amenities.map(getAmenityLabel);
}
