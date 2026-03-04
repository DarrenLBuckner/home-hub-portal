export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large backfills

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/supabase-admin';
import { generateAltText } from '@/lib/ai/generateAltText';

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
    const batchSize = Math.min(body.batchSize || 20, 50); // Max 50 per request
    const dryRun = body.dryRun === true;

    // Fetch images without alt text, joined with property data for context
    const adminSupabase = createAdminClient();
    const { data: mediaRows, error: fetchError } = await adminSupabase
      .from('property_media')
      .select(`
        id,
        media_url,
        display_order,
        is_primary,
        property_id,
        properties!property_media_property_id_fkey (
          title,
          property_type,
          listing_type,
          bedrooms,
          bathrooms,
          city,
          neighborhood
        )
      `)
      .is('alt_text', null)
      .eq('media_type', 'image')
      .order('created_at', { ascending: true })
      .limit(batchSize);

    if (fetchError) {
      return NextResponse.json({ error: `Fetch failed: ${fetchError.message}` }, { status: 500 });
    }

    if (!mediaRows || mediaRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All images already have alt text',
        processed: 0,
        remaining: 0,
      });
    }

    // Count remaining
    const { count: remaining } = await adminSupabase
      .from('property_media')
      .select('id', { count: 'exact', head: true })
      .is('alt_text', null)
      .eq('media_type', 'image');

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        wouldProcess: mediaRows.length,
        remaining: remaining || 0,
        sample: mediaRows.slice(0, 3).map((r: any) => ({
          id: r.id,
          url: r.media_url.substring(0, 80) + '...',
          property: r.properties?.title,
        })),
      });
    }

    // Generate alt text for each image
    let succeeded = 0;
    let failed = 0;
    const results: Array<{ id: string; altText: string | null; error?: string }> = [];

    // Process in parallel (batch of up to 50)
    const promises = mediaRows.map(async (row: any) => {
      const property = row.properties;
      try {
        const altText = await generateAltText(row.media_url, {
          title: property?.title,
          propertyType: property?.property_type,
          listingType: property?.listing_type,
          bedrooms: property?.bedrooms,
          bathrooms: property?.bathrooms,
          location: property?.city,
          neighborhood: property?.neighborhood,
          imageIndex: row.display_order,
        });

        if (altText) {
          const { error: updateError } = await adminSupabase
            .from('property_media')
            .update({ alt_text: altText })
            .eq('id', row.id);

          if (updateError) {
            failed++;
            results.push({ id: row.id, altText: null, error: updateError.message });
          } else {
            succeeded++;
            results.push({ id: row.id, altText });
          }
        } else {
          failed++;
          results.push({ id: row.id, altText: null, error: 'AI returned empty' });
        }
      } catch (err: any) {
        failed++;
        results.push({ id: row.id, altText: null, error: err.message });
      }
    });

    await Promise.allSettled(promises);

    return NextResponse.json({
      success: true,
      processed: mediaRows.length,
      succeeded,
      failed,
      remaining: (remaining || 0) - succeeded,
      results: results.slice(0, 10), // Return first 10 for review
    });
  } catch (error: any) {
    console.error('Backfill error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
