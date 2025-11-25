import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const EMAIL_CONFIG = {
  // Lead notifications - Qumar responds, you oversee
  LEADS_TO: ['qumar@guyanahomehub.com'],
  TECHNICAL_TO: ['technical@portalhomehub.com'],
  PARTNERSHIPS_TO: ['qumar@guyanahomehub.com'],
  
  FROM: 'Portal Home Hub <leads@portalhomehub.com>',
  BCC: ['manager@portalhomehub.com'] // You get copy of everything
};

interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  inquiryType: 'general' | 'technical_support' | 'agent_question' | 'landlord_question' | 'partnership' | 'other';
  subject: string;
  message: string;
  country?: string;
  source?: string;
  pageUrl?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export async function POST(request: NextRequest) {
  try {
    const data: LeadData = await request.json();

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.subject || !data.message || !data.inquiryType) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, subject, message, inquiryType' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate inquiry type
    const validInquiryTypes = ['general', 'technical_support', 'agent_question', 'landlord_question', 'partnership', 'other'];
    if (!validInquiryTypes.includes(data.inquiryType)) {
      return NextResponse.json(
        { error: 'Invalid inquiry type' },
        { status: 400 }
      );
    }

    // Create Supabase client
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

    // Prepare data for database
    const leadData = {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone || null,
      company: data.company || null,
      inquiry_type: data.inquiryType,
      subject: data.subject,
      message: data.message,
      country: data.country || null,
      source: data.source || 'website',
      page_url: data.pageUrl || null,
      utm_source: data.utmSource || null,
      utm_medium: data.utmMedium || null,
      utm_campaign: data.utmCampaign || null,
      status: 'new',
      priority: data.inquiryType === 'technical_support' ? 'high' : 'medium'
    };

    // Insert into database
    const { data: insertedLead, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to submit inquiry. Please try again.' },
        { status: 500 }
      );
    }

    // Determine email recipients based on inquiry type
    let recipients: string[] = [];
    let subject = '';
    
    switch (data.inquiryType) {
      case 'technical_support':
        recipients = EMAIL_CONFIG.TECHNICAL_TO;
        subject = `🔧 Technical Support: ${data.subject}`;
        break;
      case 'partnership':
        recipients = EMAIL_CONFIG.PARTNERSHIPS_TO;
        subject = `🤝 Partnership Inquiry: ${data.subject}`;
        break;
      case 'agent_question':
        recipients = EMAIL_CONFIG.LEADS_TO;
        subject = `🏢 Agent Inquiry: ${data.subject}`;
        break;
      case 'landlord_question':
        recipients = EMAIL_CONFIG.LEADS_TO;
        subject = `🏠 Landlord Inquiry: ${data.subject}`;
        break;
      default:
        recipients = EMAIL_CONFIG.LEADS_TO;
        subject = `📩 General Inquiry: ${data.subject}`;
    }

    // Send email notification
    try {
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
          <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e40af; margin: 0;">${getInquiryIcon(data.inquiryType)} New ${getInquiryTypeLabel(data.inquiryType)}</h1>
              <p style="color: #64748b; margin: 10px 0 0 0;">Portal Home Hub Lead Capture</p>
            </div>

            <div style="background: #f1f5f9; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">📋 Lead Summary</h2>
              <div>
                <div><strong>Lead ID:</strong> ${insertedLead.id}</div>
                <div><strong>Inquiry Type:</strong> ${getInquiryTypeLabel(data.inquiryType)}</div>
                <div><strong>Priority:</strong> ${leadData.priority.toUpperCase()}</div>
                <div><strong>Submitted:</strong> ${new Date().toLocaleString()}</div>
              </div>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">👤 Contact Information</h2>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
                <p><strong>Name:</strong> ${data.firstName} ${data.lastName}</p>
                <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
                ${data.phone ? `<p><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></p>` : ''}
                ${data.company ? `<p><strong>Company:</strong> ${data.company}</p>` : ''}
                ${data.country ? `<p><strong>Country:</strong> ${data.country}</p>` : ''}
              </div>
            </div>

            <div style="margin-bottom: 25px;">
              <h2 style="color: #334155; margin: 0 0 15px 0;">💬 Message</h2>
              <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
                <p><strong>Subject:</strong> ${data.subject}</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 4px; margin-top: 10px;">
                  ${data.message.replace(/\n/g, '<br>')}
                </div>
              </div>
            </div>

            ${data.pageUrl || data.utmSource ? `
              <div style="margin-bottom: 25px;">
                <h2 style="color: #334155; margin: 0 0 15px 0;">📊 Source Information</h2>
                <div style="background: white; border: 1px solid #e2e8f0; border-radius: 4px; padding: 15px;">
                  ${data.pageUrl ? `<p><strong>Page URL:</strong> ${data.pageUrl}</p>` : ''}
                  ${data.utmSource ? `<p><strong>UTM Source:</strong> ${data.utmSource}</p>` : ''}
                  ${data.utmMedium ? `<p><strong>UTM Medium:</strong> ${data.utmMedium}</p>` : ''}
                  ${data.utmCampaign ? `<p><strong>UTM Campaign:</strong> ${data.utmCampaign}</p>` : ''}
                </div>
              </div>
            ` : ''}

            <div style="text-align: center; margin-top: 30px; padding: 20px; background: ${getPriorityColor(leadData.priority)}; border-radius: 6px;">
              <p style="margin: 0; font-weight: bold;">
                ${data.inquiryType === 'technical_support' ? 
                  '⚡ High Priority - Technical Support Request' : 
                  '📞 Please respond within 24 hours for best customer experience'
                }
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0;">
                📧 Reply directly to this email to respond to ${data.firstName}<br>
                📱 Direct contact: <a href="mailto:${data.email}">${data.email}</a>${data.phone ? ` | <a href="tel:${data.phone}">${data.phone}</a>` : ''}
              </p>
            </div>
          </div>
        </div>
      `;

      const emailText = `
NEW ${getInquiryTypeLabel(data.inquiryType).toUpperCase()} - Portal Home Hub

Lead ID: ${insertedLead.id}
Priority: ${leadData.priority.toUpperCase()}
Submitted: ${new Date().toLocaleString()}

CONTACT INFORMATION:
Name: ${data.firstName} ${data.lastName}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.company ? `Company: ${data.company}` : ''}
${data.country ? `Country: ${data.country}` : ''}

