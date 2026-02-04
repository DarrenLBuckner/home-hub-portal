
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Regular client for auth verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    // Verify admin authorization
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get user session from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user's admin profile
    const { data: profile, error: adminProfileError } = await supabaseAdmin
      .from('profiles')
      .select('user_type, admin_level, country_id, email')
      .eq('id', user.id)
      .single();

    if (adminProfileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
    }

    // Check authorization - only super admin and owner admin can toggle premium
    const canTogglePremium = profile.user_type === 'admin' &&
      ['super', 'owner'].includes(profile.admin_level);

    if (!canTogglePremium) {
      return NextResponse.json({
        error: 'Access denied. Only super admins and owner admins can toggle premium status.'
      }, { status: 403 });
    }

    // Get the agent's profile
    const { data: agentProfile, error: agentError } = await supabaseAdmin
      .from('profiles')
      .select('country_id, first_name, last_name')
      .eq('id', id)
      .single();

    if (agentError || !agentProfile) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Owner admins can only modify agents in their territory
    if (profile.admin_level === 'owner') {
      if (agentProfile.country_id !== profile.country_id) {
        return NextResponse.json({
          error: 'You can only modify agents in your territory'
        }, { status: 403 });
      }
    }

    // Parse request body
    const { is_premium_agent } = await request.json();

    if (typeof is_premium_agent !== 'boolean') {
      return NextResponse.json(
        { error: 'is_premium_agent must be a boolean' },
        { status: 400 }
      );
    }

    // Update the agent's premium status
    let { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_premium_agent })
      .eq('id', id);

    if (updateError) {
      console.error('Premium update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      is_premium_agent,
      agent_name: `${agentProfile.first_name} ${agentProfile.last_name}`,
    });
  } catch (error: any) {
    console.error('Premium API error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
