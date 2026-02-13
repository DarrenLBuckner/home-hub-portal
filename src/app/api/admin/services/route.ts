import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const supabaseBackend = createServiceRoleClient();
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Admin API endpoints for services management
 * Only accessible by Super Admin, Owner Admin, and Admin users
 * 
 * GET /api/admin/services - Get all services
 * POST /api/admin/services - Create a new service
 */

async function getAuthenticatedUser() {
  try {
    const cookieStore = cookies();
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

    // Get user profile with role
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
    const authData = await getAuthenticatedUser();
    if (!authData || !isAuthorizedAdmin(authData.userType)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get('country');

    let query = supabaseBackend
      .from('services')
      .select(`
        *,
        country_services (
          id,
          country_code,
          country_name,
          is_available,
          local_price,
          local_currency,
          local_description,
          contact_email,
          contact_phone,
          booking_url,
          featured_image,
          gallery_images,
          additional_info
        )
      `)
      .order('sort_order', { ascending: true });

    if (countryCode) {
      query = query.eq('country_services.country_code', countryCode.toUpperCase());
    }

    const { data: services, error } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      services: services || [],
      totalCount: services?.length || 0
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authData = await getAuthenticatedUser();
    if (!authData || !isAuthorizedAdmin(authData.userType)) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      shortDescription,
      icon,
      category,
      serviceType = 'free',
      basePrice,
      currency = 'USD',
      isActive = true,
      sortOrder = 0
    } = body;

    // Validation
    if (!name || !slug || !description || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, description, category' },
        { status: 400 }
      );
    }

    // Create service  
    const { data: service, error: serviceError } = await supabaseBackend
      .from('services')
      .insert({
        name,
        slug,
        description,
        short_description: shortDescription,
        icon,
        category,
        service_type: serviceType,
        base_price: serviceType === 'free' ? 0 : basePrice,
        currency,
        is_active: isActive,
        sort_order: sortOrder
      })
      .select()
      .single();

    if (serviceError) {
      console.error('Error creating service:', serviceError);
      return NextResponse.json(
        { error: 'Failed to create service' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      service,
      message: 'Service created successfully'
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}