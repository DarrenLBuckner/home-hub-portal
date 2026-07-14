import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/supabase-admin';

/**
 * PATCH /api/properties/[id]/media/reorder
 *
 * Set-as-primary and/or reorder for already-saved property photos.
 * DATABASE ROWS ONLY — no Storage operations, no file uploads. Fully independent
 * of the shared PUT save route (src/app/api/properties/update/[id]/route.ts).
 *
 * Body (either or both):
 *   - primaryMediaId?: string        -> that property_media row becomes is_primary=true, all others false
 *   - orderedMediaIds?: string[]     -> display_order written to match array position (complete ordering)
 *
 * Write order (see H5 directive):
 *   1. property_media is_primary flip: clear-all-false THEN set-one-true (never two primaries).
 *   2. property_media display_order: sequential awaited UPDATEs, one per row (NO Promise.all — May 17 race).
 *   3. properties.images[] LAST, dup-safe: asserted order intersected with URLs already in images[],
 *      primary-first; prepend chosen primary only if missing; never wholesale re-derive.
 *   UPDATEs touch ONLY is_primary/display_order — never the NOT NULL content columns.
 */

type MediaRow = {
  id: string;
  media_url: string;
  media_type: string;
  display_order: number | null;
  is_primary: boolean | null;
};

const sortCanonical = (rows: MediaRow[]): MediaRow[] =>
  rows.slice().sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.display_order ?? 0) - (b.display_order ?? 0);
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const primaryMediaId = body.primaryMediaId;
    const orderedMediaIds = body.orderedMediaIds;

    const hasPrimary = typeof primaryMediaId === 'string' && primaryMediaId.length > 0;
    const orderProvided = orderedMediaIds !== undefined && orderedMediaIds !== null;
    const hasOrder =
      Array.isArray(orderedMediaIds) &&
      orderedMediaIds.length > 0 &&
      orderedMediaIds.every((x: unknown) => typeof x === 'string' && x.length > 0);

    if (orderProvided && !hasOrder) {
      return NextResponse.json(
        { error: 'orderedMediaIds must be a non-empty array of media id strings' },
        { status: 400 }
      );
    }
    if (!hasPrimary && !hasOrder) {
      return NextResponse.json(
        { error: 'Provide primaryMediaId and/or orderedMediaIds' },
        { status: 400 }
      );
    }

    // --- Authenticate caller (anon cookie client — mirrors delete-image route) ---
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // All data access via service-role (bypasses RLS — no x-country-code needed)
    const adminClient = createAdminClient() as any;

    const { data: property, error: propError } = await adminClient
      .from('properties')
      .select('user_id, images')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // --- Authorization: listing owner OR admin (super/owner only, mutation-grade) ---
    const isOwner = property.user_id === user.id;
    let isAdmin = false;
    if (!isOwner) {
      const { data: profile } = await adminClient
        .from('profiles')
        .select('admin_level')
        .eq('id', user.id)
        .single();
      isAdmin = profile?.admin_level === 'super' || profile?.admin_level === 'owner';
    }
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // --- Load this property's image media rows ---
    const { data: mediaRows, error: mediaError } = await adminClient
      .from('property_media')
      .select('id, media_url, media_type, display_order, is_primary')
      .eq('property_id', propertyId)
      .eq('media_type', 'image');

    if (mediaError) {
      console.error('media/reorder: failed to load property_media:', mediaError);
      return NextResponse.json({ error: 'Failed to load property media' }, { status: 500 });
    }

    const media: MediaRow[] = mediaRows || [];
    const mediaIdSet = new Set(media.map((m) => m.id));

    // --- Validate supplied ids belong to this property ---
    if (hasPrimary && !mediaIdSet.has(primaryMediaId)) {
      return NextResponse.json(
        { error: 'primaryMediaId does not belong to this property' },
        { status: 400 }
      );
    }
    if (hasOrder) {
      const ord = orderedMediaIds as string[];
      const uniqueCount = new Set(ord).size;
      const isCompletePermutation =
        ord.length === media.length &&
        uniqueCount === ord.length &&
        ord.every((mid) => mediaIdSet.has(mid));
      if (!isCompletePermutation) {
        return NextResponse.json(
          {
            error:
              "orderedMediaIds must be a complete, duplicate-free ordering of this property's image media",
          },
          { status: 400 }
        );
      }
    }

    // ================= WRITE property_media FIRST =================

    // 1. Primary flip — clear all, then set one (never two primaries at rest).
    if (hasPrimary) {
      const { error: clearErr } = await adminClient
        .from('property_media')
        .update({ is_primary: false })
        .eq('property_id', propertyId)
        .eq('media_type', 'image');
      if (clearErr) {
        console.error('media/reorder: failed to clear primary flags:', clearErr);
        return NextResponse.json({ error: 'Failed to clear primary flags' }, { status: 500 });
      }

      const { error: setErr } = await adminClient
        .from('property_media')
        .update({ is_primary: true })
        .eq('id', primaryMediaId)
        .eq('property_id', propertyId);
      if (setErr) {
        console.error('media/reorder: failed to set primary:', setErr);
        return NextResponse.json({ error: 'Failed to set primary photo' }, { status: 500 });
      }
    }

    // 2. Reorder — sequential awaited UPDATEs, one per row. NO Promise.all (May 17 race signature).
    if (hasOrder) {
      const ord = orderedMediaIds as string[];
      for (let i = 0; i < ord.length; i++) {
        const { error: orderErr } = await adminClient
          .from('property_media')
          .update({ display_order: i })
          .eq('id', ord[i])
          .eq('property_id', propertyId);
        if (orderErr) {
          console.error(`media/reorder: failed to set display_order for ${ord[i]}:`, orderErr);
          return NextResponse.json(
            { error: `Failed to set display order for media ${ord[i]}` },
            { status: 500 }
          );
        }
      }
    }

    // --- Re-read canonical order after writes ---
    const { data: updatedRows, error: rereadError } = await adminClient
      .from('property_media')
      .select('id, media_url, media_type, display_order, is_primary')
      .eq('property_id', propertyId)
      .eq('media_type', 'image');

    if (rereadError) {
      console.error('media/reorder: failed to re-read property_media:', rereadError);
      return NextResponse.json({ error: 'Failed to re-read property media' }, { status: 500 });
    }

    const updated = sortCanonical(updatedRows || []);
    const primaryRow = updated.find((m) => m.is_primary) || null;

    // ================= WRITE properties.images[] LAST (preserve-and-reorder, Amendment A) =================
    // PRESERVE every current images[] member — never drop an orphan URL. Only change order:
    //   - shared URLs (those with a property_media row) go primary-first in the asserted order;
    //   - orphan URLs (no property_media row) keep their existing relative order, after the shared set.
    // Prepend the chosen primary only if it is not already in images[] (the one intended addition).
    // Never re-inflate from property_media dupes; never overwrite a populated array with an empty one.
    // Edge Case 1: when images[] is empty, skip entirely — the public detail gallery falls back to
    // property_media, which we just reordered, so "set as primary" still reflects publicly.
    const currentImages: string[] = Array.isArray(property.images) ? property.images : [];
    let syncedImages = currentImages;

    if (currentImages.length > 0) {
      const currentSet = new Set(currentImages);
      const mediaUrlSet = new Set(updated.map((m) => m.media_url));

      const sharedOrdered = updated
        .map((m) => m.media_url)
        .filter((url) => currentSet.has(url)); // shared members, primary-first asserted order
      const orphans = currentImages.filter((url) => !mediaUrlSet.has(url)); // images[]-only, order kept

      const seen = new Set<string>();
      const ordered: string[] = [];
      const push = (url: string) => {
        if (!seen.has(url)) {
          seen.add(url);
          ordered.push(url);
        }
      };
      if (primaryRow && !currentSet.has(primaryRow.media_url)) push(primaryRow.media_url);
      for (const url of sharedOrdered) push(url);
      for (const url of orphans) push(url);

      // Anti-blank guard: never overwrite a populated array with an empty one.
      if (ordered.length > 0) {
        const { error: imgErr } = await adminClient
          .from('properties')
          .update({ images: ordered, updated_at: new Date().toISOString() })
          .eq('id', propertyId);
        if (imgErr) {
          console.error('media/reorder: failed to sync properties.images:', imgErr);
          return NextResponse.json({ error: 'Failed to sync public gallery' }, { status: 500 });
        }
        syncedImages = ordered;
      }
    }

    return NextResponse.json({
      success: true,
      primaryMediaId: primaryRow?.id ?? null,
      media: updated.map((m) => ({
        id: m.id,
        media_url: m.media_url,
        display_order: m.display_order,
        is_primary: !!m.is_primary,
      })),
      images: syncedImages,
    });
  } catch (error) {
    console.error('media/reorder error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
