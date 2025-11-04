import { NextRequest, NextResponse } from 'next/server';
import { supabaseBackend } from '@/lib/supabase-backend';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Campaigns Management API
 * GET /api/admin/advertising/campaigns - Get all campaigns
 * POST /api/admin/advertising/campaigns - Create new campaign (admin only)
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
    const status = searchParams.get('status');
    const advertiserId = searchParams.get('advertiser_id');
    const campaignType = searchParams.get('campaign_type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query with advertiser info
    let query = supabaseBackend
      .from('ad_campaigns')
      .select(`
        *,
        advertiser:advertisers!inner(id, company_name, email, country_code)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (country && country !== 'all') {
      query = query.contains('target_countries', [country]);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (advertiserId) {
      query = query.eq('advertiser_id', advertiserId);
    }

    if (campaignType) {
      query = query.eq('campaign_type', campaignType);
    }

    const { data: campaigns, count, error } = await query;

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json(
        { error: 'Failed to fetch campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in campaigns API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (!auth || !isAuthorizedAdmin(auth.userType)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['advertiser_id', 'name', 'campaign_type', 'start_date', 'target_countries'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Verify advertiser exists and is approved
    const { data: advertiser, error: advertiserError } = await supabaseBackend
      .from('advertisers')
      .select('id, status')
      .eq('id', body.advertiser_id)
      .single();

    if (advertiserError || !advertiser) {
      return NextResponse.json(
        { error: 'Advertiser not found' },
        { status: 404 }
      );
    }

    if (advertiser.status !== 'approved' && advertiser.status !== 'active') {
      return NextResponse.json(
        { error: 'Advertiser must be approved before creating campaigns' },
        { status: 400 }
      );
    }

    // Create campaign
    const { data: campaign, error } = await supabaseBackend
      .from('ad_campaigns')
      .insert({
        advertiser_id: body.advertiser_id,
        name: body.name,
        description: body.description,
        campaign_type: body.campaign_type,
        start_date: body.start_date,
        end_date: body.end_date,
        is_active: body.is_active !== undefined ? body.is_active : true,
        target_countries: body.target_countries,
        target_cities: body.target_cities || [],
        target_property_types: body.target_property_types || [],
        target_price_min: body.target_price_min,
        target_price_max: body.target_price_max,
        target_demographics: body.target_demographics || {},
        total_budget: body.total_budget,
        daily_budget: body.daily_budget,
        bid_amount: body.bid_amount,
        billing_model: body.billing_model || 'cpc',
        target_impressions: body.target_impressions,
        target_clicks: body.target_clicks,
        target_conversions: body.target_conversions,
        status: body.status || 'pending',
        approved_by: auth.user.id
      })
      .select(`
        *,
        advertiser:advertisers!inner(id, company_name, email, country_code)
      `)
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return NextResponse.json(
        { error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      campaign,
      message: 'Campaign created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in campaigns POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}