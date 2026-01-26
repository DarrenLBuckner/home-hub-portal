import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Training Resources Download Tracking API
 * GET /api/training-resources/download/[id] - Track download and redirect to file
 * POST /api/training-resources/download/[id] - Track download (fire and forget, no redirect)
 *
 * Increments download_count
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get current download count
    const { data: resource, error: fetchError } = await supabase
      .from('training_resources')
      .select('id, download_count, is_active')
      .eq('id', id)
      .single();

    if (fetchError || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    if (!resource.is_active) {
      return NextResponse.json({ error: 'Resource not available' }, { status: 410 });
    }

    // Increment download count
    const { error: updateError } = await supabase
      .from('training_resources')
      .update({ download_count: (resource.download_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to increment download count:', updateError);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in download tracking API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get the resource
    const { data: resource, error: fetchError } = await supabase
      .from('training_resources')
      .select('id, file_url, file_name, download_count, is_active')
      .eq('id', id)
      .single();

    if (fetchError || !resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    if (!resource.is_active) {
      return NextResponse.json(
        { error: 'Resource is no longer available' },
        { status: 410 }
      );
    }

    // Increment download count (fire and forget - don't block redirect)
    supabase
      .from('training_resources')
      .update({ download_count: (resource.download_count || 0) + 1 })
      .eq('id', id)
      .then(() => {
        // Log success silently
      })
      .catch((err) => {
        console.error('Failed to increment download count:', err);
      });

    // Redirect to the file URL
    return NextResponse.redirect(resource.file_url, {
      status: 302,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Disposition': `attachment; filename="${resource.file_name}"`,
      },
    });

  } catch (error) {
    console.error('Error in download tracking API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
