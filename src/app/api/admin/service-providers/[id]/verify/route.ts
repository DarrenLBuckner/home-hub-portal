import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin } from '../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(request);
  if (ctx instanceof NextResponse) return ctx;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Fetch current state to decide whether to also set approve fields.
  const { data: current, error: readErr } = await supabase
    .from('service_providers')
    .select('status, approved_at')
    .eq('id', id)
    .single();

  if (readErr || !current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    verified: true,
    verified_at: now,
    verified_by: ctx.userId,
  };

  // If still pending, verify implies approve too.
  if ((current as any).status !== 'active') {
    updates.status = 'active';
    if (!(current as any).approved_at) {
      updates.approved_at = now;
      updates.approved_by = ctx.userId;
    }
  }

  const { data, error } = await supabase
    .from('service_providers')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Service provider verify error:', error);
    return NextResponse.json({ error: 'Verify failed' }, { status: 500 });
  }

  return NextResponse.json({ provider: data });
}
