import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { propertyId, ownerEmail, propertyTitle, ownerName } = await request.json();

    if (!ownerEmail || !propertyTitle) {
      return NextResponse.json(
        { error: 'Missing required email data' },
        { status: 400 }
      );
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">🎉 Property Approved!</h2>
        
        <p>Hello ${ownerName},</p>
        
        <p>Great news! Your property listing "<strong>${propertyTitle}</strong>" has been approved and is now live on Guyana Home Hub.</p>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #0ea5e9; margin-top: 0;">What happens next?</h3>
          <ul>
            <li>✅ Your property is now visible to potential buyers</li>
            <li>🔍 Buyers can search and find your listing</li>
            <li>📞 You'll receive inquiries directly via email and WhatsApp</li>
            <li>💰 No additional fees - your property stays active</li>
          </ul>
        </div>
        
        <p>You can view your live listing and manage it from your dashboard.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://portalhomehub.com/dashboard/owner" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View My Dashboard
          </a>
        </div>
        
        <p>Thank you for using Guyana Home Hub!</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Guyana Home Hub Team</strong><br>
          Email: support@guyanahomehub.com<br>
          Website: <a href="https://guyanahomehub.com">guyanahomehub.com</a>
        </p>
      </div>
    `;

    const emailText = `
Property Approved!

Hello ${ownerName},

Great news! Your property listing "${propertyTitle}" has been approved and is now live on Guyana Home Hub.

What happens next?
- Your property is now visible to potential buyers
- Buyers can search and find your listing  
- You'll receive inquiries directly via email and WhatsApp
- No additional fees - your property stays active

You can view your live listing and manage it from your dashboard at:
https://portalhomehub.com/dashboard/owner

Thank you for using Guyana Home Hub!

---
Guyana Home Hub Team
Email: support@guyanahomehub.com
Website: guyanahomehub.com
    `;

    await resend.emails.send({
      from: 'Guyana Home Hub <noreply@guyanahomehub.com>',
      to: [ownerEmail],
      subject: `🎉 Property Approved: ${propertyTitle}`,
      html: emailHtml,
      text: emailText,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Approval email error:', error);
    
    // Return success even if email fails to keep system running
    return NextResponse.json(
      { 
        success: false, 
        error: 'Email service temporarily unavailable',
        message: 'Property was approved successfully, but email notification failed'
      },
      { status: 200 } // Return 200 so admin system continues working
    );
  }
}