import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { requireAdmin, type AdminContext } from '../../service-providers/_auth';

// Mutations on leads are limited to super/owner admins (not basic, which is
// view-only). Returns null on success, or a NextResponse to short-circuit.
function requireMutator(ctx: AdminContext): NextResponse | null {
  if (ctx.adminLevel === 'basic') {
    return NextResponse.json({ error: 'Admin mutation requires super or owner level.' }, { status: 403 });
  }
  return null;
}

// PATCH /api/admin/listing-inquiries/[id]
// Body: { released_to_agent?: boolean, admin_note?: string, restore?: boolean }
//  - released_to_agent: show (true) / hide (false) the lead from the agent.
//  - restore: clear a previous soft-delete.
//  - admin_note: internal note.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(request);
  if (ctx instanceof NextResponse) return ctx;
  const blocked = requireMutator(ctx);
  if (blocked) return blocked;

  const { id } = await params;
  let body: { released_to_agent?: boolean; admin_note?: string; restore?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { updated_at: now };

  if (typeof body.released_to_agent === 'boolean') {
    patch.released_to_agent = body.released_to_agent;
    patch.released_at = body.released_to_agent ? now : null;
    patch.released_by = body.released_to_agent ? ctx.userId : null;
  }
  if (typeof body.admin_note === 'string') {
    patch.admin_note = body.admin_note;
  }
  if (body.restore === true) {
    patch.deleted_at = null;
    patch.deleted_by = null;
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: 'No supported fields to update' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('listing_inquiries')
    .update(patch)
    .eq('id', id)
    .select('id')
    .single();

  if (error || !data) {
    console.error('Admin listing-inquiry PATCH error:', error);
    return NextResponse.json({ error: 'Lead not found or update failed' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id: data.id });
}

// DELETE /api/admin/listing-inquiries/[id] — soft-delete (recoverable).
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireAdmin(request);
  if (ctx instanceof NextResponse) return ctx;
  const blocked = requireMutator(ctx);
  if (blocked) return blocked;

  const { id } = await params;
  const now = new Date().toISOString();

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('listing_inquiries')
    .update({ deleted_at: now, deleted_by: ctx.userId, updated_at: now })
    .eq('id', id)
    .select('id')
    .single();

  if (error || !data) {
    console.error('Admin listing-inquiry DELETE error:', error);
    return NextResponse.json({ error: 'Lead not found or delete failed' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
