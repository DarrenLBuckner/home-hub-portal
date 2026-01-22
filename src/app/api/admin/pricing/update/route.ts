import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { planId, updates, countryFilter, canEditGlobalPricing } = await request.json();

    if (!planId || !updates) {
      return NextResponse.json({ error: 'Missing planId or updates' }, { status: 400 });
    }

    // Verify the user is authenticated and is an admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type, admin_level, country_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check permissions
    const isSuperAdmin = profile.admin_level === 'super';
    const isOwnerAdmin = profile.admin_level === 'owner';

    if (!isSuperAdmin && !isOwnerAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions to edit pricing' }, { status: 403 });
    }

    // Use admin client to bypass RLS
    const adminSupabase = createAdminClient();

    // Build the update query
    let query = adminSupabase
      .from('pricing_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId);

    // Owner admins can only edit their country's pricing
    if (!isSuperAdmin && profile.country_id) {
      query = query.eq('country_id', profile.country_id);
    }

    const { data, error, count } = await query.select();

    if (error) {
      console.error('Database error updating pricing plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        error: 'No rows updated. You may not have permission to edit this plan.'
      }, { status: 403 });
    }

    console.log('✅ Pricing plan updated successfully:', planId);

    return NextResponse.json({
      success: true,
      message: 'Pricing plan updated successfully',
      updatedPlan: data[0]
    });

  } catch (error: any) {
    console.error('Error in pricing update API:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
