import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from './_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const ctx = await requireAdmin(request);
  if (ctx instanceof NextResponse) return ctx;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get('status');

  const supabase = createServiceRoleClient();
  let query = supabase
    .from('service_providers')
    .select(
      'id, name, category, email, phone, description, website, address, source, status, verified, featured, approved_at, approved_by, verified_at, verified_by, rejected_at, rejected_by, rejected_reason, created_at, site_id'
    )
    .order('created_at', { ascending: false });

  if (statusFilter) {
    const statuses = statusFilter.split(',');
    query = query.in('status', statuses);
  }

  // owner_admin is scoped to their country; basic_admin sees all GY.
  // super_admin sees everything.
  if (ctx.adminLevel === 'owner' && ctx.countryId) {
    query = query.eq('site_id', ctx.countryId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Service providers list error:', error);
    return NextResponse.json({ error: 'Failed to load providers' }, { status: 500 });
  }

  return NextResponse.json({ providers: data || [] });
}
