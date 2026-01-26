import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Admin Training Resources Management API
 * GET /api/admin/training-resources - List all resources (admin only)
 * POST /api/admin/training-resources - Create new resource with file upload (admin only)
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

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedAdmin();
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized. Super Admin access required.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('user_type');
    const country = searchParams.get('country');
    const category = searchParams.get('category');
    const language = searchParams.get('language');
    const isActive = searchParams.get('is_active');

    // Build query
    let query = auth.supabase
      .from('training_resources')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (userType && userType !== 'all') {
      query = query.contains('target_user_types', [userType]);
    }

    if (country && country !== 'all') {
      query = query.or(`target_countries.cs.{${country}},target_countries.cs.{ALL}`);
    }

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (language && language !== 'all') {
      query = query.eq('language', language);
    }

    if (isActive !== null && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true');
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
    console.error('Error in training resources GET API:', error);
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
        { error: 'Unauthorized. Super Admin access required.' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const targetUserTypes = formData.get('target_user_types') as string;
    const targetCountries = formData.get('target_countries') as string;
    const language = formData.get('language') as string;
    const category = formData.get('category') as string;
    const displayOrder = formData.get('display_order') as string;
    const isFeatured = formData.get('is_featured') as string;
    const isActive = formData.get('is_active') as string;

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${timestamp}-${sanitizedName}`;

    // Upload file to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await auth.supabase.storage
      .from('training-resources')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL for the file
    const { data: { publicUrl } } = auth.supabase.storage
      .from('training-resources')
      .getPublicUrl(storagePath);

    // Parse arrays from JSON strings
    let parsedUserTypes = ['agent', 'landlord', 'fsbo'];
    let parsedCountries = ['ALL'];

    try {
      if (targetUserTypes) parsedUserTypes = JSON.parse(targetUserTypes);
      if (targetCountries) parsedCountries = JSON.parse(targetCountries);
    } catch {
      // Use defaults if parsing fails
    }

    // Prepare resource data
    const resourceData = {
      title: title.trim(),
      description: description?.trim() || null,
      file_url: publicUrl,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type.split('/')[1] || 'pdf',
      target_user_types: parsedUserTypes,
      target_countries: parsedCountries,
      language: language || 'en',
      category: category || 'guide',
      display_order: parseInt(displayOrder) || 0,
      is_featured: isFeatured === 'true',
      is_active: isActive !== 'false',
      created_by: auth.user.id
    };

    const { data: resource, error } = await auth.supabase
      .from('training_resources')
      .insert(resourceData)
      .select()
      .single();

    if (error) {
      console.error('Error creating training resource:', error);
      // Clean up uploaded file if database insert fails
      await auth.supabase.storage.from('training-resources').remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to create training resource' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      resource,
      message: 'Training resource created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in training resources POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
