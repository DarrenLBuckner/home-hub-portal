import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please use JPG, PNG, or WebP' 
      }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB' 
      }, { status: 400 });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile-${user.id}-${timestamp}.${fileExtension}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Log authentication status for debugging
    console.log('User authenticated:', !!user, user?.id);
    console.log('Attempting upload for file:', fileName);
    
    // Create service client for storage operations (to bypass RLS)
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Upload to Supabase Storage using service client
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from('property-images') // Using existing bucket
      .upload(`profiles/${fileName}`, buffer, {
        contentType: file.type,
        upsert: true, // Replace if exists
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      
      // Provide more specific error information
      let errorMessage = 'Upload failed: ' + uploadError.message;
      
      if (uploadError.message.includes('unauthorized')) {
        errorMessage = 'Storage access denied. Please check permissions.';
      } else if (uploadError.message.includes('not found')) {
        errorMessage = 'Storage bucket not found or not accessible.';
      } else if (uploadError.message.includes('payload too large')) {
        errorMessage = 'File too large. Please use a smaller image.';
      }
      
      return NextResponse.json({ 
        error: errorMessage 
      }, { status: 500 });
    }

    // Get public URL
    const { data: publicData } = serviceSupabase.storage
      .from('property-images')
      .getPublicUrl(`profiles/${fileName}`);

    const publicUrl = publicData.publicUrl;

    // Verify the upload was successful by checking if we can get the public URL
    if (!publicUrl) {
      return NextResponse.json({ 
        error: 'Failed to generate public URL' 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      url: publicUrl,
      fileName: fileName,
      originalName: file.name,
      size: file.size,
      type: file.type
    });

  } catch (error) {
    console.error('Profile image upload error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');

    if (!fileName) {
      return NextResponse.json({ error: 'File name required' }, { status: 400 });
    }

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Create service client for storage operations
    const serviceSupabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Delete from Supabase Storage
    const { error: deleteError } = await serviceSupabase.storage
      .from('property-images')
      .remove([`profiles/${fileName}`]);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete file: ' + deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Profile image delete error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}