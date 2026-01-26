import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Public Training Resources API
 * GET /api/training-resources - Get active training resources for dashboard display
 *
 * Query params:
 * - user_type: 'agent' | 'landlord' | 'fsbo' | 'owner' (required)
 * - country: 'GY' | 'JM' | 'CO' etc. (optional, defaults to 'GY')
 * - category: 'guide' | 'checklist' | 'template' | 'legal' | 'marketing' (optional)
 */

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('user_type');
    const country = searchParams.get('country') || 'GY';
    const category = searchParams.get('category');

    // Validate user_type
    const validUserTypes = ['agent', 'landlord', 'fsbo', 'owner'];
    if (!userType || !validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: 'Valid user_type is required (agent, landlord, fsbo, owner)' },
        { status: 400 }
      );
    }

    // Map 'owner' to 'fsbo' for consistency
    const effectiveUserType = userType === 'owner' ? 'fsbo' : userType;

    // Build query for active resources matching user type and country
    let query = supabase
      .from('training_resources')
      .select('id, title, description, file_url, file_name, file_size, file_type, category, language, is_featured, display_order, download_count')
      .eq('is_active', true)
      .contains('target_user_types', [effectiveUserType])
      .or(`target_countries.cs.{${country}},target_countries.cs.{ALL}`)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Filter by category if specified
    if (category) {
      query = query.eq('category', category);
    }

    const { data: resources, error } = await query;

    if (error) {
      console.error('Error fetching training resources:', error);
      return NextResponse.json(
        { error: 'Failed to fetch training resources' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      resources: resources || [],
      count: resources?.length || 0
    });

  } catch (error) {
    console.error('Error in training resources public API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
