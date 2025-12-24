import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Create Supabase client with service role for inserts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Site configuration for emails
const SITE_CONFIG: Record<string, { name: string; email: string; domain: string; whatsapp: string }> = {
  GY: {
    name: 'Guyana Home Hub',
    email: 'notifications@guyanahomehub.com',
    domain: 'guyanahomehub.com',
    whatsapp: '+592 600 1234',
  },
  JM: {
    name: 'Jamaica Home Hub',
    email: 'notifications@jamaicahomehub.com',
    domain: 'jamaicahomehub.com',
    whatsapp: '+1 876 555 1234',
  },
};

interface BusinessSubmissionData {
  site_id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  email: string;
  category: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: BusinessSubmissionData = await request.json();

    // Validate required fields
    const requiredFields = ['site_id', 'business_name', 'owner_name', 'phone', 'email', 'category'];
    const missingFields = requiredFields.filter(field => !data[field as keyof BusinessSubmissionData]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate site_id
    const siteId = data.site_id.toUpperCase();
    if (!SITE_CONFIG[siteId]) {
      return NextResponse.json(
        { error: 'Invalid site_id. Must be GY or JM.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Prepare data for database insertion
    const submissionData = {
      site_id: siteId,
      business_name: data.business_name,
      owner_name: data.owner_name,
      phone: data.phone,
      email: data.email.toLowerCase(),
      category: data.category,
      description: data.description || null,
      status: 'pending',
    };

    // Insert into database
    const { data: insertedData, error } = await supabase
      .from('business_submissions')
      .insert([submissionData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to submit business. Please try again.' },
        { status: 500, headers: corsHeaders }
      );
    }

    const siteConfig = SITE_CONFIG[siteId];

    // Send admin notification email
    try {
      const adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0;">New Business Submission</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">${siteConfig.name} Directory</p>
            </div>

            <div style="background: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">Business Details</h2>
              <p><strong>Business Name:</strong> ${data.business_name}</p>
              <p><strong>Owner:</strong> ${data.owner_name}</p>
              <p><strong>Category:</strong> ${data.category}</p>
              <p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>
              <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
              ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0;">
                Submission ID: ${insertedData.id}<br>
                Site: ${siteId} | Status: Pending Review
              </p>
            </div>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: `${siteConfig.name} <${siteConfig.email}>`,
        to: ['info@portalhomehub.com'],
        subject: `New Business Submission: ${data.business_name}`,
        html: adminEmailHtml,
      });
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
      // Continue - don't fail if email fails
    }

    // Send confirmation email to submitter
    try {
      const confirmationEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0;">Thank You!</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">We received your business submission</p>
            </div>

            <div style="margin-bottom: 25px;">
              <p>Dear ${data.owner_name},</p>
              <p>Thank you for submitting <strong>${data.business_name}</strong> to the ${siteConfig.name} business directory.</p>
              <p>Our team will review your submission and get back to you within <strong>48 hours</strong>.</p>
            </div>

            <div style="background: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">What happens next?</h2>
              <ul style="color: #475569; padding-left: 20px;">
                <li>We'll verify your business details</li>
                <li>You'll receive an email once approved</li>
                <li>Your listing will appear in our directory</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px; padding: 20px; background: #dbeafe; border-radius: 6px;">
              <p style="margin: 0; color: #1e40af;">
                <strong>Questions?</strong><br>
                Contact us on WhatsApp: ${siteConfig.whatsapp}
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0; font-size: 14px;">
                ${siteConfig.name}<br>
                Your trusted home services directory
              </p>
            </div>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: `${siteConfig.name} <${siteConfig.email}>`,
        to: [data.email],
        subject: `We received your submission - ${siteConfig.name}`,
        html: confirmationEmailHtml,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Continue - don't fail if email fails
    }

    console.log(`Business submission created: ${insertedData.id} for ${data.business_name}`);

    return NextResponse.json(
      {
        success: true,
        message: "Submission received. We'll review and contact you within 48 hours.",
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Business submission API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