MESSAGE:
Subject: ${data.subject}
${data.message}

${data.pageUrl ? `Source Page: ${data.pageUrl}` : ''}
${data.utmSource ? `UTM Source: ${data.utmSource}` : ''}

---
Reply directly to respond to the lead.
Contact: ${data.email}${data.phone ? ` | ${data.phone}` : ''}
      `;

      await resend.emails.send({
        from: EMAIL_CONFIG.FROM,
        to: recipients,
        bcc: EMAIL_CONFIG.BCC,
        replyTo: data.email, // Allows direct reply to lead
        subject: subject,
        html: emailHtml,
        text: emailText,
      });

      console.log(`✅ Lead ${insertedLead.id} notification sent to ${recipients.join(', ')} (BCC: ${EMAIL_CONFIG.BCC.join(', ')})`);

    } catch (emailError) {
      console.error('Failed to send notification email:', emailError);
      // Continue - don't fail the lead capture if email fails
    }

    return NextResponse.json({
      success: true,
      leadId: insertedLead.id,
      message: 'Your inquiry has been submitted successfully. We\'ll get back to you within 24 hours!'
    });

  } catch (error) {
    console.error('Lead capture API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper functions
function getInquiryTypeLabel(type: string): string {
  const labels = {
    general: 'General Inquiry',
    technical_support: 'Technical Support Request',
    agent_question: 'Agent Question',
    landlord_question: 'Landlord Question', 
    partnership: 'Partnership Inquiry',
    other: 'Other Inquiry'
  };
  return labels[type as keyof typeof labels] || 'Inquiry';
}

function getInquiryIcon(type: string): string {
  const icons = {
    general: '📩',
    technical_support: '🔧',
    agent_question: '🏢',
    landlord_question: '🏠',
    partnership: '🤝',
    other: '💬'
  };
  return icons[type as keyof typeof icons] || '📩';
}

function getPriorityColor(priority: string): string {
  const colors = {
    high: '#fee2e2', // red
    medium: '#fef3c7', // yellow  
    low: '#f0f9ff' // blue
  };
  return colors[priority as keyof typeof colors] || '#f0f9ff';
}

// GET endpoint for admin dashboard to retrieve leads
export async function GET(request: NextRequest) {
  try {
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

    // Authentication check
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin access check
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (!profile || profile.user_type !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status');
    const inquiryType = url.searchParams.get('type');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (inquiryType) {
      query = query.eq('inquiry_type', inquiryType);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve leads' },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (status) {
      countQuery = countQuery.eq('status', status);
    }

    if (inquiryType) {
      countQuery = countQuery.eq('inquiry_type', inquiryType);
    }

    const { count } = await countQuery;

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}