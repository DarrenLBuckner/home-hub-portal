export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { getCountryAwareAdminPermissions } from '@/lib/auth/adminPermissions';

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
    
    // Validate required fields
    const required = [
      "title", "description", "price", "property_type", 
      "bedrooms", "bathrooms", "house_size_value", 
      "region", "city", "owner_email", "owner_whatsapp"
    ];
    
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
      }
    }

    // Prepare update data
    const updateData = {
      // Step 1 - Basic Info
      title: body.title,
      description: body.description,
      price: parseInt(body.price),
      property_type: body.property_type,
      
      // Step 2 - Property Details
      bedrooms: parseInt(body.bedrooms),
      bathrooms: parseInt(body.bathrooms),
      house_size_value: parseInt(body.house_size_value),
      house_size_unit: body.house_size_unit,
      land_size_value: body.land_size_value ? parseInt(body.land_size_value) : null,
      land_size_unit: body.land_size_unit,
      year_built: body.year_built ? parseInt(body.year_built) : null,
      amenities: body.amenities || [],
      
      // Step 3 - Location
      region: body.region,
      city: body.city,
      neighborhood: body.neighborhood || null,
      
      // Step 5 - Contact
      owner_email: body.owner_email,
      owner_whatsapp: body.owner_whatsapp,
    };

    // Update property in properties table
    const { data: propertyResult, error: dbError } = await supabase
      .from("properties")
      .update(updateData)
      .eq('id', propertyId)
      .eq('user_id', user.id) // Ensure user owns this property
      .select('id')
      .single();
      
    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json({ error: dbError.message || "Database error" }, { status: 500 });
    }

    if (!propertyResult) {
      return NextResponse.json({ error: "Property not found or access denied" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      propertyId: propertyResult.id,
      message: 'Property updated successfully'
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
      .select('id, country, status')
      .eq('id', propertyId)
      .single()

    if (propertyError || !property) {
      console.error('❌ Property not found:', propertyError?.message);
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Check country access for non-super admins
    if (!permissions.canViewAllCountries && permissions.countryFilter && 
        (property as any).country !== permissions.countryFilter) {
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

