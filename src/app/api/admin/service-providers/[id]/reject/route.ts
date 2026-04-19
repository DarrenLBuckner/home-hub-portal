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

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (reason.length < 5) {
    return NextResponse.json(
      { error: 'Rejection reason is required (min 5 characters)' },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('service_providers')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: ctx.userId,
      rejected_reason: reason,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Service provider reject error:', error);
    return NextResponse.json({ error: 'Reject failed' }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ provider: data });
}
