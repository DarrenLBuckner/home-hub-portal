import { NextRequest, NextResponse } from 'next/server';
import { supabaseBackend } from '@/lib/supabase-backend';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin Advertisers Management API
 * GET /api/admin/advertising/advertisers - Get all advertisers
 * POST /api/admin/advertising/advertisers - Create new advertiser (admin only)
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
    const businessType = searchParams.get('business_type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseBackend
      .from('advertisers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (country && country !== 'all') {
      query = query.eq('country_code', country);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (businessType) {
      query = query.eq('business_type', businessType);
    }

    const { data: advertisers, count, error } = await query;

    if (error) {
      console.error('Error fetching advertisers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch advertisers' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      advertisers: advertisers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in advertisers API:', error);
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
    const requiredFields = ['company_name', 'contact_name', 'email', 'business_type', 'country_code'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create advertiser
    const { data: advertiser, error } = await supabaseBackend
      .from('advertisers')
      .insert({
        company_name: body.company_name,
        contact_name: body.contact_name,
        email: body.email,
        phone: body.phone,
        website: body.website,
        business_type: body.business_type,
        street_address: body.street_address,
        city: body.city,
        state_province: body.state_province,
        postal_code: body.postal_code,
        country_code: body.country_code,
        status: body.status || 'pending',
        is_verified: body.is_verified || false,
        billing_email: body.billing_email,
        tax_id: body.tax_id,
        approved_by: auth.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating advertiser:', error);
      return NextResponse.json(
        { error: 'Failed to create advertiser' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      advertiser,
      message: 'Advertiser created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in advertisers POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}