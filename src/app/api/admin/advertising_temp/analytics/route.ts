import { NextRequest, NextResponse } from 'next/server';
import { supabaseBackend } from '@/lib/supabase-backend';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Advertising Analytics API
 * GET /api/admin/advertising/analytics - Get analytics data for advertising dashboard
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

    // Build country filter for analytics
    let countryFilter = '';
    if (country && country !== 'all') {
      countryFilter = `country_code.eq.${country}`;
    }

    // Get aggregated impression data
    let impressionsQuery = supabaseBackend
      .from('ad_impressions')
      .select('id, was_clicked, cost_charged, advertiser_id, campaign_id');

    if (countryFilter) {
      impressionsQuery = impressionsQuery.filter('country_code', 'eq', country);
    }

    const { data: impressions, error: impressionsError } = await impressionsQuery;

    if (impressionsError) {
      console.error('Error fetching impressions:', impressionsError);
      // Return default analytics if no impressions data exists yet
      return NextResponse.json({
        analytics: {
          totalImpressions: 0,
          totalClicks: 0,
          totalRevenue: 0,
          activeCampaigns: 0,
          activeAdvertisers: 0,
          clickThroughRate: 0
        }
      });
    }

    // Calculate analytics
    const totalImpressions = impressions?.length || 0;
    const totalClicks = impressions?.filter(imp => imp.was_clicked).length || 0;
    const totalRevenue = impressions?.reduce((sum, imp) => sum + (imp.cost_charged || 0), 0) || 0;
    const clickThroughRate = totalImpressions > 0 ? totalClicks / totalImpressions : 0;

    // Get active campaigns count
    let campaignsQuery = supabaseBackend
      .from('ad_campaigns')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
      .eq('status', 'active');

    if (country && country !== 'all') {
      campaignsQuery = campaignsQuery.contains('target_countries', [country]);
    }

    const { count: activeCampaigns, error: campaignsError } = await campaignsQuery;

    if (campaignsError) {
      console.error('Error fetching active campaigns:', campaignsError);
    }

    // Get active advertisers count
    let advertisersQuery = supabaseBackend
      .from('advertisers')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    if (country && country !== 'all') {
      advertisersQuery = advertisersQuery.eq('country_code', country);
    }

    const { count: activeAdvertisers, error: advertisersError } = await advertisersQuery;

    if (advertisersError) {
      console.error('Error fetching active advertisers:', advertisersError);
    }

    return NextResponse.json({
      analytics: {
        totalImpressions,
        totalClicks,
        totalRevenue,
        activeCampaigns: activeCampaigns || 0,
        activeAdvertisers: activeAdvertisers || 0,
        clickThroughRate
      }
    });

  } catch (error) {
    console.error('Error in advertising analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}