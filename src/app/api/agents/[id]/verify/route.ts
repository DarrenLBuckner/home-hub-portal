import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

/**
 * Agent Verification API
 *
 * PATCH /api/agents/[id]/verify
 *
 * Actions:
 * - { action: 'verify' } - Mark agent as verified
 * - { action: 'revoke' } - Remove verification
 *
 * Authorization:
 * - Super Admin: Can verify/revoke any agent
 * - Owner Admin: Can only verify/revoke agents in their territory (country_id match)
 * - Basic Admin: Cannot verify/revoke
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body;

    if (!action || !['verify', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "verify" or "revoke"' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    // Create anon client for auth verification
    const anonSupabase = createServerClient(
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

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await anonSupabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create service role client for admin operations
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Get current user's admin profile
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_type, admin_level, country_id, first_name, last_name, email')
      .eq('id', user.id)
      .single();

    if (adminError || !adminProfile) {
      console.error('Admin profile error:', adminError?.message);
      return NextResponse.json({ error: 'Admin profile not found' }, { status: 403 });
    }

    // Check if user is an admin
    if (adminProfile.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const isSuperAdmin = adminProfile.admin_level === 'super';
    const isOwnerAdmin = adminProfile.admin_level === 'owner';

    // Basic admins cannot verify agents
    if (!isSuperAdmin && !isOwnerAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Only Super Admin or Owner Admin can verify agents.' },
        { status: 403 }
      );
    }

    // Get target agent's profile
    const { data: agentProfile, error: agentError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_type, country_id, first_name, last_name, email, is_verified_agent, verified_by, verified_at')
      .eq('id', agentId)
      .single();

    if (agentError || !agentProfile) {
      console.error('Agent profile error:', agentError?.message);
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Verify this is actually an agent
    if (agentProfile.user_type !== 'agent') {
      return NextResponse.json(
        { error: 'This user is not an agent' },
        { status: 400 }
      );
    }

    // Territory check for Owner Admins
    if (isOwnerAdmin && !isSuperAdmin) {
      const adminCountry = adminProfile.country_id;
      const agentCountry = agentProfile.country_id;

      if (!adminCountry || adminCountry !== agentCountry) {
        return NextResponse.json(
          { error: 'Access denied. You can only verify agents in your territory.' },
          { status: 403 }
        );
      }
    }

    // Perform the action
    if (action === 'verify') {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          is_verified_agent: true,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentId);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to verify agent: ' + updateError.message },
          { status: 500 }
        );
      }

      console.log(`Agent ${agentId} verified by ${user.id} (${adminProfile.email})`);

      return NextResponse.json({
        success: true,
        message: 'Agent verified successfully',
        agent: {
          id: agentId,
          name: `${agentProfile.first_name} ${agentProfile.last_name}`.trim(),
          email: agentProfile.email,
          is_verified_agent: true,
          verified_by: user.id,
          verified_at: new Date().toISOString(),
        },
        verifier: {
          id: user.id,
          name: `${adminProfile.first_name} ${adminProfile.last_name}`.trim(),
          email: adminProfile.email,
        },
      });
    } else if (action === 'revoke') {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          is_verified_agent: false,
          verified_by: null,
          verified_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentId);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to revoke verification: ' + updateError.message },
          { status: 500 }
        );
      }

      console.log(`Agent ${agentId} verification revoked by ${user.id} (${adminProfile.email})`);

      return NextResponse.json({
        success: true,
        message: 'Agent verification revoked successfully',
        agent: {
          id: agentId,
          name: `${agentProfile.first_name} ${agentProfile.last_name}`.trim(),
          email: agentProfile.email,
          is_verified_agent: false,
          verified_by: null,
          verified_at: null,
        },
        revokedBy: {
          id: user.id,
          name: `${adminProfile.first_name} ${adminProfile.last_name}`.trim(),
          email: adminProfile.email,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Agent verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/[id]/verify
 *
 * Get the verification status of an agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agentId = params.id;

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();

    // Create anon client for auth verification
    const anonSupabase = createServerClient(
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

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await anonSupabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create service role client for fetching data
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

    // Check if user is an admin
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('user_type, admin_level')
      .eq('id', user.id)
      .single();

    if (adminError || !adminProfile || adminProfile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get agent's verification status with verifier info
    const { data: agentProfile, error: agentError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        user_type,
        country_id,
        first_name,
        last_name,
        email,
        is_verified_agent,
        verified_by,
        verified_at
      `)
      .eq('id', agentId)
      .single();

    if (agentError || !agentProfile) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (agentProfile.user_type !== 'agent') {
      return NextResponse.json({ error: 'This user is not an agent' }, { status: 400 });
    }

    // If verified, get verifier's name
    let verifierName = null;
    if (agentProfile.verified_by) {
      const { data: verifierProfile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', agentProfile.verified_by)
        .single();

      if (verifierProfile) {
        verifierName = `${verifierProfile.first_name} ${verifierProfile.last_name}`.trim();
      }
    }

    // Check if current admin can verify this agent
    const isSuperAdmin = adminProfile.admin_level === 'super';
    const isOwnerAdmin = adminProfile.admin_level === 'owner';

    let canVerify = false;
    if (isSuperAdmin) {
      canVerify = true;
    } else if (isOwnerAdmin) {
      // Get admin's country
      const { data: fullAdminProfile } = await supabaseAdmin
        .from('profiles')
        .select('country_id')
        .eq('id', user.id)
        .single();

      canVerify = fullAdminProfile?.country_id === agentProfile.country_id;
    }

    return NextResponse.json({
      success: true,
      agent: {
        id: agentProfile.id,
        name: `${agentProfile.first_name} ${agentProfile.last_name}`.trim(),
        email: agentProfile.email,
        country_id: agentProfile.country_id,
        is_verified_agent: agentProfile.is_verified_agent || false,
        verified_by: agentProfile.verified_by,
        verified_by_name: verifierName,
        verified_at: agentProfile.verified_at,
      },
      canVerify,
    });
  } catch (error: any) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}
