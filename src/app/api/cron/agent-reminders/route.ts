import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const FROM_EMAIL = 'Portal Home Hub <info@portalhomehub.com>';

const SITE_NAME_MAP: Record<string, string> = {
  GY: 'Guyana HomeHub',
  JM: 'Jamaica HomeHub',
};

const LOGIN_URL_MAP: Record<string, string> = {
  GY: 'https://gy.portalhomehub.com/login',
  JM: 'https://jm.portalhomehub.com/login',
};

const TEMPLATE_NAMES = {
  fifteen: 'Inactive Agent - 15 Days',
  thirty: 'Inactive Agent - 30 Days (Final Notice)',
  final: '24hr Account Removal Notice',
} as const;

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

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  const results = {
    sent: 0,
    skipped: 0,
    flagged: 0,
    errors: [] as string[],
  };

  // Step 1: find user_ids that have at least one active listing — these are excluded
  const { data: activeOwners, error: activeOwnersError } = await supabase
    .from('properties')
    .select('user_id')
    .eq('status', 'active');

  if (activeOwnersError) {
    console.error('Cron: failed to fetch active property owners', activeOwnersError);
    return NextResponse.json({ error: activeOwnersError.message }, { status: 500 });
  }

  const excludeIds = new Set((activeOwners || []).map(p => p.user_id).filter(Boolean));

  // Step 2: fetch all agents (filter by zero-listing in JS — agent counts are small)
  const { data: agents, error: agentsError } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, created_at, country_id')
    .eq('user_type', 'agent');

  if (agentsError) {
    console.error('Cron: failed to fetch agents', agentsError);
    return NextResponse.json({ error: agentsError.message }, { status: 500 });
  }

  const inactiveAgents = (agents || []).filter(a => !excludeIds.has(a.id));

  // Step 3: load the 3 reminder templates once
  const templateNames = [TEMPLATE_NAMES.fifteen, TEMPLATE_NAMES.thirty, TEMPLATE_NAMES.final];
  const { data: templates, error: templatesError } = await supabase
    .from('email_templates')
    .select('id, name, subject, body')
    .in('name', templateNames);

  if (templatesError) {
    console.error('Cron: failed to fetch templates', templatesError);
    return NextResponse.json({ error: templatesError.message }, { status: 500 });
  }

  const templateByName = Object.fromEntries(
    (templates || []).map(t => [t.name, t])
  );

  for (const name of templateNames) {
    if (!templateByName[name]) {
      results.errors.push(`Template missing: ${name}`);
    }
  }

  const now = new Date();
  const sevenDaysAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  for (const agent of inactiveAgents) {
    if (!agent.email || !agent.created_at) {
      results.skipped++;
      continue;
    }

    const daysInactive = Math.floor(
      (now.getTime() - new Date(agent.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    let templateName: string | null = null;
    if (daysInactive === 15) {
      templateName = TEMPLATE_NAMES.fifteen;
    } else if (daysInactive === 30) {
      templateName = TEMPLATE_NAMES.thirty;
    } else if (daysInactive === 44) {
      templateName = TEMPLATE_NAMES.final;
    } else if (daysInactive >= 45) {
      const { error: flagError } = await supabase
        .from('profiles')
        .update({ needs_review: true })
        .eq('id', agent.id);
      if (flagError) {
        results.errors.push(`Flag failed for ${agent.email}: ${flagError.message}`);
      } else {
        results.flagged++;
      }
      continue;
    } else {
      results.skipped++;
      continue;
    }

    const template = templateByName[templateName];
    if (!template) {
      results.errors.push(`Template not loaded: ${templateName}`);
      continue;
    }

    // Dedup: skip if this template already sent to this agent within the last 7 days
    const { data: recentSend, error: recentError } = await supabase
      .from('admin_emails')
      .select('id')
      .eq('recipient_id', agent.id)
      .eq('template_id', template.id)
      .eq('sent_by_cron', true)
      .gte('sent_at', sevenDaysAgoIso)
      .limit(1);

    if (recentError) {
      results.errors.push(`Dedup check failed for ${agent.email}: ${recentError.message}`);
      continue;
    }
    if (recentSend && recentSend.length > 0) {
      results.skipped++;
      continue;
    }

    const firstName = agent.first_name || 'there';
    const fullName = `${agent.first_name || ''} ${agent.last_name || ''}`.trim();
    const countryId = agent.country_id || 'GY';
    const siteName = SITE_NAME_MAP[countryId] || 'HomeHub';
    const loginUrl = LOGIN_URL_MAP[countryId] || 'https://www.portalhomehub.com/login';

    const replace = (s: string) =>
      s
        .replace(/\{\{first_name\}\}/g, firstName)
        .replace(/\{\{agent_name\}\}/g, fullName)
        .replace(/\{\{full_name\}\}/g, fullName)
        .replace(/\{\{days_inactive\}\}/g, String(daysInactive))
        .replace(/\{\{login_url\}\}/g, loginUrl)
        .replace(/\{\{site_name\}\}/g, siteName);

    const emailSubject = replace(template.subject);
    const emailBody = replace(template.body);

    try {
      const sendResult = await resend.emails.send({
        from: FROM_EMAIL,
        to: agent.email,
        subject: emailSubject,
        html: convertToHtml(emailBody),
        headers: {
          'X-Entity-Ref-ID': 'agent-reminder-cron',
        },
      });

      if (sendResult.error) {
        results.errors.push(`Send failed to ${agent.email}: ${sendResult.error.message}`);
        continue;
      }

      const { error: logError } = await supabase.from('admin_emails').insert({
        sender_id: null,
        recipient_id: agent.id,
        recipient_email: agent.email,
        country_id: agent.country_id || null,
        subject: emailSubject,
        body: emailBody,
        template_id: template.id,
        resend_id: sendResult.data?.id || null,
        status: 'sent',
        sent_at: new Date().toISOString(),
        sent_by_cron: true,
      });

      if (logError) {
        console.error('Cron: failed to log admin_email', logError);
      }

      results.sent++;
    } catch (err) {
      results.errors.push(`Exception for ${agent.email}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log('Agent reminder cron completed:', results);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    ...results,
  });
}
