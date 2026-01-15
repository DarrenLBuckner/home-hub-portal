import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Create service role client for database operations
const createServiceClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
};

// Create authenticated client to verify user
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
    // Verify the user is authenticated
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get user profile to verify admin status
    const serviceClient = createServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('user_type, admin_level, country_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Could not verify user profile' },
        { status: 403 }
      );
    }

    // Check if user is admin
    const isAdmin = profile.user_type === 'admin' ||
                    profile.admin_level === 'super' ||
                    profile.admin_level === 'owner';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Fetch email history for the specified user
    const { data: emails, error: emailsError } = await serviceClient
      .from('admin_emails')
      .select(`
        id,
        subject,
        body,
        sent_at,
        resend_id,
        status,
        template_id,
        sent_by
      `)
      .eq('recipient_id', userId)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (emailsError) {
      console.error('Error fetching email history:', emailsError);
      return NextResponse.json(
        { error: 'Failed to fetch email history' },
        { status: 500 }
      );
    }

    // Get template names and sender names for the emails
    const templateIds = [...new Set(emails?.filter(e => e.template_id).map(e => e.template_id) || [])];
    const senderIds = [...new Set(emails?.filter(e => e.sent_by).map(e => e.sent_by) || [])];

    // Fetch template names
    let templateMap: Record<string, string> = {};
    if (templateIds.length > 0) {
      const { data: templates } = await serviceClient
        .from('email_templates')
        .select('id, name')
        .in('id', templateIds);

      templateMap = (templates || []).reduce((acc, t) => {
        acc[t.id] = t.name;
        return acc;
      }, {} as Record<string, string>);
    }

    // Fetch sender names
    let senderMap: Record<string, string> = {};
    if (senderIds.length > 0) {
      const { data: senders } = await serviceClient
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', senderIds);

      senderMap = (senders || []).reduce((acc, s) => {
        acc[s.id] = `${s.first_name || ''} ${s.last_name || ''}`.trim();
        return acc;
      }, {} as Record<string, string>);
    }

    // Transform response
    const transformedEmails = (emails || []).map(email => ({
      id: email.id,
      subject: email.subject,
      body: email.body,
      created_at: email.sent_at,
      status: email.status,
      template_name: email.template_id ? templateMap[email.template_id] || null : null,
      sender_name: email.sent_by ? senderMap[email.sent_by] || null : null,
    }));

    return NextResponse.json({ emails: transformedEmails });

  } catch (error) {
    console.error('Error in email-history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
