import { NextRequest, NextResponse } from 'next/server';
import { supabaseBackend } from '@/lib/supabase-backend';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Advertising Overview API
 * GET /api/admin/advertising/overview - Get overview data for advertising dashboard
 */

async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    return {
      user,
      userType: profile?.user_type
    };
  } catch {
    return null;
  }
}

function isAuthorizedAdmin(userType: string | null) {
  return userType && ['admin', 'superadmin', 'owner'].includes(userType);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth || !isAuthorizedAdmin(auth.userType)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    // Base query conditions
    let advertiserFilter = {};
    let campaignFilter = {};
    let placementFilter = {};

    if (country && country !== 'all') {
      advertiserFilter = { country_code: country };
      campaignFilter = { target_countries: { contains: [country] } };
      placementFilter = { country_code: country };
    }

    // Fetch recent advertisers
    const { data: advertisers, error: advertisersError } = await supabaseBackend
      .from('advertisers')
      .select('*')
      .match(advertiserFilter)
      .order('created_at', { ascending: false })
      .limit(10);

    if (advertisersError) {
      console.error('Error fetching advertisers:', advertisersError);
      return NextResponse.json(
        { error: 'Failed to fetch advertisers' },
        { status: 500 }
      );
    }

    // Fetch recent campaigns with advertiser info
    const { data: campaigns, error: campaignsError } = await supabaseBackend
      .from('ad_campaigns')
      .select(`
        *,
        advertiser:advertisers!inner(company_name)
      `)
      .match(campaignFilter)
      .order('created_at', { ascending: false })
      .limit(10);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    // Fetch placements
    const { data: placements, error: placementsError } = await supabaseBackend
      .from('ad_placements')
      .select('*')
      .match(placementFilter)
      .order('created_at', { ascending: false });

    if (placementsError) {
      console.error('Error fetching placements:', placementsError);
      return NextResponse.json(
        { error: 'Failed to fetch placements' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      advertisers: advertisers || [],
      campaigns: campaigns || [],
      placements: placements || []
    });

  } catch (error) {
    console.error('Error in advertising overview API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}