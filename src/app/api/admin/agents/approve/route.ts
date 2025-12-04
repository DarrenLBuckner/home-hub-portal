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

    // Check authorization - only super admin, owner admin, and basic admin can approve agents
    const canApproveAgents = profile.user_type === 'admin' && 
      ['super', 'owner', 'basic'].includes(profile.admin_level);

    if (!canApproveAgents) {
      return NextResponse.json({ 
        error: 'Access denied. Only administrators can approve agents.' 
      }, { status: 403 });
    }

    // Get agent details from vetting table (no profile join since profile doesn't exist yet)
    let agentQuery = supabaseAdmin
      .from('agent_vetting')
      .select('*')
      .eq('id', agentId)
      .eq('status', 'pending_review');

    // Apply country filtering for non-super admins
    if (profile.admin_level !== 'super' && profile.country_id) {
      agentQuery = agentQuery.eq('country', profile.country_id);
    }

    const { data: agent, error: agentError } = await agentQuery.single();

    if (agentError || !agent) {
      console.error('Agent fetch error:', agentError);
      return NextResponse.json({ error: 'Agent not found or not pending' }, { status: 404 });
    }

    const agentEmail = agent.email;
    const agentFirstName = agent.first_name;
    const agentLastName = agent.last_name;

    // Create user account in Supabase Auth using their registration password
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: agentEmail,
      password: agent.temp_password, // Use password from registration
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        first_name: agentFirstName,
        last_name: agentLastName,
        user_type: 'agent',
        onboarding_completed: true
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json({ 
        error: 'Failed to create user account: ' + authError.message 
      }, { status: 500 });
    }

    console.log('✅ Auth user created:', authUser.user.id);

    // Determine subscription tier - founding agents get premium tier (maps to Professional plan)  
    const subscriptionTier = agent.is_founding_member ? 'premium' : 'basic';
    
    // Create or update profile record with Auth user's ID (handles DB trigger conflict)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authUser.user.id,  // Profile id = Auth user id
        email: agentEmail,
        first_name: agentFirstName,
        last_name: agentLastName,
        phone: agent.phone || null,
        user_type: 'agent',
        country_id: agent.country_id || agent.country || 'GY',
        subscription_status: 'active',
        subscription_tier: subscriptionTier,
        approval_status: 'approved',
        approval_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Try to clean up the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ 
        error: 'Failed to create profile: ' + profileError.message 
      }, { status: 500 });
    }

    // Update agent vetting status to approved and link to user
    const { error: vettingUpdateError } = await supabaseAdmin
      .from('agent_vetting')
      .update({ 
        user_id: authUser.user.id,
        user_created: true,
        status: 'approved', 
        approved_at: new Date().toISOString()
      })
      .eq('id', agentId);

    if (vettingUpdateError) {
      console.error('Vetting update error:', vettingUpdateError);
      return NextResponse.json({ 
        error: 'Failed to update agent status: ' + vettingUpdateError.message 
      }, { status: 500 });
    }

    // Clear the temp password from database for security
    await supabaseAdmin
      .from('agent_vetting')
      .update({ temp_password: null })
      .eq('id', agentId);

    console.log('✅ Agent approved successfully:', {
      agentId,
      userId: authUser.user.id,
      email: agentEmail
    });

    return NextResponse.json({ 
      success: true,
      userId: authUser.user.id,
      email: agentEmail,
      name: `${agentFirstName} ${agentLastName}`.trim()
    });

  } catch (error: any) {
    console.error('Agent approval error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error.message 
    }, { status: 500 });
  }
}

