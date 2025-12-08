import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { agentEmail, agentName, country, submittedAt } = await request.json();

    if (!agentEmail || !agentName) {
      return NextResponse.json(
        { error: 'Missing required email data' },
        { status: 400 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">📋 Agent Application Received - Under Review</h2>
        
        <p>Hello ${agentName},</p>
        
        <p>Thank you for applying to become an agent with Portal Home Hub! We've successfully received your application and it's now under review.</p>
        
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">Application Status: Under Review</h3>
          <div style="background: white; padding: 15px; border-radius: 6px;">
            <p style="margin: 0;"><strong>📧 Email:</strong> ${agentEmail}</p>
            <p style="margin: 8px 0 0 0;"><strong>📅 Submitted:</strong> ${submittedAt || 'Just now'}</p>
            <p style="margin: 8px 0 0 0;"><strong>🌍 Country:</strong> ${country === 'GY' ? 'Guyana' : country}</p>
          </div>
        </div>
        
        <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #d97706; margin-top: 0;">⏰ What Happens Next:</h3>
          <ul style="margin: 10px 0;">
            <li><strong>Review Period:</strong> We'll review your application within <strong>48 hours</strong></li>
            <li><strong>Verification Process:</strong> We may verify your credentials and references</li>
            <li><strong>Email Notification:</strong> You'll receive an email with our decision</li>
            <li><strong>Quick Start:</strong> If approved, you'll get immediate access to your agent dashboard</li>
          </ul>
        </div>

        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #047857; margin-top: 0;">💡 While You Wait:</h3>
          <ul>
            <li>📱 <strong>Follow us on social media</strong> for platform updates and tips - Follow your home country's page (e.g., Guyana Home Hub)</li>
            <li>📚 <strong>Review our agent resources</strong> at portalhomehub.com/agent-resources</li>
            <li>🎯 <strong>Prepare your agent profile</strong> - think about your bio and specialties</li>
            <li>📸 <strong>Professional photo required</strong> - Upload a high-quality professional headshot for your profile</li>
            <li>📋 <strong>Gather marketing materials</strong> - photos and company information</li>
          </ul>
        </div>

        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Important:</strong> Please do not submit multiple applications. Duplicate applications may delay your review process.</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://portalhomehub.com/agent-resources" 
             style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            📚 View Agent Resources
          </a>
        </div>
        
        <p>If you have any questions about your application or the review process, feel free to contact our team.</p>
        
        <p>Thank you for your interest in joining Portal Home Hub!</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Portal Home Hub Agent Review Team</strong><br>
          Email: agents@portalhomehub.com<br>
          Website: <a href="https://portalhomehub.com">portalhomehub.com</a><br>
          ${country === 'GY' ? 'Guyana Office: +592-762-9797' : 'Main Office: +592-762-9797'}
        </p>
      </div>
    `;

    const emailText = `
Agent Application Received - Under Review

Hello ${agentName},

Thank you for applying to become an agent with Portal Home Hub! We've successfully received your application and it's now under review.

APPLICATION STATUS: Under Review
- Email: ${agentEmail}
- Submitted: ${submittedAt || 'Just now'}
- Country: ${country === 'GY' ? 'Guyana' : country}

WHAT HAPPENS NEXT:
- Review Period: We'll review your application within 48 hours
- Verification Process: We may verify your credentials and references
- Email Notification: You'll receive an email with our decision  
- Quick Start: If approved, you'll get immediate access to your agent dashboard

WHILE YOU WAIT:
- Follow us on social media for platform updates and tips - Follow your home country's page (e.g., Guyana Home Hub)
- Review our agent resources at portalhomehub.com/agent-resources
- Prepare your agent profile - think about your bio and specialties
- Professional photo required - Upload a high-quality professional headshot for your profile
- Gather marketing materials - photos and company information

IMPORTANT: Please do not submit multiple applications. Duplicate applications may delay your review process.

If you have any questions about your application or the review process, feel free to contact our team.

Thank you for your interest in joining Portal Home Hub!

---
Portal Home Hub Agent Review Team
Email: agents@portalhomehub.com
Website: portalhomehub.com
${country === 'GY' ? 'Guyana Office: +592-762-9797' : 'Main Office: +592-762-9797'}
    `;

    await resend.emails.send({
      from: 'Portal Home Hub <agents@portalhomehub.com>',
      to: [agentEmail],
      subject: `📋 Agent Application Received - Review in Progress`,
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Agent confirmation email error:', error);
    
    // Return success even if email fails to keep registration working
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email service temporarily unavailable',
        message: 'Application was submitted successfully, but confirmation email failed'
      },
      { status: 200 }
    );
  }
}