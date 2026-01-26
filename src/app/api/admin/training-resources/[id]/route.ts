import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Admin Training Resources Management API - Single Resource Operations
 * GET /api/admin/training-resources/[id] - Get single resource
 * PATCH /api/admin/training-resources/[id] - Update resource (can replace file)
 * DELETE /api/admin/training-resources/[id] - Delete resource (soft delete by default)
 */

const ALLOWED_FILE_TYPES = ['application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
      .select('user_type, admin_level')
      .eq('id', user.id)
      .single();

    // Only super admins can manage training resources
    const isSuperAdmin = profile?.admin_level === 'super';

    if (!isSuperAdmin) return null;

    return { user, profile, supabase };
  } catch {
    return null;
  }
}

function extractStoragePath(fileUrl: string): string | null {
  try {
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/training-resources/');
    return pathParts.length > 1 ? pathParts[1] : null;
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
        { error: 'Unauthorized. Super Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const { data: resource, error } = await auth.supabase
      .from('training_resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !resource) {
      return NextResponse.json(
        { error: 'Training resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ resource });

  } catch (error) {
    console.error('Error in training resource GET API:', error);
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
        { error: 'Unauthorized. Super Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if resource exists
    const { data: existingResource, error: fetchError } = await auth.supabase
      .from('training_resources')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingResource) {
      return NextResponse.json(
        { error: 'Training resource not found' },
        { status: 404 }
      );
    }

    // Check content type to determine if it's a file upload or JSON update
    const contentType = request.headers.get('content-type') || '';

    let updateData: Record<string, unknown> = {};
    let newFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      newFile = formData.get('file') as File | null;

      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const targetUserTypes = formData.get('target_user_types') as string;
      const targetCountries = formData.get('target_countries') as string;
      const language = formData.get('language') as string;
      const category = formData.get('category') as string;
      const displayOrder = formData.get('display_order') as string;
      const isFeatured = formData.get('is_featured') as string;
      const isActive = formData.get('is_active') as string;

      if (title !== null) updateData.title = title.trim();
      if (description !== null) updateData.description = description?.trim() || null;
      if (language !== null) updateData.language = language;
      if (category !== null) updateData.category = category;
      if (displayOrder !== null) updateData.display_order = parseInt(displayOrder) || 0;
      if (isFeatured !== null) updateData.is_featured = isFeatured === 'true';
      if (isActive !== null) updateData.is_active = isActive === 'true';

      try {
        if (targetUserTypes) updateData.target_user_types = JSON.parse(targetUserTypes);
        if (targetCountries) updateData.target_countries = JSON.parse(targetCountries);
      } catch {
        // Skip if parsing fails
      }

      // Handle new file upload
      if (newFile) {
        if (!ALLOWED_FILE_TYPES.includes(newFile.type)) {
          return NextResponse.json(
            { error: 'Invalid file type. Only PDF files are allowed.' },
            { status: 400 }
          );
        }

        if (newFile.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            { error: 'File size exceeds 10MB limit' },
            { status: 400 }
          );
        }

        // Upload new file
        const timestamp = Date.now();
        const sanitizedName = newFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${timestamp}-${sanitizedName}`;

        const fileBuffer = await newFile.arrayBuffer();
        const { error: uploadError } = await auth.supabase.storage
          .from('training-resources')
          .upload(storagePath, fileBuffer, {
            contentType: newFile.type,
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
          );
        }

        // Get public URL
        const { data: { publicUrl } } = auth.supabase.storage
          .from('training-resources')
          .getPublicUrl(storagePath);

        // Delete old file
        const oldStoragePath = extractStoragePath(existingResource.file_url);
        if (oldStoragePath) {
          await auth.supabase.storage.from('training-resources').remove([oldStoragePath]);
        }

        updateData.file_url = publicUrl;
        updateData.file_name = newFile.name;
        updateData.file_size = newFile.size;
        updateData.file_type = newFile.type.split('/')[1] || 'pdf';
      }
    } else {
      // Handle JSON update
      const body = await request.json();

      if (body.title !== undefined) {
        if (!body.title?.trim()) {
          return NextResponse.json(
            { error: 'Title cannot be empty' },
            { status: 400 }
          );
        }
        updateData.title = body.title.trim();
      }

      if (body.description !== undefined) updateData.description = body.description?.trim() || null;
      if (body.target_user_types !== undefined) updateData.target_user_types = body.target_user_types;
      if (body.target_countries !== undefined) updateData.target_countries = body.target_countries;
      if (body.language !== undefined) updateData.language = body.language;
      if (body.category !== undefined) updateData.category = body.category;
      if (body.display_order !== undefined) updateData.display_order = body.display_order;
      if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
      if (body.is_active !== undefined) updateData.is_active = body.is_active;
    }

    // Perform update
    const { data: resource, error } = await auth.supabase
      .from('training_resources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating training resource:', error);
      return NextResponse.json(
        { error: 'Failed to update training resource' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      resource,
      message: 'Training resource updated successfully'
    });

  } catch (error) {
    console.error('Error in training resource PATCH API:', error);
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
        { error: 'Unauthorized. Super Admin access required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Check if resource exists
    const { data: existingResource, error: fetchError } = await auth.supabase
      .from('training_resources')
      .select('id, title, file_url')
      .eq('id', id)
      .single();

    if (fetchError || !existingResource) {
      return NextResponse.json(
        { error: 'Training resource not found' },
        { status: 404 }
      );
    }

    if (hardDelete) {
      // Delete file from storage
      const storagePath = extractStoragePath(existingResource.file_url);
      if (storagePath) {
        await auth.supabase.storage.from('training-resources').remove([storagePath]);
      }

      // Permanent delete from database
      const { error } = await auth.supabase
        .from('training_resources')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting training resource:', error);
        return NextResponse.json(
          { error: 'Failed to delete training resource' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Training resource "${existingResource.title}" permanently deleted`
      });
    } else {
      // Soft delete - set is_active to false
      const { error } = await auth.supabase
        .from('training_resources')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deactivating training resource:', error);
        return NextResponse.json(
          { error: 'Failed to deactivate training resource' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: `Training resource "${existingResource.title}" deactivated. Use ?hard=true for permanent deletion.`
      });
    }

  } catch (error) {
    console.error('Error in training resource DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
