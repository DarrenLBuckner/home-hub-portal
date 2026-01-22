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

// Default templates if no database templates exist
const DEFAULT_TEMPLATES = [
  {
    id: 'default-welcome',
    name: 'Welcome Message',
    category: 'General',
    subject: 'Welcome to Portal Home Hub, {{first_name}}!',
    body: `Hi {{first_name}},

Welcome to Portal Home Hub! We're thrilled to have you join our community.

Your account ({{account_code}}) is now active and ready to use. As a {{user_type}}, you have access to all the tools you need to manage your real estate listings.

If you have any questions, don't hesitate to reach out to our support team.

Best regards,
The Portal Home Hub Team`,
  },
  {
    id: 'default-payment-reminder',
    name: 'Payment Reminder',
    category: 'Billing',
    subject: 'Payment Reminder - {{first_name}}',
    body: `Hi {{first_name}},

This is a friendly reminder that your subscription payment is due.

Account: {{account_code}}
Current Status: {{subscription_status}}

Please ensure your payment is up to date to maintain uninterrupted access to your listings.

If you have any questions about your billing, please contact our support team.

Best regards,
The Portal Home Hub Team`,
  },
  {
    id: 'default-listing-issue',
    name: 'Listing Issue Notice',
    category: 'Listings',
    subject: 'Action Required: Issue with Your Listing',
    body: `Hi {{first_name}},

We've noticed an issue with one of your property listings that requires your attention.

Please log in to your dashboard and review your listings to ensure all information is accurate and complete.

If you need assistance, our support team is here to help.

Best regards,
The Portal Home Hub Team`,
  },
  {
    id: 'default-account-update',
    name: 'Account Update',
    category: 'Account',
    subject: 'Important Update to Your Account',
    body: `Hi {{first_name}},

We wanted to inform you about an important update to your Portal Home Hub account.

Account: {{account_code}}
Type: {{user_type}}

Please log in to your dashboard to review the changes and ensure your profile information is up to date.

Best regards,
The Portal Home Hub Team`,
  },
  {
    id: 'default-suspension-warning',
    name: 'Suspension Warning',
    category: 'Account',
    subject: 'Urgent: Account Suspension Warning',
    body: `Hi {{first_name}},

This is an important notice regarding your Portal Home Hub account.

Your account ({{account_code}}) is at risk of suspension due to policy violations or payment issues. Please take immediate action to resolve this matter.

If you believe this is in error, please contact us immediately.

Best regards,
The Portal Home Hub Team`,
  },
  {
    id: 'default-property-created-for-user',
    name: 'Property Created For You',
    category: 'Listings',
    subject: 'Your Property Has Been Listed on {{site_name}}!',
    body: `Hi {{first_name}},

Great news! A property listing has been created on your behalf and is now live on {{site_name}}.

Property Details:
• Title: {{property_title}}
• Location: {{city}}, {{region}}
• Listing Type: {{listing_type}}

What happens next?
• Your property is now visible to potential buyers/renters
• You'll receive inquiries directly via email and WhatsApp
• You can manage and edit your listing from your dashboard

View and manage your listing here:
{{dashboard_link}}

If you have any questions about your listing or need assistance, please don't hesitate to contact our support team.

Best regards,
The {{site_name}} Team`,
  },
];

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
      .select('user_type, admin_level')
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

    // Fetch templates from database
    const { data: dbTemplates, error: templatesError } = await serviceClient
      .from('email_templates')
      .select('*')
      .order('name', { ascending: true });

    if (templatesError) {
      console.error('Error fetching email templates:', templatesError);
    }

    // Combine database templates with defaults
    // Database templates first, then built-in defaults
    const allTemplates = [
      ...(dbTemplates || []),
      ...DEFAULT_TEMPLATES,
    ];

    return NextResponse.json({
      templates: allTemplates,
      source: dbTemplates && dbTemplates.length > 0 ? 'combined' : 'default',
    });

  } catch (error) {
    console.error('Error in email-templates API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
