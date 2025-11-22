export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { getCountryAwareAdminPermissions } from '@/lib/auth/adminPermissions';

interface ProfileType {
  user_type: string;
  admin_level?: string;
}

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
    
    // Validate status field
    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Create admin client for privileged operations
    const adminSupabase = createAdminClient();

    // Get user profile to check admin permissions
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('user_type, admin_level')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user is admin
    if ((profile as ProfileType).user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Get admin permissions
    const permissions = await getCountryAwareAdminPermissions(
      (profile as ProfileType).user_type,
      user.email || '',
      (profile as ProfileType).admin_level || null,
      user.id,
      adminSupabase
    );

    // Check property approval permissions
    if (!permissions.canApproveProperties && body.status === 'active') {
      return NextResponse.json({ error: 'No permission to approve properties' }, { status: 403 });
    }

    if (!permissions.canRejectProperties && body.status === 'rejected') {
      return NextResponse.json({ error: 'No permission to reject properties' }, { status: 403 });
    }

    // Get the property to check permissions
    const { data: property, error: propertyError } = await adminSupabase
      .from('properties')
      .select('id, country_id, status')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('❌ Property not found:', propertyError?.message);
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Check country access for non-super admins
    if (!permissions.canViewAllCountries && permissions.countryFilter && 
        (property as any).country_id !== permissions.countryFilter) {
      return NextResponse.json({ error: 'No access to properties from this country' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      status: body.status,
      updated_at: new Date().toISOString()
    };

    // Add rejection reason if provided
    if (body.status === 'rejected' && body.rejection_reason) {
      updateData.rejection_reason = body.rejection_reason;
    }

    // Add admin who processed this
    if (body.status === 'active' || body.status === 'rejected') {
      updateData.reviewed_by = user.id;
      updateData.reviewed_at = new Date().toISOString();
    }

    // Update property status using service role client
    const { data: updatedProperty, error: updateError } = await (adminSupabase as any)
      .from('properties')
      .update(updateData)
      .eq('id', propertyId)
      .select()
      .single();

    if (updateError) {
      console.error('Property status update error:', updateError);
      return NextResponse.json({ error: 'Failed to update property status' }, { status: 500 });
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
        } as any);
    } catch (logError) {
      console.warn('Failed to log admin action:', logError);
      // Continue without failing the main operation
    }

    return NextResponse.json({ 
      success: true, 
      property: updatedProperty,
      message: `Property ${body.status === 'active' ? 'approved' : 'rejected'} successfully`
    });
    
  } catch (error) {
    console.error('Property status update API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}