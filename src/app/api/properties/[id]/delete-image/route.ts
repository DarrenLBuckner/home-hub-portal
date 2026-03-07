import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/supabase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== 'string') {
      return NextResponse.json({ error: 'imageUrl is required' }, { status: 400 });
    }

    // Authenticate caller
    const cookieStore = await cookies();
    const authClient = createServerClient(
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

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient() as any;

    // Check caller's profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('user_type, admin_level')
      .eq('id', user.id)
      .single();

    // Get property
    const { data: property, error: propError } = await adminClient
      .from('properties')
      .select('images, user_id')
      .eq('id', id)
      .single();

    if (propError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Authorization: property owner or admin
    const isOwner = property.user_id === user.id;
    const isAdmin = profile?.user_type === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Remove from images array
    const currentImages: string[] = property.images || [];
    const removedIndex = currentImages.indexOf(imageUrl);

    if (removedIndex === -1) {
      return NextResponse.json({ error: 'Image not found in property' }, { status: 404 });
    }

    const updatedImages = currentImages.filter((img: string) => img !== imageUrl);

    // Update the database
    const { error: updateError } = await adminClient
      .from('properties')
      .update({ images: updatedImages, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (updateError) {
      console.error('Failed to update property images:', updateError);
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
    }

    // Try to delete from Supabase storage (best effort — don't fail if storage delete fails)
    try {
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/property-images\/(.+)/);
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1]);
        await adminClient.storage.from('property-images').remove([filePath]);
      }
    } catch (storageErr) {
      console.warn('Storage deletion failed (non-critical):', storageErr);
    }

    return NextResponse.json({
      success: true,
      images: updatedImages,
      coverChanged: removedIndex === 0 && updatedImages.length > 0,
    });
  } catch (error) {
    console.error('Image deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
