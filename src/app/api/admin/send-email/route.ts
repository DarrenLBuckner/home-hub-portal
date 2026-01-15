import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// From email address for Portal Home Hub
const FROM_EMAIL = 'Portal Home Hub <info@portalhomehub.com>';

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

export async function POST(request: NextRequest) {
  try {
    // Verify the sender is authenticated
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Get sender profile to verify admin status
    const serviceClient = createServiceClient();
    const { data: senderProfile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, user_type, admin_level, email, first_name, last_name, country_id')
      .eq('id', user.id)
      .single();

    if (profileError || !senderProfile) {
      return NextResponse.json(
        { error: 'Could not verify sender profile' },
        { status: 403 }
      );
    }

    // Check if user is admin (user_type === 'admin' or has admin_level)
    const isAdmin = senderProfile.user_type === 'admin' ||
                    senderProfile.admin_level === 'super' ||
                    senderProfile.admin_level === 'owner' ||
                    senderProfile.admin_level === 'basic';

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required to send emails' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { recipientId, recipientEmail, recipientName, subject, body: emailBody, templateId } = body;

    // Validate required fields
    if (!recipientEmail || !subject || !emailBody) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail, subject, body' },
        { status: 400 }
      );
    }

    // Send email via Resend
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject: subject,
      html: convertToHtml(emailBody),
      headers: {
        'X-Entity-Ref-ID': 'admin-email',
        'X-Sender-Admin-Id': user.id,
      },
    });

    // Check for Resend errors
    if (result.error) {
      console.error('Resend API error:', result.error);
      return NextResponse.json(
        { error: result.error.message || 'Failed to send email' },
        { status: 500 }
      );
    }

    // Log the email to admin_emails table for tracking
    const { error: logError } = await serviceClient
      .from('admin_emails')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId || null,
        recipient_email: recipientEmail,
        country_id: senderProfile.country_id || null,
        subject: subject,
        body: emailBody,
        template_id: templateId || null,
        resend_id: result.data?.id || null,
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

    if (logError) {
      // Log error but don't fail - email was sent successfully
      console.error('Error logging email to database:', logError);
    }

    return NextResponse.json({
      success: true,
      emailId: result.data?.id,
      message: `Email sent successfully to ${recipientEmail}`,
    });

  } catch (error) {
    console.error('Error in send-email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Convert plain text to basic HTML with paragraph breaks
 */
function convertToHtml(text: string): string {
  // Escape HTML entities
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Convert line breaks to paragraphs
  const paragraphs = escaped
    .split(/\n\n+/)
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.5;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  // Wrap in basic HTML template
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
        This email was sent from Portal Home Hub Admin Dashboard.
      </p>
    </body>
    </html>
  `;
}
