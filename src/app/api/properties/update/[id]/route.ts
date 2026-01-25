export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { getCountryAwareAdminPermissions } from '@/lib/auth/adminPermissions';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const propertyId = params.id;
    const body = await request.json();
    
    // Validate only essential required fields for updates (much more lenient than create)
    // Since this property already exists, we only enforce what's truly required
    const required = [
      "title", "price"  // Only the fields marked as required in the edit form
    ];
    
    for (const field of required) {
      if (!body[field] && body[field] !== 0) {  // Allow 0 as valid value for price
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    // Prepare update data - handle all fields gracefully (allow empty/null values)
    const updateData: Record<string, any> = {
      // Step 1 - Basic Info (only title and price truly required)
      title: body.title,
      description: body.description || '',
      price: parseInt(body.price) || 0,
      property_type: body.property_type || 'House',
      
      // Step 2 - Property Details (all optional for updates)
      bedrooms: body.bedrooms ? parseInt(body.bedrooms) : null,
      bathrooms: body.bathrooms ? parseInt(body.bathrooms) : null,
      house_size_value: body.house_size_value ? parseInt(body.house_size_value) : null,
      house_size_unit: body.house_size_unit || 'sq ft',
      land_size_value: body.land_size_na ? null : (body.land_size_value ? parseInt(body.land_size_value) : null),
      land_size_unit: body.land_size_unit || 'sq ft',
      land_size_na: body.land_size_na || false,
      year_built: body.year_built ? parseInt(body.year_built) : null,
      amenities: body.amenities || [],
      lot_length: body.lot_length ? parseFloat(body.lot_length) : null,
      lot_width: body.lot_width ? parseFloat(body.lot_width) : null,
      lot_dimension_unit: body.lot_dimension_unit || 'ft',
      
      // Step 3 - Location (FIX: Include all location fields properly)
      location: body.location || body.country || 'GY',
      country: body.country || body.location || 'GY',
      region: body.region || '',
      city: body.city || null,
      neighborhood: body.neighborhood || null,
      site_id: body.site_id || (body.country === 'JM' ? 'jamaica' : 'guyana'),
      
      // Step 4 - Currency
      currency: body.currency || 'GYD',
      
      // Step 5 - Contact (optional for agent properties)
      owner_email: body.owner_email || null,
      owner_whatsapp: normalizePhoneNumber(body.owner_whatsapp),
    };

    // Handle image uploads if provided
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      console.log(`📸 Processing ${body.images.length} new images for property update`);
      console.log('Image data format check:', body.images.map((img: any) => ({ 
        name: img?.name, 
        hasData: !!img?.data,
        dataType: typeof img?.data 
      })));
      
      try {
        // Delete existing property media
        const { error: deleteError } = await supabase
          .from('property_media')
          .delete()
          .eq('property_id', propertyId);
          
        if (deleteError) {
          console.warn('Warning: Could not delete existing media:', deleteError);
        }

        // Upload new images to Supabase storage and create media records
        for (let i = 0; i < body.images.length; i++) {
          const imageFile = body.images[i];
          
          if (imageFile && typeof imageFile === 'object' && imageFile.name) {
            // Convert base64 to file if needed
            let fileBuffer;
            if (imageFile.data && typeof imageFile.data === 'string') {
              // Handle base64 data
              const base64Data = imageFile.data.replace(/^data:image\/[a-z]+;base64,/, '');
              fileBuffer = Buffer.from(base64Data, 'base64');
            } else {
              console.warn(`Image ${i} missing data, skipping`);
              continue;
            }

            // Upload to Supabase storage
            const fileName = `${propertyId}/${Date.now()}_${imageFile.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('property-images')
              .upload(fileName, fileBuffer, {
                contentType: imageFile.type || 'image/jpeg'
              });

            if (uploadError) {
              console.error('Image upload error:', uploadError);
              continue;
            }

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('property-images')
              .getPublicUrl(fileName);

            // Save media record to property_media table
            const { error: mediaError } = await supabase
              .from('property_media')
              .insert({
                property_id: propertyId,
                media_url: publicUrl,
                media_type: 'image',
                display_order: i,
                is_primary: i === 0
              });

            if (mediaError) {
              console.error('Media record error:', mediaError);
            } else {
              console.log(`✅ Image ${i + 1} uploaded and saved`);
            }
          }
        }
      } catch (imageError) {
        console.error('Image processing error:', imageError);
        // Don't fail the entire update for image errors
      }
    }

    // Get current property to preserve status
    const { data: currentProperty, error: fetchError } = await supabase
      .from("properties")
      .select('status')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !currentProperty) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Preserve current status - don't send active properties back to pending
    updateData.status = currentProperty.status;
    updateData.updated_at = new Date().toISOString();

    // Update property in properties table
    const { data: propertyResult, error: dbError } = await supabase
      .from("properties")
      .update(updateData)
      .eq('id', propertyId)
      .eq('user_id', user.id) // Ensure user owns this property
      .select('id, status')
      .single();
      
    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: dbError.message || "Database error" }, { status: 500 });
    }

    if (!propertyResult) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    const statusMessage = propertyResult.status === 'active' 
      ? 'Property updated successfully! Your listing remains live on the site.' 
      : propertyResult.status === 'pending'
      ? 'Property updated successfully! Changes are pending admin approval.'
      : 'Property updated successfully!';

    return NextResponse.json({ 
      success: true, 
      propertyId: propertyResult.id,
      status: propertyResult.status,
      message: statusMessage
    });
    
  } catch (err: any) {
    console.error("API error:", err);
    return NextResponse.json({ error: err?.message || "Unknown error" }, { status: 500 });
  }
}

// POST /api/properties/update/[id] - Admin property status update
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Use the same auth pattern as the working create property API
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    const adminSupabase = createAdminClient();
    const propertyId = params.id;
    const body = await request.json();
    
    // Property approval request
    console.log('✅ Processing approval for property ID:', propertyId);
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    console.log('✅ User authenticated for approval:', user.email);

    // Get user profile and admin permissions using admin client
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('user_type, admin_level, country_id')
      .eq('id', user.id)
      .single()
    
    type ProfileType = {
      user_type: string;
      admin_level: string | null;
      country_id: string | null;
    }

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check if user has admin privileges
    if ((profile as ProfileType).user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 })
    }

    // Get admin permissions
    const permissions = await getCountryAwareAdminPermissions(
      (profile as ProfileType).user_type,
      user.email || '',
      (profile as ProfileType).admin_level,
      user.id,
      adminSupabase
    )

    // Check property approval permissions
    if (!permissions.canApproveProperties && body.status === 'active') {
      return NextResponse.json({ error: 'No permission to approve properties' }, { status: 403 })
    }

    if (!permissions.canRejectProperties && body.status === 'rejected') {
      return NextResponse.json({ error: 'No permission to reject properties' }, { status: 403 })
    }

    // Get the property to check permissions
    const { data: property, error: propertyError } = await adminSupabase
      .from('properties')
      .select('id, country_id, status')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      console.error('❌ Property not found:', propertyError?.message);
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check country access for non-super admins
    if (!permissions.canViewAllCountries && permissions.countryFilter && 
        (property as any).country_id !== permissions.countryFilter) {
      return NextResponse.json({ error: 'No access to properties from this country' }, { status: 403 })
    }

    // Prepare update data
    const updateData: {
      status: string;
      updated_at: string;
      rejection_reason?: string;
      reviewed_by?: string;
      reviewed_at?: string;
    } = {
      status: body.status,
      updated_at: new Date().toISOString()
    }

    // Add rejection reason if provided
    if (body.status === 'rejected' && body.rejection_reason) {
      updateData.rejection_reason = body.rejection_reason
    }

    // Add admin who processed this
    if (body.status === 'active' || body.status === 'rejected') {
      updateData.reviewed_by = user.id
      updateData.reviewed_at = new Date().toISOString()
    }

    // Update property status using service role client
    const { data: updatedProperty, error: updateError } = await adminSupabase
      .from('properties')
      // @ts-ignore - TypeScript has issues with Supabase update types in this configuration
      .update(updateData)
      .eq('id', propertyId)
      .select()
      .single()

    if (updateError) {
      console.error('Property status update error:', updateError)
      return NextResponse.json({ error: 'Failed to update property status' }, { status: 500 })
    }

    // Send notification email to property owner
    try {
      // Get property owner details with site_id for correct domain
      const { data: propertyWithOwner, error: ownerError } = await adminSupabase
        .from('properties')
        .select(`
          id, title, owner_email, user_id, site_id,
          owner:profiles!user_id (
            email, first_name, last_name
          )
        `)
        .eq('id', propertyId)
        .single();

      if (!ownerError && propertyWithOwner) {
        // Determine owner email and name
        const ownerEmail = propertyWithOwner.owner_email || propertyWithOwner.owner?.email;
        const ownerName = propertyWithOwner.owner
          ? `${propertyWithOwner.owner.first_name || ''} ${propertyWithOwner.owner.last_name || ''}`.trim()
          : 'Property Owner';

        if (ownerEmail && propertyWithOwner.title) {
          // Import and send appropriate email
          const { sendPropertyApprovalEmail, sendPropertyRejectionEmail } = await import('@/lib/email.js');

          if (body.status === 'active') {
            await sendPropertyApprovalEmail({
              to: ownerEmail,
              propertyTitle: propertyWithOwner.title,
              propertyId: propertyWithOwner.id,
              siteId: propertyWithOwner.site_id
            });
            console.log('✅ Property approval email sent to:', ownerEmail);
          } else if (body.status === 'rejected') {
            await sendPropertyRejectionEmail({
              to: ownerEmail,
              propertyTitle: propertyWithOwner.title,
              rejectionReason: body.rejection_reason
            });
            console.log('✅ Property rejection email sent to:', ownerEmail);
          }
        }
      }
    } catch (emailError) {
      console.warn('⚠️ Failed to send property notification email:', emailError);
      // Continue without failing the main operation
    }

    // Try to log the admin action (optional, won't fail if table doesn't exist)
    try {
      await adminSupabase
        .from('admin_actions')
        .insert({
          admin_id: user.id,
          action_type: body.status === 'active' ? 'property_approved' : 'property_rejected',
          target_type: 'property',
          target_id: propertyId,
          details: {
            previous_status: (property as any).status,
            new_status: body.status,
            rejection_reason: body.rejection_reason || null
          }
        } as any)
    } catch (logError) {
      console.warn('Failed to log admin action:', logError)
      // Continue without failing the main operation
    }

    return NextResponse.json({ 
      success: true, 
      property: updatedProperty,
      message: `Property ${body.status === 'active' ? 'approved' : 'rejected'} successfully`
    })
    
  } catch (error) {
    console.error('Property status update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

