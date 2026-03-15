// One-time script to backfill latitude/longitude for properties missing coordinates
// Usage: node scripts/backfill-geocode.mjs

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load env from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !GOOGLE_API_KEY) {
  console.error('Missing required env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const COUNTRY_NAMES = {
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

async function geocode(fields) {
  const countryName = fields.country_id
    ? COUNTRY_NAMES[fields.country_id.toUpperCase()] || fields.country_id
    : null;

  const candidates = [];

  const parts = [fields.address, fields.neighborhood, fields.city, countryName].filter(Boolean);
  if (parts.length >= 2) candidates.push(parts.join(', '));

  const noAddr = [fields.neighborhood, fields.city, countryName].filter(Boolean);
  if (noAddr.length >= 2 && noAddr.join(', ') !== candidates[0]) candidates.push(noAddr.join(', '));

  const broad = [fields.city || fields.region, countryName].filter(Boolean);
  if (broad.length >= 2 && !candidates.includes(broad.join(', '))) candidates.push(broad.join(', '));

  if (candidates.length === 0) return null;

  for (const query of candidates) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        const loc = data.results[0].geometry.location;
        console.log(`  📍 Geocoded "${query}" → ${loc.lat}, ${loc.lng}`);
        return { lat: loc.lat, lng: loc.lng };
      }
      console.log(`  ❌ No results for "${query}" (${data.status})`);
    } catch (err) {
      console.warn(`  ⚠️ Request failed for "${query}":`, err.message);
    }
  }
  return null;
}

async function main() {
  // ── Step 1: Test with the specific property ──
  console.log('=== STEP 1: Test property (slug contains "aa826e74") ===\n');

  const { data: testProp, error: testErr } = await supabase
    .from('properties')
    .select('id, title, slug, address, neighborhood, city, region, country_id, latitude, longitude, status')
    .like('slug', '%aa826e74%')
    .single();

  if (testErr || !testProp) {
    console.error('Could not find test property:', testErr?.message);
    process.exit(1);
  }

  console.log(`Found: "${testProp.title}"`);
  console.log(`  slug: ${testProp.slug}`);
  console.log(`  status: ${testProp.status}`);
  console.log(`  address: ${testProp.address || '(none)'}`);
  console.log(`  neighborhood: ${testProp.neighborhood || '(none)'}`);
  console.log(`  city: ${testProp.city || '(none)'}`);
  console.log(`  region: ${testProp.region || '(none)'}`);
  console.log(`  country_id: ${testProp.country_id || '(none)'}`);
  console.log(`  current lat/lng: ${testProp.latitude}, ${testProp.longitude}`);
  console.log('');

  if (testProp.latitude && testProp.longitude) {
    console.log('Test property already has coordinates — skipping update.');
  } else {
    console.log('Geocoding test property...');
    const coords = await geocode(testProp);
    if (!coords) {
      console.error('Geocoding returned no results for test property. Aborting.');
      process.exit(1);
    }

    console.log(`\nUpdating test property with lat=${coords.lat}, lng=${coords.lng}...`);
    const { error: updateErr } = await supabase
      .from('properties')
      .update({ latitude: coords.lat, longitude: coords.lng })
      .eq('id', testProp.id);

    if (updateErr) {
      console.error('Update failed:', updateErr.message);
      process.exit(1);
    }
    console.log('✅ Test property updated successfully!\n');
  }

  // ── Step 2: Batch update all properties missing coordinates ──
  console.log('=== STEP 2: Batch update all properties with NULL lat/lng ===\n');

  const { data: props, error: batchErr } = await supabase
    .from('properties')
    .select('id, title, slug, address, neighborhood, city, region, country_id, latitude, longitude, status')
    .is('latitude', null)
    .is('longitude', null)
    .in('status', ['active', 'published']);

  if (batchErr) {
    console.error('Query failed:', batchErr.message);
    process.exit(1);
  }

  console.log(`Found ${props.length} properties with missing coordinates.\n`);

  let updated = 0;
  let skipped = 0;

  for (const prop of props) {
    console.log(`[${updated + skipped + 1}/${props.length}] "${prop.title}" (${prop.slug})`);
    console.log(`  neighborhood=${prop.neighborhood || '-'}, city=${prop.city || '-'}, region=${prop.region || '-'}, country=${prop.country_id || '-'}`);

    const coords = await geocode(prop);
    if (!coords) {
      console.log('  ⏭️  Skipped — no geocoding results\n');
      skipped++;
      continue;
    }

    const { error: upErr } = await supabase
      .from('properties')
      .update({ latitude: coords.lat, longitude: coords.lng })
      .eq('id', prop.id);

    if (upErr) {
      console.error(`  ❌ Update failed: ${upErr.message}\n`);
      skipped++;
    } else {
      console.log(`  ✅ Updated → ${coords.lat}, ${coords.lng}\n`);
      updated++;
    }
  }

  console.log('=== DONE ===');
  console.log(`Updated: ${updated}, Skipped: ${skipped}, Total: ${props.length}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
