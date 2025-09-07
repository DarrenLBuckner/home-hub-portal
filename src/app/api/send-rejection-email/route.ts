import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { propertyId, ownerEmail, propertyTitle, ownerName, rejectionReason } = await request.json();

    if (!ownerEmail || !propertyTitle || !rejectionReason) {
      return NextResponse.json(
        { error: 'Missing required email data' },
        { status: 400 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">📝 Property Needs Revision</h2>
        
        <p>Hello ${ownerName},</p>
        
        <p>Thank you for submitting your property listing "<strong>${propertyTitle}</strong>" to Guyana Home Hub.</p>
        
        <p>Our review team has identified some items that need to be addressed before we can approve your listing:</p>
        
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Required Changes:</h3>
          <div style="white-space: pre-line; line-height: 1.6;">
            ${rejectionReason}
          </div>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">Next Steps:</h3>
          <ul>
            <li>📝 Make the required changes to your property listing</li>
            <li>📸 Update photos if needed</li>
            <li>✅ Resubmit your listing for review</li>
            <li>⚡ No additional payment required</li>
          </ul>
        </div>
        
        <p><strong>Important:</strong> Since you've already paid, there are no additional fees. Simply make the requested changes and resubmit your listing.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://portalhomehub.com/dashboard/owner" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Edit My Property
          </a>
        </div>
        
        <p>If you have any questions about these requirements, please don't hesitate to contact our support team.</p>
        
        <p>Thank you for your patience and for choosing Guyana Home Hub!</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Guyana Home Hub Team</strong><br>
          Email: support@guyanahomehub.com<br>
          Website: <a href="https://guyanahomehub.com">guyanahomehub.com</a>
        </p>
      </div>
    `;

    const emailText = `
Property Needs Revision

Hello ${ownerName},

Thank you for submitting your property listing "${propertyTitle}" to Guyana Home Hub.

Our review team has identified some items that need to be addressed before we can approve your listing:

REQUIRED CHANGES:
${rejectionReason}

NEXT STEPS:
- Make the required changes to your property listing
- Update photos if needed  
- Resubmit your listing for review
- No additional payment required

IMPORTANT: Since you've already paid, there are no additional fees. Simply make the requested changes and resubmit your listing.

Edit your property at: https://portalhomehub.com/dashboard/owner

If you have any questions about these requirements, please don't hesitate to contact our support team.

Thank you for your patience and for choosing Guyana Home Hub!

---
Guyana Home Hub Team
Email: support@guyanahomehub.com
Website: guyanahomehub.com
    `;

    await resend.emails.send({
      from: 'Guyana Home Hub <noreply@guyanahomehub.com>',
      to: [ownerEmail],
      subject: `📝 Property Needs Revision: ${propertyTitle}`,
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Rejection email error:', error);
    
    // Return success even if email fails to keep system running
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email service temporarily unavailable',
        message: 'Property was rejected successfully, but email notification failed'
      },
      { status: 200 } // Return 200 so admin system continues working
    );
  }
}