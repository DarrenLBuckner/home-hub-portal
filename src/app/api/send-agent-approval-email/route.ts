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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Welcome to the Portal Home Hub Agent Network!</h2>
        
        <p>Hello ${agentName},</p>
        
        <p>Congratulations! Your agent application has been <strong>approved</strong> and you are now part of the Portal Home Hub agent network.</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
          <h3 style="color: #047857; margin-top: 0;">Your Agent Benefits:</h3>
          <ul>
            <li>✅ Access to exclusive agent dashboard and tools</li>
            <li>🏠 Help clients buy, sell, and rent properties</li>
            <li>💼 Professional agent profile on our platform</li>
            <li>📊 Property management and client tools</li>
            <li>🌟 Marketing support and lead generation</li>
            <li>📱 Mobile-friendly agent tools</li>
          </ul>
        </div>

        ${isFoundingMember ? `
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0;">🏆 Founding Member #${spotNumber || ''} Benefits:</h3>
          <ul style="margin: 0;">
            <li>✅ <strong>100 days FREE</strong> - No charges during your trial period</li>
            <li>✅ <strong>50% off for life</strong> - Lifetime discount when you continue after trial</li>
            <li>✅ <strong>25 property listings</strong> - Professional tier access</li>
            <li>✅ <strong>Verified Agent badge</strong> - Stand out from the competition</li>
            <li>✅ <strong>Priority support</strong> - Get help faster as a founding member</li>
          </ul>
        </div>
        ` : ''}
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">Next Steps:</h3>
          <ol>
            <li>📝 <strong>Complete your agent profile</strong> - Add your photo, bio, and specialties</li>
            <li>🏢 <strong>Set up your office details</strong> - Add your company information</li>
            <li>🎯 <strong>Start helping clients</strong> - Begin listing and managing properties</li>
            <li>🎬 <strong>Watch the tutorial below</strong> - Learn how to post your first listing</li>
          </ol>
        </div>

        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <h3 style="color: #92400e; margin-top: 0;">🎬 Getting Started</h3>
          <p style="color: #78350f; margin-bottom: 15px;">Watch this quick tutorial to learn how to post your first property listing:</p>
          <a href="https://youtu.be/Q_GFflHQjE0"
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            ▶️ Watch Tutorial Video
          </a>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://portalhomehub.com/dashboard/agent" 
             style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            🚀 Access Agent Dashboard
          </a>
        </div>
        
        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Important:</strong> Use the same email (${agentEmail}) to log in to your agent dashboard.</p>
        </div>
        
        <p>If you have any questions about using the platform or need assistance, our support team is here to help.</p>
        
        <p>Welcome to the Portal Home Hub family!</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Portal Home Hub Agent Success Team</strong><br>
          Email: agents@portalhomehub.com<br>
          Website: <a href="https://portalhomehub.com">portalhomehub.com</a><br>
          ${country === 'GY' ? 'Guyana Office: +592-762-9797' : 'Main Office: +592-762-9797'}
        </p>
      </div>
    `;

    const emailText = `
Welcome to the Portal Home Hub Agent Network!

Hello ${agentName},

Congratulations! Your agent application has been approved and you are now part of the Portal Home Hub agent network.

YOUR AGENT BENEFITS:
- Access to exclusive agent dashboard and tools
- Help clients buy, sell, and rent properties
- Professional agent profile on our platform
- Property management and client tools
- Marketing support and lead generation
- Mobile-friendly agent tools

${isFoundingMember ? `
🏆 FOUNDING MEMBER #${spotNumber || ''} BENEFITS:
- 100 days FREE - No charges during your trial period
- 50% off for life - Lifetime discount when you continue after trial
- 25 property listings - Professional tier access
- Verified Agent badge - Stand out from the competition
- Priority support - Get help faster as a founding member
` : ''}
NEXT STEPS:
1. Complete your agent profile - Add your photo, bio, and specialties
2. Set up your office details - Add your company information
3. Start helping clients - Begin listing and managing properties
4. Watch the tutorial below - Learn how to post your first listing

🎬 GETTING STARTED:
Watch this quick tutorial to learn how to post your first property listing:
https://youtu.be/Q_GFflHQjE0

Access your agent dashboard at: https://portalhomehub.com/dashboard/agent

IMPORTANT: Use the same email (${agentEmail}) to log in to your agent dashboard.

If you have any questions about using the platform or need assistance, our support team is here to help.

Welcome to the Portal Home Hub family!

---
Portal Home Hub Agent Success Team
Email: agents@portalhomehub.com
Website: portalhomehub.com
${country === 'GY' ? 'Guyana Office: +592-762-9797' : 'Main Office: +592-762-9797'}
    `;

    await resend.emails.send({
      from: 'Portal Home Hub <agents@portalhomehub.com>',
      to: [agentEmail],
      subject: `🎉 Welcome to Portal Home Hub - Agent Application Approved!`,
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