import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { agentId, agentEmail, agentName, previousRejectionReason, country } = await request.json();

    if (!agentEmail || !agentName || !agentId) {
      return NextResponse.json(
        { error: 'Missing required email data' },
        { status: 400 }
      );
    }

    // Send to admin notification email
    const adminEmail = 'admin@portalhomehub.com';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0ea5e9;">🔄 Agent Application - Resubmission Received</h2>
        
        <p>Hello Admin Team,</p>
        
        <p>A previously rejected agent has resubmitted their application with corrections.</p>
        
        <div style="background: #e0f2fe; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0;">
          <h3 style="color: #0369a1; margin-top: 0;">Agent Details:</h3>
          <p><strong>Name:</strong> ${agentName}</p>
          <p><strong>Email:</strong> ${agentEmail}</p>
          <p><strong>Country:</strong> ${country || 'GY'}</p>
          <p><strong>Application ID:</strong> ${agentId}</p>
        </div>
        
        <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
          <h3 style="color: #dc2626; margin-top: 0;">Previous Rejection Reason:</h3>
          <div style="white-space: pre-line; line-height: 1.6; background: white; padding: 15px; border-radius: 6px;">
${previousRejectionReason || 'No specific reason recorded'}
          </div>
        </div>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #047857; margin-top: 0;">⚡ Action Required:</h3>
          <p>Please review this resubmission in the admin dashboard:</p>
          <p><strong>Status:</strong> Application moved back to "Pending Review"</p>
          <p><strong>Review the updated information:</strong> All fields have been resubmitted by the agent with their corrections</p>
          <p><strong>References are visible:</strong> Check the collapsible references section to verify contact information</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://portalhomehub.com/admin-dashboard/unified?activeSection=agents" 
             style="background: #0ea5e9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
            📋 Review in Admin Dashboard
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          <strong>Portal Home Hub System</strong><br>
          This is an automated notification. The agent's application has been updated in the system.
        </p>
      </div>
    `;

    const emailText = `
Agent Application - Resubmission Received

Hello Admin Team,

A previously rejected agent has resubmitted their application with corrections.

AGENT DETAILS:
Name: ${agentName}
Email: ${agentEmail}
Country: ${country || 'GY'}
Application ID: ${agentId}

PREVIOUS REJECTION REASON:
${previousRejectionReason || 'No specific reason recorded'}

ACTION REQUIRED:
Please review this resubmission in the admin dashboard. The application has been moved back to "Pending Review" status and the agent has provided their corrections.

Review the updated information, including the references section to verify contact information.

Dashboard: https://portalhomehub.com/admin-dashboard/unified?activeSection=agents

This is an automated notification. The agent's application has been updated in the system.
    `;

    // Send email to admin
    const result = await resend.emails.send({
      from: 'Portal Home Hub <noreply@portalhomehub.com>',
      to: adminEmail,
      subject: `🔄 Agent Resubmission: ${agentName}`,
      html: emailHtml,
      text: emailText,
    });

    if (result.error) {
      console.error('Email sending error:', result.error);
      return NextResponse.json(
        { error: `Failed to send email: ${result.error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Resubmission notification sent to admin',
      messageId: result.data?.id
    });

  } catch (error) {
    console.error('Error in send-agent-resubmission-notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
