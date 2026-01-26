import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Public Training Videos API
 * GET /api/training-videos - Get active training videos for dashboard display
 *
 * Query params:
 * - user_type: 'agent' | 'landlord' | 'fsbo' (required)
 * - country: 'GY' | 'JM' | 'CO' etc. (optional, defaults to 'GY')
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

    // Validate user_type
    const validUserTypes = ['agent', 'landlord', 'fsbo', 'owner'];
    if (!userType || !validUserTypes.includes(userType)) {
      return NextResponse.json(
        { error: 'Valid user_type is required (agent, landlord, fsbo, owner)' },
        { status: 400 }
      );
    }

    // Map 'owner' to 'fsbo' for consistency (they see the same videos)
    const effectiveUserType = userType === 'owner' ? 'fsbo' : userType;

    // Query active videos that target this user type and country
    // Uses array contains (@>) operator for targeting
    const { data: videos, error } = await supabase
      .from('training_videos')
      .select('id, title, description, video_url, thumbnail_url, display_order')
      .eq('is_active', true)
      .contains('target_user_types', [effectiveUserType])
      .or(`target_countries.cs.{${country}},target_countries.cs.{ALL}`)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching training videos:', error);
      return NextResponse.json(
        { error: 'Failed to fetch training videos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      videos: videos || [],
      count: videos?.length || 0
    });

  } catch (error) {
    console.error('Error in training videos public API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
