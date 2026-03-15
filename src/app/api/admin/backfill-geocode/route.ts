export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large backfills

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/supabase-admin';
import { geocodeAddress } from '@/lib/geocoding';

export async function POST(request: Request) {
  try {
    // Auth check - require super admin
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('admin_level')
      .eq('id', user.id)
      .single();

    if (!profile || profile.admin_level !== 'super') {
      return NextResponse.json({ error: 'Requires super admin' }, { status: 403 });
    }

    // Parse options
    const body = await request.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize || 20, 100);
    const dryRun = body.dryRun === true;
    const propertyId = body.propertyId || null; // Optional: geocode a single property

    const adminSupabase = createAdminClient();

    // Build query for properties missing coordinates
    let query = adminSupabase
      .from('properties')
      .select('id, title, address, neighborhood, city, region, country_id, latitude, longitude, status')
      .is('latitude', null)
      .is('longitude', null)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(batchSize);

    // If a specific property ID is requested, override the filter
    if (propertyId) {
      query = adminSupabase
        .from('properties')
        .select('id, title, address, neighborhood, city, region, country_id, latitude, longitude, status')
        .eq('id', propertyId)
        .limit(1);
    }

    const { data: properties, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: `Fetch failed: ${fetchError.message}` }, { status: 500 });
    }

    if (!properties || properties.length === 0) {
      return NextResponse.json({
        success: true,
        message: propertyId
          ? 'Property not found or already has coordinates'
          : 'All active properties already have coordinates',
        processed: 0,
        remaining: 0,
      });
    }

    // Count total remaining (only when not targeting a single property)
    let remaining = properties.length;
    if (!propertyId) {
      const { count } = await adminSupabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .is('latitude', null)
        .is('longitude', null)
        .eq('status', 'active');
      remaining = count || 0;
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        wouldProcess: properties.length,
        remaining,
        sample: properties.slice(0, 10).map((p: any) => ({
          id: p.id,
          title: p.title,
          neighborhood: p.neighborhood,
          city: p.city,
          region: p.region,
          country: p.country_id,
          hasAddress: !!p.address,
        })),
      });
    }

    // Geocode each property sequentially to avoid rate limiting
    let succeeded = 0;
    let failed = 0;
    const results: Array<{
      id: string;
      title: string;
      coords: { lat: number; lng: number } | null;
      query?: string;
      error?: string;
    }> = [];

    for (const property of properties) {
      try {
        const coords = await geocodeAddress({
          address: property.address,
          neighborhood: property.neighborhood,
          city: property.city || property.region,
          region: property.region,
          country: property.country_id,
        });

        if (coords) {
          const { error: updateError } = await adminSupabase
            .from('properties')
            .update({
              latitude: coords.lat,
              longitude: coords.lng,
              updated_at: new Date().toISOString(),
            })
            .eq('id', property.id);

          if (updateError) {
            failed++;
            results.push({
              id: property.id,
              title: property.title,
              coords: null,
              error: updateError.message,
            });
          } else {
            succeeded++;
            results.push({
              id: property.id,
              title: property.title,
              coords,
            });
          }
        } else {
          failed++;
          results.push({
            id: property.id,
            title: property.title,
            coords: null,
            error: 'Geocoding returned no results — insufficient location data',
          });
        }
      } catch (err: any) {
        failed++;
        results.push({
          id: property.id,
          title: property.title,
          coords: null,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: properties.length,
      succeeded,
      failed,
      remaining: remaining - succeeded,
      results,
    });
  } catch (error: any) {
    console.error('Geocode backfill error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
