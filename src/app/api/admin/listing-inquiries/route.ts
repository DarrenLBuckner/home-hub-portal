import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '../service-providers/_auth';

const LEAD_COLUMNS =
  'id, agent_id, agent_slug, type, name, phone, whatsapp, email, listing_intent, property_type, region, location, asking_price, timeline, message, referred_name, referred_contact, territory, source, status, released_to_agent, released_at, deleted_at, admin_note, created_at, updated_at';

// GET /api/admin/listing-inquiries
// Admin (any level) sees ALL leads — including held and soft-deleted — via the
// service-role client (bypasses RLS). Owner-admins are scoped to their territory;
// super-admins see everything. The page filters by status/visibility client-side.
export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (ctx instanceof NextResponse) return ctx;

  const supabase = createServiceRoleClient();
  let query = supabase
    .from('listing_inquiries')
    .select(LEAD_COLUMNS)
    .order('created_at', { ascending: false });

  // Mirror the existing admin convention: owner-admins are limited to their
  // own territory; super-admins are unrestricted.
  if (ctx.adminLevel === 'owner' && ctx.countryId) {
    query = query.eq('territory', ctx.countryId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Admin listing-inquiries fetch error:', error);
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
  }

  return NextResponse.json({ leads: data || [] });
}
