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

export async function GET(request: NextRequest) {
  try {
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Verify admin status
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, user_type, admin_level, country_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!['super', 'owner', 'basic'].includes(profile.admin_level)) {
      return NextResponse.json({ error: 'Insufficient admin level' }, { status: 403 });
    }

    // Query all non-admin users
    let usersQuery = serviceClient
      .from('profiles')
      .select(`
        id,
        account_code,
        email,
        first_name,
        last_name,
        display_name,
        user_type,
        country_id,
        subscription_status,
        is_suspended,
        suspended_at,
        suspension_reason,
        suspended_by,
        created_at,
        phone,
        company
      `)
      .in('user_type', ['agent', 'landlord', 'owner', 'fsbo'])
      .neq('id', user.id)
      .order('created_at', { ascending: false });

    // Country scoping for non-super admins
    if (profile.admin_level !== 'super' && profile.country_id) {
      usersQuery = usersQuery.eq('country_id', profile.country_id);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get property counts for all users in one batch query
    const userIds = (users || []).map(u => u.id);
    const propertyCountMap: Record<string, number> = {};

    if (userIds.length > 0) {
      const { data: properties } = await serviceClient
        .from('properties')
        .select('user_id')
        .in('user_id', userIds);

      for (const prop of properties || []) {
        propertyCountMap[prop.user_id] = (propertyCountMap[prop.user_id] || 0) + 1;
      }
    }

    // Enrich users with property counts
    const enrichedUsers = (users || []).map(u => ({
      ...u,
      property_count: propertyCountMap[u.id] || 0,
    }));

    return NextResponse.json({
      users: enrichedUsers,
      adminLevel: profile.admin_level,
    });
  } catch (error) {
    console.error('Error in admin users API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
