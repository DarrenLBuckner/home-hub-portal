import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { agentEmail, agentName, rejectionReason, country } = await request.json();

    if (!agentEmail || !agentName || !rejectionReason) {
      return NextResponse.json(
        { error: 'Missing required email data' },
        { status: 400 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">📝 Agent Application - Additional Information Required</h2>
        
        <p>Hello ${agentName},</p>
        
        <p>Thank you for your interest in joining the Portal Home Hub agent network.</p>
        
        <p>After reviewing your application, we need some additional information or clarification before we can proceed with approval:</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Required Information:</h3>
          <div style="white-space: pre-line; line-height: 1.6; background: white; padding: 15px; border-radius: 6px;">
${rejectionReason}
          </div>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">Next Steps:</h3>
          <ol>
            <li>📝 <strong>Log into your account</strong> - Use your email and password to log in to Portal Home Hub</li>
            <li>👁️ <strong>View your application status</strong> - Go to your Agent Application Status page to see the feedback</li>
            <li>✏️ <strong>Edit and correct</strong> - Click "Edit & Resubmit Application" to update your information</li>
            <li>⏱️ <strong>Quick Review</strong> - We'll re-review your application within 24 hours</li>
            <li>🎯 <strong>Get Approved</strong> - Once complete, you'll receive agent access immediately</li>
          </ol>
        </div>

        <div style="background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
          <h3 style="color: #0369a1; margin-top: 0;">🔐 Quick Login & Resubmit:</h3>
          <p style="margin-top: 0;">Visit the link below to log into your account and access your application status:</p>
          <div style="text-align: center; margin: 15px 0;">
            <a href="https://portalhomehub.com/login" 
               style="background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              🔑 Log In to Portal Home Hub
            </a>
          </div>
          <p style="margin-bottom: 0; font-size: 14px; text-align: center;">After logging in, navigate to "Agent Application Status" to review the feedback and resubmit</p>
        </div>
        
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Important:</strong> This is not a rejection. We simply need more information to verify your credentials and ensure the best experience for our clients.</p>
        </div>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #047857; margin-top: 0;">Why We Verify Agents:</h3>
          <ul>
            <li>🛡️ <strong>Client Protection</strong> - Ensure all agents are qualified professionals</li>
            <li>🏆 <strong>Quality Assurance</strong> - Maintain high standards for our network</li>
            <li>🤝 <strong>Trust Building</strong> - Clients know they're working with verified experts</li>
            <li>📈 <strong>Better Results</strong> - Qualified agents provide better service and outcomes</li>
          </ul>
        </div>
        
        <p>If you have any questions about these requirements or need clarification, please don't hesitate to contact us.</p>
        
        <p>We look forward to welcoming you to the Portal Home Hub agent network!</p>
        
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
Agent Application - Additional Information Required

Hello ${agentName},

Thank you for your interest in joining the Portal Home Hub agent network.

After reviewing your application, we need some additional information or clarification before we can proceed with approval:

REQUIRED INFORMATION:
${rejectionReason}

NEXT STEPS:
1. Log into your account - Use your email and password to log in to Portal Home Hub
2. View your application status - Go to your Agent Application Status page to see the feedback
3. Edit and correct - Click "Edit & Resubmit Application" to update your information
4. Quick Review - We'll re-review your application within 24 hours
5. Get Approved - Once complete, you'll receive agent access immediately

QUICK LOGIN & RESUBMIT:
Visit the link below to log into your account and access your application status:
https://portalhomehub.com/login

After logging in, navigate to "Agent Application Status" to review the feedback and resubmit.

---

WHY WE VERIFY AGENTS:
- Client Protection - Ensure all agents are qualified professionals
- Quality Assurance - Maintain high standards for our network
- Trust Building - Clients know they're working with verified experts
- Better Results - Qualified agents provide better service and outcomes

Send your response to: agents@portalhomehub.com
Subject: Agent Application Response - ${agentName}

If you have any questions about these requirements or need clarification, please don't hesitate to contact us.

We look forward to welcoming you to the Portal Home Hub agent network!

---
Portal Home Hub Agent Review Team
Email: agents@portalhomehub.com
Website: portalhomehub.com
${country === 'GY' ? 'Guyana Office: +592-762-9797' : 'Main Office: +592-762-9797'}
    `;

    await resend.emails.send({
      from: 'Portal Home Hub <agents@portalhomehub.com>',
      to: [agentEmail],
      subject: `📝 Agent Application - Additional Information Required`,
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Agent rejection email error:', error);
    
    // Return success even if email fails to keep admin system running
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email service temporarily unavailable',
        message: 'Agent rejection was processed successfully, but email notification failed'
      },
      { status: 200 }
    );
  }
}