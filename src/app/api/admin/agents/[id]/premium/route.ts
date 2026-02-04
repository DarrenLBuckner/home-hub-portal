import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createRouteHandlerClient({ cookies });

    // Check admin auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin with appropriate level
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('admin_level, country_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !adminProfile) {
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 403 });
    }

    // Basic admins cannot toggle premium status
    if (!adminProfile.admin_level || adminProfile.admin_level === 'basic') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get the agent's profile to check territory for owner admins
    const { data: agentProfile, error: agentError } = await supabase
      .from('profiles')
      .select('country_id, first_name, last_name')
      .eq('id', id)
      .single();

    if (agentError || !agentProfile) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Owner admins can only modify agents in their territory
    if (adminProfile.admin_level === 'owner') {
      if (agentProfile.country_id !== adminProfile.country_id) {
        return NextResponse.json(
          { error: 'You can only modify agents in your territory' },
          { status: 403 }
        );
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
    let { error: updateError } = await supabase
      .from('profiles')
      .update({ is_premium_agent })
      .eq('id', id);

    // If column doesn't exist, create it and retry
    if (updateError && updateError.message.includes('is_premium_agent')) {
      console.log('Creating is_premium_agent column...');

      // Add the column using raw SQL via RPC or direct query
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium_agent BOOLEAN DEFAULT false'
      });

      // If RPC doesn't exist, try a different approach - just retry the update
      // The column might have been added by another request
      if (alterError) {
        console.log('RPC not available, column may need manual creation:', alterError.message);
        return NextResponse.json({
          error: 'Database setup required. Please add is_premium_agent column to profiles table.',
          setup_sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium_agent BOOLEAN DEFAULT false;'
        }, { status: 500 });
      }

      // Retry the update
      const retryResult = await supabase
        .from('profiles')
        .update({ is_premium_agent })
        .eq('id', id);

      updateError = retryResult.error;
    }

    if (updateError) {
      console.error('Premium update error:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      is_premium_agent,
      agent_name: `${agentProfile.first_name} ${agentProfile.last_name}`,
    });
  } catch (error) {
    console.error('Premium API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
