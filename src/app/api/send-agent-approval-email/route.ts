import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { agentEmail, agentName, country, isFoundingMember, spotNumber } = await request.json();

    if (!agentEmail || !agentName) {
      return NextResponse.json(
        { error: 'Missing required email data' },
        { status: 400 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">

        <div style="text-align: center; margin-bottom: 24px;">
          <img src="https://www.guyanahomehub.com/icons/icon-512x512.png" alt="Guyana Home Hub" width="72" height="72" style="border-radius: 12px;">
        </div>

        <h2 style="color: #047857;">You're approved.</h2>

        <p>Hello ${agentName},</p>

        <p>Your agent application is approved. Your account is live and ready. Here's how to get in — read this part carefully.</p>

        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 8px;"><strong>Your account was created under this email:</strong></p>
          <p style="margin: 0; font-size: 18px; color: #047857;"><strong>${agentEmail}</strong></p>
          <p style="margin: 8px 0 0; font-size: 14px; color: #374151;">Use this exact email to log in — even if you're reading this message somewhere else.</p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://www.portalhomehub.com/dashboard/agent"
             style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            Log in to your dashboard
          </a>
        </div>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
          <p style="margin: 0 0 6px;"><strong>Forgot the password you chose when you registered?</strong></p>
          <p style="margin: 0;">That's normal — it was weeks ago. Here's how to fix it:</p>
          <p style="margin: 8px 0 0;">Go to <a href="https://www.portalhomehub.com/login" style="color: #047857; font-weight: bold;">www.portalhomehub.com/login</a> → click <strong>"Forgot Password"</strong> → put in your email <strong>${agentEmail}</strong>. We'll send you a link to set a new password. Do that and you're in.</p>
        </div>

        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Check your spam folder.</strong> If this email landed in spam or junk, mark it <strong>"Not Spam"</strong>. It's a small thing, but it helps our emails reach the next agent.</p>
        </div>

        <p style="margin: 20px 0;">New to the dashboard? Here's a short video on posting your first listing: <a href="https://youtu.be/Q_GFflHQjE0" style="color: #047857; font-weight: bold;">watch the tutorial</a>.</p>

        <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Stuck? Message us on WhatsApp:</strong> <a href="https://wa.me/5927629797" style="color: #047857; font-weight: bold;">+592 762 9797</a>. We'll get you sorted.</p>
        </div>

        <p>Welcome in.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Portal Home Hub Agent Team</strong><br>
          Email: agents@portalhomehub.com<br>
          Website: <a href="https://www.portalhomehub.com" style="color: #047857;">www.portalhomehub.com</a><br>
          WhatsApp: +592 762 9797
        </p>
      </div>
    `;

    const emailText = `
You're approved.

Hello ${agentName},

Your agent application is approved. Your account is live and ready. Here's how to get in — read this part carefully.

YOUR ACCOUNT WAS CREATED UNDER THIS EMAIL:
${agentEmail}
Use this exact email to log in — even if you're reading this message somewhere else.

LOG IN:
https://www.portalhomehub.com/dashboard/agent

FORGOT THE PASSWORD YOU CHOSE WHEN YOU REGISTERED?
That's normal — it was weeks ago. Here's how to fix it:
Go to www.portalhomehub.com/login -> click "Forgot Password" -> put in your email ${agentEmail}. We'll send you a link to set a new password. Do that and you're in.

CHECK YOUR SPAM FOLDER:
If this email landed in spam or junk, mark it "Not Spam". It's a small thing, but it helps our emails reach the next agent.

New to the dashboard? Watch a short video on posting your first listing:
https://youtu.be/Q_GFflHQjE0

STUCK? Message us on WhatsApp: +592 762 9797. We'll get you sorted.

Welcome in.

---
Portal Home Hub Agent Team
Email: agents@portalhomehub.com
Website: www.portalhomehub.com
WhatsApp: +592 762 9797
    `;

    await resend.emails.send({
      from: 'Portal Home Hub <agents@portalhomehub.com>',
      to: [agentEmail],
      subject: `You're approved — here's how to get into Portal Home Hub`,
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Agent approval email error:', error);
    
    // Return success even if email fails to keep admin system running
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email service temporarily unavailable',
        message: 'Agent was approved successfully, but email notification failed'
      },
      { status: 200 }
    );
  }
}