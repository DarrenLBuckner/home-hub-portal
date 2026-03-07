import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const createAuthClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
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
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate caller
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Verify caller is an admin
    const { data: callerProfile } = await serviceClient
      .from('profiles')
      .select('user_type, admin_level')
      .eq('id', user.id)
      .single();

    if (!callerProfile || callerProfile.user_type !== 'admin' ||
        !['super', 'owner', 'basic'].includes(callerProfile.admin_level)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Fetch target user profile using service role (bypasses RLS)
    const { data: targetProfile, error: targetError } = await serviceClient
      .from('profiles')
      .select('id, email, phone, first_name, last_name, user_type, country_id')
      .eq('id', id)
      .single();

    if (targetError || !targetProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(targetProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
