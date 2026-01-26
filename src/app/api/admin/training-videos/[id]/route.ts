import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Admin Training Videos Management API - Single Video Operations
 * GET /api/admin/training-videos/[id] - Get single video
 * PATCH /api/admin/training-videos/[id] - Update video
 * DELETE /api/admin/training-videos/[id] - Delete video (soft delete by default)
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { data: video, error } = await auth.supabase
      .from('training_videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: 'Training video not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ video });

  } catch (error) {
    console.error('Error in training video GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check if video exists
    const { data: existingVideo, error: fetchError } = await auth.supabase
      .from('training_videos')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingVideo) {
      return NextResponse.json(
        { error: 'Training video not found' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};

    if (body.title !== undefined) {
      if (!body.title?.trim()) {
        return NextResponse.json(
          { error: 'Title cannot be empty' },
          { status: 400 }
        );
      }
      updateData.title = body.title.trim();
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null;
    }

    if (body.video_url !== undefined) {
      if (!body.video_url?.trim()) {
        return NextResponse.json(
          { error: 'Video URL cannot be empty' },
          { status: 400 }
        );
      }
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubeRegex.test(body.video_url)) {
        return NextResponse.json(
          { error: 'Invalid YouTube URL format' },
          { status: 400 }
        );
      }
      updateData.video_url = body.video_url.trim();
    }

    if (body.thumbnail_url !== undefined) {
      updateData.thumbnail_url = body.thumbnail_url?.trim() || null;
    }

    if (body.target_user_types !== undefined) {
      updateData.target_user_types = body.target_user_types;
    }

    if (body.target_countries !== undefined) {
      updateData.target_countries = body.target_countries;
    }

    if (body.display_order !== undefined) {
      updateData.display_order = body.display_order;
    }

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active;
    }

    // Perform update
    const { data: video, error } = await auth.supabase
      .from('training_videos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating training video:', error);
      return NextResponse.json(
        { error: 'Failed to update training video' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      video,
      message: 'Training video updated successfully'
    });

  } catch (error) {
    console.error('Error in training video PATCH API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Check if video exists
    const { data: existingVideo, error: fetchError } = await auth.supabase
      .from('training_videos')
      .select('id, title')
      .eq('id', id)
      .single();

    if (fetchError || !existingVideo) {
      return NextResponse.json(
        { error: 'Training video not found' },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Permanent delete
      const { error } = await auth.supabase
        .from('training_videos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting training video:', error);
        return NextResponse.json(
          { error: 'Failed to delete training video' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Training video "${existingVideo.title}" permanently deleted`
      });
    } else {
      // Soft delete - set is_active to false
      const { error } = await auth.supabase
        .from('training_videos')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deactivating training video:', error);
        return NextResponse.json(
          { error: 'Failed to deactivate training video' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Training video "${existingVideo.title}" deactivated. Use ?hard=true for permanent deletion.`
      });
    }

  } catch (error) {
    console.error('Error in training video DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
