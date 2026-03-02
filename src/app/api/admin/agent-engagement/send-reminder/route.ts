import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { replacePlaceholders, UserContext } from '@/lib/email/templateReplacer';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Portal Home Hub <info@portalhomehub.com>';

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

// Site name mapping
const SITE_NAME_MAP: Record<string, string> = {
  'GY': 'Guyana HomeHub',
  'JM': 'Jamaica HomeHub',
};

// Login URL mapping
const LOGIN_URL_MAP: Record<string, string> = {
  'GY': 'https://gy.portalhomehub.com/login',
  'JM': 'https://jm.portalhomehub.com/login',
};

function convertToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const paragraphs = escaped
    .split(/\n\n+/)
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.5;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${paragraphs}
      <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
      <p style="font-size: 12px; color: #666; margin: 0;">
        This email was sent from Portal Home Hub.
      </p>
    </body>
    </html>
  `;
}

export async function POST(request: NextRequest) {
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
      .select('id, user_type, admin_level, country_id, email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!['super', 'owner', 'basic'].includes(profile.admin_level)) {
      return NextResponse.json({ error: 'Insufficient admin level' }, { status: 403 });
    }

    const body = await request.json();
    const { agentIds, templateId, templateSubject, templateBody } = body;

    if (!agentIds || !Array.isArray(agentIds) || agentIds.length === 0) {
      return NextResponse.json({ error: 'No agents selected' }, { status: 400 });
    }

    if (!templateSubject || !templateBody) {
      return NextResponse.json({ error: 'Template subject and body are required' }, { status: 400 });
    }

    // Fetch agent profiles
    let agentQuery = serviceClient
      .from('profiles')
      .select('id, email, first_name, last_name, phone, country_id, subscription_status, created_at')
      .in('id', agentIds)
      .eq('user_type', 'agent');

    // Country scoping for non-super admins
    if (profile.admin_level !== 'super' && profile.country_id) {
      agentQuery = agentQuery.eq('country_id', profile.country_id);
    }

    const { data: agents, error: agentsError } = await agentQuery;

    if (agentsError || !agents || agents.length === 0) {
      return NextResponse.json({ error: 'No valid agents found' }, { status: 400 });
    }

    // Get property counts for calculating days_inactive and listing_count
    const { data: properties } = await serviceClient
      .from('properties')
      .select('user_id')
      .in('user_id', agents.map(a => a.id));

    const propertyCountMap: Record<string, number> = {};
    for (const prop of properties || []) {
      propertyCountMap[prop.user_id] = (propertyCountMap[prop.user_id] || 0) + 1;
    }

    const results: { email: string; success: boolean; error?: string }[] = [];
    const now = new Date();

    for (const agent of agents) {
      try {
        const daysSinceSignup = Math.floor((now.getTime() - new Date(agent.created_at).getTime()) / (1000 * 60 * 60 * 24));
        const listingCount = propertyCountMap[agent.id] || 0;
        const countryId = agent.country_id || 'GY';

        // Build context for template replacement
        const context: UserContext = {
          firstName: agent.first_name || '',
          lastName: agent.last_name || '',
          email: agent.email || '',
          userType: 'agent',
          phone: agent.phone || '',
          countryId: countryId,
          subscriptionStatus: agent.subscription_status || '',
          propertyCount: listingCount,
          createdAt: agent.created_at,
        };

        // Replace standard placeholders
        let processedSubject = replacePlaceholders(templateSubject, context);
        let processedBody = replacePlaceholders(templateBody, context);

        // Replace engagement-specific placeholders
        const siteName = SITE_NAME_MAP[countryId] || 'HomeHub';
        const loginUrl = LOGIN_URL_MAP[countryId] || 'https://www.portalhomehub.com/login';

        processedSubject = processedSubject
          .replace(/\{\{days_inactive\}\}/g, String(daysSinceSignup))
          .replace(/\{\{listing_count\}\}/g, String(listingCount))
          .replace(/\{\{login_url\}\}/g, loginUrl)
          .replace(/\{\{agent_name\}\}/g, `${agent.first_name || ''} ${agent.last_name || ''}`.trim());

        processedBody = processedBody
          .replace(/\{\{days_inactive\}\}/g, String(daysSinceSignup))
          .replace(/\{\{listing_count\}\}/g, String(listingCount))
          .replace(/\{\{login_url\}\}/g, loginUrl)
          .replace(/\{\{agent_name\}\}/g, `${agent.first_name || ''} ${agent.last_name || ''}`.trim());

        // Send email
        const result = await resend.emails.send({
          from: FROM_EMAIL,
          to: agent.email,
          subject: processedSubject,
          html: convertToHtml(processedBody),
          headers: {
            'X-Entity-Ref-ID': 'agent-engagement-reminder',
            'X-Sender-Admin-Id': user.id,
          },
        });

        if (result.error) {
          results.push({ email: agent.email, success: false, error: result.error.message });
        } else {
          results.push({ email: agent.email, success: true });

          // Log to admin_emails table
          await serviceClient
            .from('admin_emails')
            .insert({
              sender_id: user.id,
              recipient_id: agent.id,
              recipient_email: agent.email,
              country_id: agent.country_id || null,
              subject: processedSubject,
              body: processedBody,
              template_id: templateId || null,
              resend_id: result.data?.id || null,
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .then(({ error: logError }) => {
              if (logError) console.error('Error logging email:', logError);
            });
        }
      } catch (sendError) {
        results.push({
          email: agent.email,
          success: false,
          error: sendError instanceof Error ? sendError.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount} email(s) successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      results,
      successCount,
      failCount,
    });
  } catch (error) {
    console.error('Error in send-reminder API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
