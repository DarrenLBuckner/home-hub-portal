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

  if (typeof body.featured !== 'boolean') {
    return NextResponse.json(
      { error: 'Body must include featured: boolean' },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  // Gate on approved status — cannot feature a pending/rejected row.
  const { data: current } = await supabase
    .from('service_providers')
    .select('status')
    .eq('id', id)
    .single();

  if (!current) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if ((current as any).status !== 'active') {
    return NextResponse.json(
      { error: 'Only approved providers can be featured' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('service_providers')
    .update({ featured: body.featured })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Service provider feature error:', error);
    return NextResponse.json({ error: 'Feature toggle failed' }, { status: 500 });
  }

  return NextResponse.json({ provider: data });
}
