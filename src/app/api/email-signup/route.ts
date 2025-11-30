import { NextRequest, NextResponse } from 'next/server';
import { sendPropertyGuideEmail } from '../../../lib/email.js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const allowedOrigins = [
  'https://guyanahomehub.com',
  'https://www.guyanahomehub.com',
  'https://jamaicahomehub.com', 
  'https://guyana-home-hub.vercel.app'
];

const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration matching leads API
const EMAIL_CONFIG = {
  MARKETING_TO: ['qumar@guyanahomehub.com'],
  FROM: 'Guyana Home Hub <leads@portalhomehub.com>',
  BCC: ['darren@portalhomehub.com'] // Direct notification to Darren
};

function getCorsHeaders(origin: string | null) {
  // Check if the origin is in our allowed list
  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : (process.env.NODE_ENV === 'development' ? '*' : null);
    
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };

  if (allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }

  return headers;
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin)
  });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Create Supabase client for database storage
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Determine which site this signup came from
    const sourceSite = origin?.includes('jamaica') ? 'jamaicahomehub.com' : 'guyanahomehub.com';
    
    // Prepare lead data for database
    const leadData = {
      first_name: 'Property Guide', // Generic since we only have email
      last_name: 'Subscriber',
      email: email,
      inquiry_type: 'general',
      subject: `Free Property Guide Request from ${sourceSite}`,
      message: `User requested the free property guide via email signup popup on ${sourceSite}`,
      country: origin?.includes('jamaica') ? 'JM' : 'GY',
      source: 'email_signup_popup',
      page_url: origin || null,
      status: 'new',
      priority: 'medium'
    };

    // Insert into leads database
    const { data: insertedLead, error: dbError } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      // Continue with email sending even if database fails
    }

    // Send property guide email to subscriber
    try {
      await sendPropertyGuideEmail(email);
      console.log('Property guide sent to:', email, 'from origin:', origin);
    } catch (emailError) {
      console.error('Error sending property guide email:', emailError);
      // Continue with admin notification even if guide email fails
    }

    // Send admin notification
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #2563eb; margin: 0;">📧 New Email Signup for Property Guide</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">Guyana Home Hub Marketing Lead</p>
            </div>

            <div style="background: #f0f9ff; padding: 20px; border-radius: 6px; margin-bottom: 25px; border-left: 4px solid #2563eb;">
              <h2 style="color: #2563eb; margin: 0 0 15px 0;">📋 Signup Details</h2>
              <div>
                ${insertedLead ? `<div><strong>Lead ID:</strong> ${insertedLead.id}</div>` : ''}
                <div><strong>Email:</strong> <a href="mailto:${email}">${email}</a></div>
                <div><strong>Source:</strong> ${sourceSite} email popup</div>
                <div><strong>Origin:</strong> ${origin || 'Unknown'}</div>
                <div><strong>Country:</strong> ${leadData.country === 'JM' ? 'Jamaica' : 'Guyana'}</div>
                <div><strong>Timestamp:</strong> ${new Date().toLocaleString()}</div>
              </div>
            </div>

            <div style="background: #dcfce7; padding: 20px; border-radius: 6px; border-left: 4px solid #16a34a;">
              <h3 style="color: #16a34a; margin: 0 0 10px 0;">✅ Actions Completed:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Property guide automatically sent to subscriber</li>
                ${insertedLead ? '<li>Lead saved to database for follow-up</li>' : '<li style="color: #dc2626;">⚠️ Database save failed - manual entry may be needed</li>'}
                <li>Admin notification sent (this email)</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 25px; padding: 20px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: bold; color: #d97706;">
                💼 This is a warm lead - they've already received valuable content!<br>
                Perfect opportunity for follow-up within 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      `;

      await resend.emails.send({
        from: EMAIL_CONFIG.FROM,
        to: EMAIL_CONFIG.MARKETING_TO,
        bcc: EMAIL_CONFIG.BCC,
        subject: `📧 New Property Guide Signup from ${sourceSite}`,
        html: emailHtml,
      });

      console.log(`✅ Admin notification sent for email signup: ${email} (Lead ID: ${insertedLead?.id || 'N/A'})`);

    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError);
    }

    console.log('Email signup completed:', {
      email,
      origin,
      leadId: insertedLead?.id,
      source: sourceSite
    });
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Email registered successfully! Check your inbox for your free property guide.',
        leadId: insertedLead?.id 
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Email signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}