// Admin API endpoint for listing all properties (uses service role to bypass RLS)
// GET /api/admin/properties - List properties for admin review
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getCountryAwareAdminPermissions } from '@/lib/auth/adminPermissions';
import { createAdminClient } from '@/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Authenticate the user with anon key
    const anonSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
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

    // Use service role client for all data queries (bypasses RLS)
    const adminSupabase = createAdminClient();

    // Get user profile to verify admin status
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('user_type, admin_level, country_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if ((profile as any).user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get admin permissions with country context
    const permissions = await getCountryAwareAdminPermissions(
      (profile as any).user_type,
      user.email || '',
      (profile as any).admin_level || null,
      user.id,
      adminSupabase
    );

    // Parse query params for optional filtering
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status'); // e.g. 'pending', 'active', 'all'

    // Build query using service role (bypasses RLS)
    let propertiesQuery = adminSupabase
      .from('properties')
      .select(`
        *,
        owner:profiles!user_id (
          id,
          email,
          first_name,
          last_name,
          user_type
        ),
        property_media!property_media_property_id_fkey (
          media_url,
          is_primary,
          media_type
        )
      `)
      .order('created_at', { ascending: false });

    // Apply status filter if provided (and not 'all')
    if (statusFilter && statusFilter !== 'all') {
      propertiesQuery = propertiesQuery.eq('status', statusFilter);
    }

    // Apply country filter for non-super admins
    if (!permissions.canViewAllCountries && permissions.countryFilter) {
      propertiesQuery = propertiesQuery.eq('country_id', permissions.countryFilter);
    }

    const { data: properties, error: propertiesError } = await propertiesQuery;

    if (propertiesError) {
      console.error('Admin properties query error:', propertiesError);
      return NextResponse.json({ error: 'Failed to load properties' }, { status: 500 });
    }

    // Also fetch statistics
    let statsQuery = adminSupabase
      .from('properties')
      .select('status, created_at, listed_by_type, listing_type');

    if (!permissions.canViewAllCountries && permissions.countryFilter) {
      statsQuery = statsQuery.eq('country_id', permissions.countryFilter);
    }

    const { data: allProps } = await statsQuery;

    const today = new Date().toISOString().split('T')[0];
    const statistics = {
      totalPending: allProps?.filter((p: any) => p.status === 'pending').length || 0,
      todaySubmissions: allProps?.filter((p: any) => p.created_at?.startsWith(today)).length || 0,
      totalActive: allProps?.filter((p: any) => p.status === 'active').length || 0,
      totalRejected: allProps?.filter((p: any) => p.status === 'rejected').length || 0,
      totalDrafts: allProps?.filter((p: any) => p.status === 'draft').length || 0,
      totalRentals: allProps?.filter((p: any) => p.listing_type === 'rental').length || 0,
      activeRentals: allProps?.filter((p: any) => p.status === 'active' && p.listing_type === 'rental').length || 0,
      byUserType: {
        fsbo: allProps?.filter((p: any) => p.listed_by_type === 'owner').length || 0,
        agent: allProps?.filter((p: any) => p.listed_by_type === 'agent').length || 0,
        landlord: allProps?.filter((p: any) => p.listed_by_type === 'landlord').length || 0,
      },
    };

    return NextResponse.json({
      success: true,
      properties: properties || [],
      statistics,
      permissions: {
        canApproveProperties: permissions.canApproveProperties,
        canRejectProperties: permissions.canRejectProperties,
        canViewAllCountries: permissions.canViewAllCountries,
        countryFilter: permissions.countryFilter,
        assignedCountryName: permissions.assignedCountryName,
      },
    });

  } catch (error) {
    console.error('Admin properties API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
