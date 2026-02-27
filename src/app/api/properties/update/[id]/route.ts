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

    // Get user profile for admin status
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('admin_level, country_id, user_type')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error loading user profile:', profileError);
    }

    const userAdminLevel = userProfile?.admin_level;
    const isUserAdmin = userAdminLevel && ['super', 'owner'].includes(userAdminLevel);
    const userCountryId = userProfile?.country_id;

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
      country_id: body.country || body.country_id || 'GY',
      region: body.region || '',
      city: body.city || null,
      neighborhood: body.neighborhood || null,
      address: body.address || null,
      show_address: body.show_address ?? false,
      site_id: body.site_id || (body.country === 'JM' ? 'jamaica' : 'guyana'),

      // Step 4 - Currency
      currency: body.currency || 'GYD',

      // Step 5 - Contact (handle both field name conventions)
      owner_email: body.owner_email || body.contact_email || null,
      owner_whatsapp: normalizePhoneNumber(body.owner_whatsapp || body.contact_phone),

      // Rental-specific fields (for landlord properties)
      listing_type: body.listing_type || null,
      lease_term_years: body.lease_term_years || body.lease_term || null,
      deposit_amount: body.deposit_amount ? parseFloat(body.deposit_amount) : null,
      utilities_included: body.utilities_included || null,
      pet_policy: body.pet_policy || null,
      available_from: body.available_from || null,
    };

    // Reconcile existing images: delete any property_media records whose URL is no longer in the keep list
    if (body.existingImages !== undefined && Array.isArray(body.existingImages)) {
      try {
        const adminSupabase = createAdminClient();
        const { data: currentMedia } = await adminSupabase
          .from('property_media')
          .select('id, media_url')
          .eq('property_id', propertyId)
          .eq('media_type', 'image');

        if (currentMedia && currentMedia.length > 0) {
          const toDelete = currentMedia
            .filter((m: any) => !(body.existingImages as string[]).includes(m.media_url))
            .map((m: any) => m.id);

          if (toDelete.length > 0) {
            await adminSupabase.from('property_media').delete().in('id', toDelete);
            console.log(`🗑️ Reconciled ${toDelete.length} removed image(s) from property_media`);
          }
        }
      } catch (reconcileError) {
        console.error('Image reconciliation error:', reconcileError);
      }
    }

    // Handle pre-uploaded image URLs (from agent edit page which uploads directly to Supabase)
    if (body.imageUrls && Array.isArray(body.imageUrls) && body.imageUrls.length > 0) {
      console.log(`📸 Processing ${body.imageUrls.length} pre-uploaded image URLs for property update`);

      try {
        // Use admin client to bypass RLS for media inserts (same as create route)
        const adminSupabase = createAdminClient();

        // Add new images as property_media records (don't delete existing for now)
        const existingMediaCount = await adminSupabase
          .from('property_media')
          .select('id', { count: 'exact' })
          .eq('property_id', propertyId);

        const startOrder = existingMediaCount.count || 0;

        const mediaInserts = body.imageUrls
          .filter((url: any) => url && typeof url === 'string')
          .map((imageUrl: string, i: number) => ({
            property_id: propertyId,
            media_url: imageUrl,
            media_type: 'image',
            display_order: startOrder + i,
            is_primary: startOrder === 0 && i === 0
          }));

        if (mediaInserts.length > 0) {
          const { error: mediaError } = await adminSupabase
            .from('property_media')
            .insert(mediaInserts);

          if (mediaError) {
            console.error('❌ Media insert error:', mediaError);
          } else {
            console.log(`✅ ${mediaInserts.length} pre-uploaded images saved to property_media`);
          }
        }
      } catch (imageError) {
        console.error('Image URL processing error:', imageError);
      }
    }

    // Handle image uploads if provided (base64 data from other edit pages)
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      console.log(`📸 Processing ${body.images.length} new images for property update`);
      console.log('Image data format check:', body.images.map((img: any) => ({
        name: img?.name,
        hasData: !!img?.data,
        dataType: typeof img?.data
      })));

      try {
        // Use admin client to bypass RLS for media operations (same as create route)
        const adminSupabase = createAdminClient();

        // Only delete all existing media when existingImages wasn't sent (backward compat).
        // When existingImages is present, reconciliation already removed the unwanted records above.
        if (body.existingImages === undefined) {
          const { error: deleteError } = await adminSupabase
            .from('property_media')
            .delete()
            .eq('property_id', propertyId);

          if (deleteError) {
            console.warn('Warning: Could not delete existing media:', deleteError);
          }
        }

        // Determine the starting display_order so new images are appended after any kept existing ones
        const { count: keptCount } = await adminSupabase
          .from('property_media')
          .select('id', { count: 'exact', head: true })
          .eq('property_id', propertyId);

        const startOrder = keptCount || 0;

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

            // Upload to Supabase storage using admin client
            const fileName = `${propertyId}/${Date.now()}_${imageFile.name}`;
            const { data: uploadData, error: uploadError } = await adminSupabase.storage
              .from('property-images')
              .upload(fileName, fileBuffer, {
                contentType: imageFile.type || 'image/jpeg'
              });

            if (uploadError) {
              console.error('Image upload error:', uploadError);
              continue;
            }

            // Get public URL
            const { data: { publicUrl } } = adminSupabase.storage
              .from('property-images')
              .getPublicUrl(fileName);

            // Save media record to property_media table
            const { error: mediaError } = await adminSupabase
              .from('property_media')
              .insert({
                property_id: propertyId,
                media_url: publicUrl,
                media_type: 'image',
                display_order: startOrder + i,
                is_primary: startOrder === 0 && i === 0
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

    // Sync properties.images from property_media after any image changes
    if ((body.existingImages !== undefined) ||
        (body.imageUrls && Array.isArray(body.imageUrls) && body.imageUrls.length > 0) ||
        (body.images && Array.isArray(body.images) && body.images.length > 0)) {
      try {
        const adminSupabase = createAdminClient();
        const { data: allMedia, error: mediaFetchError } = await adminSupabase
          .from('property_media')
          .select('media_url')
          .eq('property_id', propertyId)
          .order('display_order', { ascending: true });

        if (!mediaFetchError && allMedia) {
          updateData.images = allMedia.map((m: any) => m.media_url);
          console.log(`✅ properties.images synced with ${updateData.images.length} URLs`);
        } else {
          console.error('⚠️ Failed to fetch property_media for images sync:', mediaFetchError);
        }
      } catch (syncError) {
        console.error('⚠️ Error syncing properties.images:', syncError);
      }
    }

    // Get current property to preserve status
    let propertyQuery = supabase
      .from("properties")
      .select('id, status, country_id, user_id')
      .eq('id', propertyId);

    // Apply access control based on user type
    if (isUserAdmin) {
      // Super Admin can edit any property
      if (userAdminLevel === 'super') {
        console.log('🔓 Super Admin: Full edit access to all properties');
      }
      // Owner Admin can only edit properties in their country
      else if (userAdminLevel === 'owner' && userCountryId) {
        console.log(`🔓 Owner Admin: Edit access limited to country ${userCountryId}`);
        propertyQuery = propertyQuery.eq('country_id', userCountryId);
      }
    } else {
      // Regular users can only edit their own properties
      propertyQuery = propertyQuery.eq('user_id', user.id);
    }

    const { data: currentProperty, error: fetchError } = await propertyQuery.single();

    if (fetchError || !currentProperty) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    // Preserve current status - don't send active properties back to pending
    updateData.status = currentProperty.status;
    updateData.updated_at = new Date().toISOString();

    // Update property in properties table
    let updateQuery = supabase
      .from("properties")
      .update(updateData)
      .eq('id', propertyId);

    // Apply access control based on user type
    if (!isUserAdmin) {
      // Regular users can only update their own properties
      updateQuery = updateQuery.eq('user_id', user.id);
    } else if (userAdminLevel === 'owner' && userCountryId) {
      // Owner admins can only update properties in their country
      updateQuery = updateQuery.eq('country_id', userCountryId);
    }

    const { data: propertyResult, error: dbError } = await updateQuery
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

