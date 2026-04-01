// Admin API endpoint for agent vetting records (uses service role to bypass RLS)
// GET /api/admin/agents/vetting - List agent_vetting records for admin review
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();

    // Authenticate the user with anon key
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

    const {
      data: { user },
      error: userErr,
    } = await anonSupabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client for all data queries (bypasses RLS)
    const adminSupabase = createAdminClient();

    // Get user profile to verify admin status
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('user_type, admin_level, country_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if ((profile as any).user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const adminLevel = (profile as any).admin_level;
    const countryId = (profile as any).country_id;

    // Parse query params for optional status filtering
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status'); // e.g. 'pending_review', 'approved', 'denied'

    // Build query using service role (bypasses RLS)
    let agentsQuery = adminSupabase
      .from('agent_vetting')
      .select('*')
      .order('submitted_at', { ascending: false });

    // Apply status filter if provided
    if (statusFilter) {
      const statuses = statusFilter.split(',');
      agentsQuery = agentsQuery.in('status', statuses);
    } else {
      // Default: return pending, approved, and denied (same as original)
      agentsQuery = agentsQuery.in('status', ['pending_review', 'approved', 'denied']);
    }

    // Country scoping: owner_admin sees only their country
    if (adminLevel === 'owner' && countryId) {
      agentsQuery = agentsQuery.eq('country', countryId);
    }

    const { data: agents, error: agentsError } = await agentsQuery;

    if (agentsError) {
      console.error('Admin agent vetting query error:', agentsError);
      return NextResponse.json({ error: 'Failed to load agent applications' }, { status: 500 });
    }

    // Enrich with profile data (email, name, user_type) for agents that have a user_id
    const enrichedAgents = await Promise.all(
      (agents || []).map(async (agent: any) => {
        if (!agent.user_id) {
          return { ...agent, profiles: null, effective_user_type: 'agent' };
        }

        const { data: agentProfile } = await adminSupabase
          .from('profiles')
          .select('email, first_name, last_name, user_type')
          .eq('id', agent.user_id)
          .single();

        return {
          ...agent,
          profiles: agentProfile || null,
          effective_user_type: 'agent',
        };
      })
    );

    // Fetch pricing plans for plan name lookup
    const { data: plans } = await adminSupabase
      .from('pricing_plans')
      .select('id, plan_name');

    return NextResponse.json({
      success: true,
      agents: enrichedAgents,
      pricingPlans: plans || [],
    });

  } catch (error) {
    console.error('Admin agent vetting API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
