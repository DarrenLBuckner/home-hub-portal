import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { agentEmail, agentName, country } = await request.json();

    if (!agentEmail || !agentName) {
      return NextResponse.json(
        { error: 'Missing required email data' },
        { status: 400 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">🌟 Welcome to the Portal Home Hub Beta Program!</h2>
        
        <p>Hello ${agentName},</p>
        
        <p>Welcome to <strong>Portal Home Hub</strong>, part of the Caribbean Home Hub network!</p>
        
        <div style="background: #ecfdf5; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
          <h3 style="color: #047857; margin-top: 0;">🚀 You're a Founding Member!</h3>
          <p style="margin-bottom: 0;">As one of our founding agents, you're helping to shape the future of real estate across the Caribbean and beyond. We're building something revolutionary - an enterprise platform that will change the landscape of real estate throughout our region.</p>
        </div>
        
        <div style="background: #fefbf3; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
          <h3 style="color: #d97706; margin-top: 0;">🧪 This is a Beta Program</h3>
          <p><strong>We need your patience and partnership!</strong></p>
          <p>As we're actively developing this cutting-edge platform, you may encounter some issues or areas for improvement. This is completely normal for a beta program, and your experience helps us build something amazing.</p>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">How You Can Help Us Succeed:</h3>
          <ul>
            <li><strong>🗣️ Share the platform</strong> - Tell other agents and industry professionals</li>
            <li><strong>💬 Give us feedback</strong> - Your insights help us improve</li>
            <li><strong>🐛 Report issues</strong> - When something doesn't work, let us know</li>
            <li><strong>🤝 Be patient</strong> - We're working hard to perfect the experience</li>
          </ul>
        </div>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📧 Found an issue or have feedback?</strong></p>
          <p style="margin: 5px 0 0 0;">Please send all issues, suggestions, and feedback to: <a href="mailto:info@portalhomehub.com" style="color: #ef4444; font-weight: bold;">info@portalhomehub.com</a></p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://portalhomehub.com/agent-dashboard" 
             style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            🚀 Access Your Beta Dashboard
          </a>
        </div>
        
        <p>Thank you for being part of this exciting journey. Together, we're not just building a platform - we're creating the future of Caribbean real estate.</p>
        
        <p>Your pioneering spirit and feedback will help us launch something truly special for agents across the Caribbean and beyond.</p>
        
        <p style="font-weight: bold;">Welcome to the founding team!</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Portal Home Hub Beta Team</strong><br>
          Caribbean Home Hub Network<br>
          Email: <a href="mailto:info@portalhomehub.com">info@portalhomehub.com</a><br>
          Website: <a href="https://portalhomehub.com">portalhomehub.com</a><br>
          ${country === 'GY' ? 'Guyana Office' : 'Caribbean Regional Office'}
        </p>
      </div>
    `;

    const emailText = `
Welcome to the Portal Home Hub Beta Program!

Hello ${agentName},

Welcome to Portal Home Hub, part of the Caribbean Home Hub network!

🚀 YOU'RE A FOUNDING MEMBER!
As one of our founding agents, you're helping to shape the future of real estate across the Caribbean and beyond. We're building something revolutionary - an enterprise platform that will change the landscape of real estate throughout our region.

🧪 THIS IS A BETA PROGRAM
We need your patience and partnership!

As we're actively developing this cutting-edge platform, you may encounter some issues or areas for improvement. This is completely normal for a beta program, and your experience helps us build something amazing.

HOW YOU CAN HELP US SUCCEED:
- 🗣️ Share the platform - Tell other agents and industry professionals
- 💬 Give us feedback - Your insights help us improve
- 🐛 Report issues - When something doesn't work, let us know
- 🤝 Be patient - We're working hard to perfect the experience

📧 FOUND AN ISSUE OR HAVE FEEDBACK?
Please send all issues, suggestions, and feedback to: info@portalhomehub.com

Access your beta dashboard at: https://portalhomehub.com/agent-dashboard

Thank you for being part of this exciting journey. Together, we're not just building a platform - we're creating the future of Caribbean real estate.

Your pioneering spirit and feedback will help us launch something truly special for agents across the Caribbean and beyond.

Welcome to the founding team!

---
Portal Home Hub Beta Team
Caribbean Home Hub Network
Email: info@portalhomehub.com
Website: portalhomehub.com
${country === 'GY' ? 'Guyana Office' : 'Caribbean Regional Office'}
    `;

    await resend.emails.send({
      from: 'Portal Home Hub Beta Team <info@portalhomehub.com>',
      to: [agentEmail],
      subject: `🌟 Welcome to Portal Home Hub Beta - You're a Founding Member!`,
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Beta welcome email error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email service temporarily unavailable',
        message: 'Beta welcome email failed to send'
      },
      { status: 500 }
    );
  }
}