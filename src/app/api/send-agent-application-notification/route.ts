import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/supabase-admin';

const resend = new Resend(process.env.RESEND_API_KEY);

interface AgentApplicationData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name?: string;
  years_experience?: string;
  specialties?: string;
  target_region?: string;
  selected_plan?: string;
  is_founding_member?: boolean;
  reference1_name?: string;
  reference1_phone?: string;
  reference1_email?: string;
  reference2_name?: string;
  reference2_phone?: string;
  reference2_email?: string;
  submitted_at: string;
  country: string;
}

// Country code to name mapping
const countryNames: Record<string, string> = {
  'GY': 'Guyana',
  'JM': 'Jamaica',
  'CO': 'Colombia',
};

export async function POST(request: NextRequest) {
  try {
    const application: AgentApplicationData = await request.json();

    if (!application.email || !application.first_name || !application.country) {
      return NextResponse.json(
        { error: 'Missing required application data' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const countryName = countryNames[application.country] || application.country;

    // 1. Get Owner Admin for this territory
    const { data: territory, error: territoryError } = await supabase
      .from('territories')
      .select(`
        country_name,
        owner_admin_id
      `)
      .eq('country_code', application.country)
      .single();

    if (territoryError || !territory) {
      console.warn(`Territory not found for ${application.country} - notification email not sent`);
      return NextResponse.json({
        success: false,
        message: 'Territory not found - no notification sent'
      });
    }

    if (!territory.owner_admin_id) {
      console.warn(`No Owner Admin assigned for territory ${application.country} - notification email not sent`);
      return NextResponse.json({
        success: false,
        message: 'No Owner Admin assigned - no notification sent'
      });
    }

    // 2. Get Owner Admin profile
    const { data: ownerAdmin, error: adminError } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('id', territory.owner_admin_id)
      .single();

    if (adminError || !ownerAdmin?.email) {
      console.warn(`Owner Admin profile not found for ${territory.owner_admin_id} - notification email not sent`);
      return NextResponse.json({
        success: false,
        message: 'Owner Admin profile not found - no notification sent'
      });
    }

    // 3. Determine plan display name
    let planDisplay = 'Not specified';
    if (application.is_founding_member) {
      planDisplay = 'Founding Member';
    } else if (application.selected_plan) {
      // Check if UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(application.selected_plan);
      if (isUUID) {
        const { data: plan } = await supabase
          .from('pricing_plans')
          .select('plan_name')
          .eq('id', application.selected_plan)
          .single();
        planDisplay = plan?.plan_name || application.selected_plan;
      } else {
        // Format string identifiers nicely
        planDisplay = application.selected_plan
          .split('_')
          .map(w => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
    }

    // 4. Format submitted date
    const submittedDate = application.submitted_at
      ? new Date(application.submitted_at).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Just now';

    // 5. Generate email HTML
    const emailHtml = generateEmailHTML({
      ownerAdminName: ownerAdmin.first_name || 'Admin',
      countryName: territory.country_name || countryName,
      applicant: application,
      planDisplay,
      submittedDate
    });

    // 6. Send notification email
    await resend.emails.send({
      from: 'Portal HomeHub <notifications@portalhomehub.com>',
      to: [ownerAdmin.email],
      subject: `New Agent Application - ${application.first_name} ${application.last_name} - ${territory.country_name || countryName}`,
      html: emailHtml,
    });

    console.log(`✅ Agent application notification sent to Owner Admin: ${ownerAdmin.email}`);

    return NextResponse.json({
      success: true,
      message: `Notification sent to ${ownerAdmin.email}`
    });

  } catch (error: any) {
    console.error('Agent application notification email error:', error);

    // Return success false but don't fail the request
    return NextResponse.json(
      {
        success: false,
        error: 'Email service error',
        message: 'Notification email failed but application was submitted'
      },
      { status: 200 }
    );
  }
}

function generateEmailHTML(data: {
  ownerAdminName: string;
  countryName: string;
  applicant: AgentApplicationData;
  planDisplay: string;
  submittedDate: string;
}): string {
  const { ownerAdminName, countryName, applicant, planDisplay, submittedDate } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Agent Application</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d4a6f 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0; font-size: 24px;">🏠 New Agent Application</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${countryName} HomeHub</p>
    </div>

    <!-- Content -->
    <div style="padding: 30px 20px; background: #ffffff; border-radius: 0 0 8px 8px;">
      <p style="margin: 0 0 20px 0;">Hi ${ownerAdminName},</p>

      <p style="margin: 0 0 25px 0;"><strong>${applicant.first_name} ${applicant.last_name}</strong> has applied to join ${countryName} HomeHub as an agent.</p>

      <!-- Applicant Details Section -->
      <div style="margin-bottom: 25px;">
        <div style="font-weight: bold; color: #1e3a5f; border-bottom: 2px solid #22c55e; padding-bottom: 8px; margin-bottom: 15px; font-size: 16px;">
          📋 Applicant Details
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 130px; vertical-align: top;">Name:</td>
            <td style="padding: 8px 0;">${applicant.first_name} ${applicant.last_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Email:</td>
            <td style="padding: 8px 0;"><a href="mailto:${applicant.email}" style="color: #2563eb;">${applicant.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Phone:</td>
            <td style="padding: 8px 0;">${applicant.phone || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Company:</td>
            <td style="padding: 8px 0;">${applicant.company_name || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Experience:</td>
            <td style="padding: 8px 0;">${applicant.years_experience || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Specialties:</td>
            <td style="padding: 8px 0;">${applicant.specialties || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Target Region:</td>
            <td style="padding: 8px 0;">${applicant.target_region || 'Not specified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Plan:</td>
            <td style="padding: 8px 0;">${planDisplay}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Applied:</td>
            <td style="padding: 8px 0;">${submittedDate}</td>
          </tr>
        </table>
      </div>

      <!-- References Section -->
      <div style="margin-bottom: 25px;">
        <div style="font-weight: bold; color: #1e3a5f; border-bottom: 2px solid #22c55e; padding-bottom: 8px; margin-bottom: 15px; font-size: 16px;">
          📞 References to Verify
        </div>

        <!-- Reference 1 -->
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; margin-bottom: 12px; border-left: 4px solid #22c55e; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <strong style="color: #1e3a5f;">Reference 1</strong><br>
          <span style="color: #555;">Name:</span> ${applicant.reference1_name || 'Not provided'}<br>
          <span style="color: #555;">Phone:</span> ${applicant.reference1_phone || 'Not provided'}<br>
          <span style="color: #555;">Email:</span> ${applicant.reference1_email ? `<a href="mailto:${applicant.reference1_email}" style="color: #2563eb;">${applicant.reference1_email}</a>` : 'Not provided'}
        </div>

        <!-- Reference 2 -->
        <div style="background: #ffffff; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <strong style="color: #1e3a5f;">Reference 2</strong><br>
          <span style="color: #555;">Name:</span> ${applicant.reference2_name || 'Not provided'}<br>
          <span style="color: #555;">Phone:</span> ${applicant.reference2_phone || 'Not provided'}<br>
          <span style="color: #555;">Email:</span> ${applicant.reference2_email ? `<a href="mailto:${applicant.reference2_email}" style="color: #2563eb;">${applicant.reference2_email}</a>` : 'Not provided'}
        </div>
      </div>

      <p style="margin: 0 0 25px 0;">You can review and approve/reject this application in the Portal dashboard.</p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://portalhomehub.com/admin-dashboard/unified"
           style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Review Application
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
      <p style="margin: 0 0 5px 0;">Portal HomeHub - Agent Application Notification</p>
      <p style="margin: 0;">You received this because you are the Owner Admin for ${countryName} HomeHub.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}
