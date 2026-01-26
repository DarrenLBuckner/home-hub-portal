import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Admin Training Videos Management API
 * GET /api/admin/training-videos - List all training videos (admin only)
 * POST /api/admin/training-videos - Create new training video (admin only)
 */

async function getAuthenticatedAdmin() {
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

    const userType = profile?.user_type;
    const isAdmin = userType && ['admin', 'super', 'superadmin'].includes(userType);

    if (!isAdmin) return null;

    return { user, userType, supabase };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('user_type');
    const country = searchParams.get('country');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = auth.supabase
      .from('training_videos')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (userType && userType !== 'all') {
      query = query.contains('target_user_types', [userType]);
    }

    if (country && country !== 'all') {
      // Match specific country OR 'ALL'
      query = query.or(`target_countries.cs.{${country}},target_countries.cs.{ALL}`);
    }

    if (isActive !== null && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: videos, error } = await query;

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
    console.error('Error in training videos GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.video_url?.trim()) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Validate YouTube URL format
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    if (!youtubeRegex.test(body.video_url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format' },
        { status: 400 }
      );
    }

    // Prepare video data
    const videoData = {
      title: body.title.trim(),
      description: body.description?.trim() || null,
      video_url: body.video_url.trim(),
      thumbnail_url: body.thumbnail_url?.trim() || null,
      target_user_types: body.target_user_types || ['agent', 'landlord', 'fsbo'],
      target_countries: body.target_countries || ['ALL'],
      display_order: typeof body.display_order === 'number' ? body.display_order : 0,
      is_active: body.is_active !== false, // Default to true
      created_by: auth.user.id
    };

    const { data: video, error } = await auth.supabase
      .from('training_videos')
      .insert(videoData)
      .select()
      .single();

    if (error) {
      console.error('Error creating training video:', error);
      return NextResponse.json(
        { error: 'Failed to create training video' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      video,
      message: 'Training video created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in training videos POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
