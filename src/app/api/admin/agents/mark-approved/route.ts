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

/**
 * Mark an agent application as "manually approved"
 * Used when an agent was approved outside the normal flow (e.g., profile created directly in Supabase)
 */
export async function POST(request: NextRequest) {
  try {
    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

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

    // Check authorization - only super admin and owner admin can mark as approved
    const canMarkApproved = profile.user_type === 'admin' &&
      ['super', 'owner'].includes(profile.admin_level);

    if (!canMarkApproved) {
      return NextResponse.json({
        error: 'Access denied. Only super admins and owner admins can mark agents as manually approved.'
      }, { status: 403 });
    }

    // Get agent details from vetting table
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agent_vetting')
      .select('*')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      console.error('Agent fetch error:', agentError);
      return NextResponse.json({ error: 'Agent application not found' }, { status: 404 });
    }

    // Check if a profile already exists for this agent's email
    const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, user_type')
      .eq('email', agent.email)
      .single();

    let linkedUserId = agent.user_id;

    if (existingProfile && !linkedUserId) {
      // Link to existing profile
      linkedUserId = existingProfile.id;
      console.log('🔗 Linking agent_vetting to existing profile:', existingProfile.id);
    }

    // Update agent vetting status to approved
    const { error: vettingUpdateError } = await supabaseAdmin
      .from('agent_vetting')
      .update({
        user_id: linkedUserId,
        user_created: !!linkedUserId,
        status: 'approved',
        approved_at: new Date().toISOString(),
        temp_password: null // Clear temp password for security
      })
      .eq('id', agentId);

    if (vettingUpdateError) {
      console.error('Vetting update error:', vettingUpdateError);
      return NextResponse.json({
        error: 'Failed to update agent status: ' + vettingUpdateError.message
      }, { status: 500 });
    }

    console.log('✅ Agent marked as manually approved:', {
      agentId,
      email: agent.email,
      linkedUserId
    });

    return NextResponse.json({
      success: true,
      agentId,
      email: agent.email,
      linkedUserId,
      message: 'Agent application marked as manually approved'
    });

  } catch (error: any) {
    console.error('Mark approved error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error.message
    }, { status: 500 });
  }
}
