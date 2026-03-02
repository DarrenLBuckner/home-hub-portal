import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

const createAuthClient = async () => {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};

export async function GET(request: NextRequest) {
  try {
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceClient = createServiceClient();

    // Verify admin status
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, user_type, admin_level, country_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!['super', 'owner', 'basic'].includes(profile.admin_level)) {
      return NextResponse.json({ error: 'Insufficient admin level' }, { status: 403 });
    }

    // Build agent query - all agents with their property counts
    let agentQuery = serviceClient
      .from('profiles')
      .select('id, email, first_name, last_name, phone, country_id, subscription_status, subscription_tier, is_verified_agent, is_premium_agent, created_at')
      .eq('user_type', 'agent')
      .order('created_at', { ascending: true });

    // Country scoping for non-super admins
    if (profile.admin_level !== 'super' && profile.country_id) {
      agentQuery = agentQuery.eq('country_id', profile.country_id);
    }

    const { data: agents, error: agentsError } = await agentQuery;

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    // Get property counts for each agent
    const agentIds = (agents || []).map(a => a.id);

    // Batch fetch all properties for these agents
    let propertiesQuery = serviceClient
      .from('properties')
      .select('user_id, status')
      .in('user_id', agentIds.length > 0 ? agentIds : ['none']);

    const { data: properties } = await propertiesQuery;

    // Build property count map
    const propertyCountMap: Record<string, { active: number; draft: number; total: number }> = {};
    for (const prop of properties || []) {
      if (!propertyCountMap[prop.user_id]) {
        propertyCountMap[prop.user_id] = { active: 0, draft: 0, total: 0 };
      }
      propertyCountMap[prop.user_id].total++;
      if (prop.status === 'active') propertyCountMap[prop.user_id].active++;
      if (prop.status === 'draft') propertyCountMap[prop.user_id].draft++;
    }

    // Enrich agents with property counts and days since signup
    const now = new Date();
    const enrichedAgents = (agents || []).map(agent => {
      const counts = propertyCountMap[agent.id] || { active: 0, draft: 0, total: 0 };
      const signupDate = new Date(agent.created_at);
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...agent,
        active_listings: counts.active,
        draft_listings: counts.draft,
        total_listings: counts.total,
        days_since_signup: daysSinceSignup,
      };
    });

    // Calculate summary stats
    const totalAgents = enrichedAgents.length;
    const zeroListings = enrichedAgents.filter(a => a.total_listings === 0).length;
    const inactive15Days = enrichedAgents.filter(a => a.total_listings === 0 && a.days_since_signup >= 15).length;
    const inactive30Days = enrichedAgents.filter(a => a.total_listings === 0 && a.days_since_signup >= 30).length;

    return NextResponse.json({
      agents: enrichedAgents,
      stats: {
        totalAgents,
        zeroListings,
        inactive15Days,
        inactive30Days,
      },
    });
  } catch (error) {
    console.error('Error in agent-engagement API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
