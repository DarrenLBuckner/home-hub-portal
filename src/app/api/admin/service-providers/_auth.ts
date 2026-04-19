import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/server';

export interface AdminContext {
  userId: string;
  adminLevel: 'super' | 'owner' | 'basic';
  countryId: string | null;
}

/**
 * Verify the caller is an admin (user_type='admin' AND admin_level ∈ {super,owner,basic}).
 * Returns AdminContext on success, or a NextResponse with 401/403 on failure.
 */
export async function requireAdmin(
  _request: NextRequest
): Promise<AdminContext | NextResponse> {
  const cookieStore = await cookies();

  const anonSupabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
    error: userErr,
  } = await anonSupabase.auth.getUser();

  if (userErr || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceSupabase = createServiceRoleClient();
  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('user_type, admin_level, country_id')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as any).user_type !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  const level = (profile as any).admin_level;
  if (!['super', 'owner', 'basic'].includes(level)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  return {
    userId: user.id,
    adminLevel: level,
    countryId: (profile as any).country_id || null,
  };
}
