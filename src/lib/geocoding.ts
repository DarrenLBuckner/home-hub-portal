// Server-side geocoding utility
// Converts text address fields into lat/lng coordinates using Google Geocoding API

const COUNTRY_NAMES: Record<string, string> = {
  GY: 'Guyana',
  JM: 'Jamaica',
  TT: 'Trinidad and Tobago',
  BB: 'Barbados',
  SR: 'Suriname',
  BZ: 'Belize',
  LC: 'Saint Lucia',
  GD: 'Grenada',
  AG: 'Antigua and Barbuda',
  KN: 'Saint Kitts and Nevis',
  DM: 'Dominica',
  VC: 'Saint Vincent and the Grenadines',
};

interface GeocodingFields {
  address?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
}

interface GeocodingResult {
  lat: number;
  lng: number;
}

/**
 * Geocode a property address into lat/lng coordinates.
 * Tries progressively less-specific queries if the full address fails.
 * Returns null if geocoding fails — never throws.
 */
export async function geocodeAddress(fields: GeocodingFields): Promise<GeocodingResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ Geocoding skipped: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set');
    return null;
  }

  const countryName = fields.country
    ? COUNTRY_NAMES[fields.country.toUpperCase()] || fields.country
    : null;

  // Build candidate queries from most to least specific
  const candidates: string[] = [];

  const parts = [fields.address, fields.neighborhood, fields.city, countryName].filter(Boolean);
  if (parts.length >= 2) candidates.push(parts.join(', '));

  const noAddr = [fields.neighborhood, fields.city, countryName].filter(Boolean);
  if (noAddr.length >= 2 && noAddr.join(', ') !== candidates[0]) candidates.push(noAddr.join(', '));

  const broad = [fields.city || fields.region, countryName].filter(Boolean);
  if (broad.length >= 2 && !candidates.includes(broad.join(', '))) candidates.push(broad.join(', '));

  if (candidates.length === 0) {
    console.warn('⚠️ Geocoding skipped: no usable address fields');
    return null;
  }

  for (const query of candidates) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        const loc = data.results[0].geometry.location;
        console.log(`📍 Geocoded "${query}" → ${loc.lat}, ${loc.lng}`);
        return { lat: loc.lat, lng: loc.lng };
      }

      console.log(`📍 Geocode no results for "${query}" (status: ${data.status})`);
    } catch (err) {
      console.warn(`⚠️ Geocode request failed for "${query}":`, err);
    }
  }

  console.warn('⚠️ Geocoding failed for all candidates:', candidates);
  return null;
}
