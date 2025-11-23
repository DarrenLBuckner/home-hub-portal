import { Resend } from 'resend';
import { render } from '@react-email/render';
import { VisitorConfirmationEmail } from './templates/viewing-request-visitor-confirmation';
import { AgentNotificationEmail } from './templates/viewing-request-agent-notification';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// From email address for Portal Home Hub
const FROM_EMAIL = 'Portal Home Hub <info@portalhomehub.com>';

// TypeScript interfaces for function parameters
export interface VisitorConfirmationParams {
  visitorName: string;
  visitorEmail: string;
  propertyTitle: string;
  propertyLocation: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  agentCompany?: string;
}

export interface AgentNotificationParams {
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitorMessage: string;
  propertyTitle: string;
  propertyLocation: string;
  propertyId: string;
  agentName: string;
  agentEmail: string;
}

// Return type for email sending functions
export interface EmailResult {
  success: boolean;
  error?: string;
  emailId?: string;
}

/**
 * Sends a confirmation email to the visitor who requested a viewing
 */
export async function sendVisitorConfirmation(params: VisitorConfirmationParams): Promise<EmailResult> {
  try {
    const emailHtml = await render(VisitorConfirmationEmail({
      visitorName: params.visitorName,
      propertyTitle: params.propertyTitle,
      propertyLocation: params.propertyLocation,
      agentName: params.agentName,
      agentEmail: params.agentEmail,
      agentPhone: params.agentPhone,
      agentCompany: params.agentCompany
    }));

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.visitorEmail,
      subject: `Thank you for your interest in ${params.propertyTitle}`,
      html: emailHtml,
      headers: {
        'X-Entity-Ref-ID': 'viewing-request-confirmation',
      },
    });

    if (result.data) {
      return {
        success: true,
        emailId: result.data.id,
      };
    } else {
      return {
        success: false,
        error: 'Failed to send email - no data returned',
      };
    }
  } catch (error) {
    console.error('Error sending visitor confirmation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Sends a notification email to the agent about a new viewing request
 */
export async function sendAgentNotification(params: AgentNotificationParams): Promise<EmailResult> {
  try {
    const emailHtml = await render(AgentNotificationEmail({
      visitorName: params.visitorName,
      visitorEmail: params.visitorEmail,
      visitorPhone: params.visitorPhone,
      visitorMessage: params.visitorMessage,
      propertyTitle: params.propertyTitle,
      propertyLocation: params.propertyLocation,
      propertyId: params.propertyId,
      agentName: params.agentName
    }));

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.agentEmail,
      subject: `New Viewing Request: ${params.propertyTitle}`,
      html: emailHtml,
      headers: {
        'X-Entity-Ref-ID': 'viewing-request-agent-notification',
        'X-Priority': 'high', // Mark as high priority for agents
      },
    });

    if (result.data) {
      return {
        success: true,
        emailId: result.data.id,
      };
    } else {
      return {
        success: false,
        error: 'Failed to send email - no data returned',
      };
    }
  } catch (error) {
    console.error('Error sending agent notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Convenience function to send both confirmation and notification emails
 * Returns results for both operations
 */
export async function sendViewingRequestEmails(params: {
  visitor: Omit<VisitorConfirmationParams, 'agentName' | 'agentEmail' | 'agentPhone' | 'agentCompany'>;
  agent: Omit<AgentNotificationParams, 'visitorName' | 'visitorEmail' | 'visitorPhone' | 'visitorMessage' | 'propertyTitle' | 'propertyLocation' | 'propertyId'>;
  shared: {
    visitorName: string;
    visitorEmail: string;
    visitorPhone: string;
    visitorMessage: string;
    propertyTitle: string;
    propertyLocation: string;
    propertyId: string;
    agentName: string;
    agentEmail: string;
    agentPhone: string;
    agentCompany?: string;
  };
}): Promise<{
  visitorConfirmation: EmailResult;
  agentNotification: EmailResult;
}> {
  // Send both emails in parallel for better performance
  const [visitorResult, agentResult] = await Promise.allSettled([
    sendVisitorConfirmation({
      visitorName: params.shared.visitorName,
      visitorEmail: params.shared.visitorEmail,
      propertyTitle: params.shared.propertyTitle,
      propertyLocation: params.shared.propertyLocation,
      agentName: params.shared.agentName,
      agentEmail: params.shared.agentEmail,
      agentPhone: params.shared.agentPhone,
      agentCompany: params.shared.agentCompany
    }),
    sendAgentNotification({
      visitorName: params.shared.visitorName,
      visitorEmail: params.shared.visitorEmail,
      visitorPhone: params.shared.visitorPhone,
      visitorMessage: params.shared.visitorMessage,
      propertyTitle: params.shared.propertyTitle,
      propertyLocation: params.shared.propertyLocation,
      propertyId: params.shared.propertyId,
      agentName: params.shared.agentName,
      agentEmail: params.shared.agentEmail
    })
  ]);

  return {
    visitorConfirmation: visitorResult.status === 'fulfilled' 
      ? visitorResult.value 
      : { success: false, error: 'Promise rejected: ' + (visitorResult.reason?.message || 'Unknown error') },
    agentNotification: agentResult.status === 'fulfilled' 
      ? agentResult.value 
      : { success: false, error: 'Promise rejected: ' + (agentResult.reason?.message || 'Unknown error') }
  };
}