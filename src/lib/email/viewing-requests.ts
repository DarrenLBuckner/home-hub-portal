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
  listingUserName: string;
  listingUserEmail: string;
  listingUserPhone: string;
  listingUserCompany: string | null;
}

export interface AgentNotificationParams {
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitorMessage: string;
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  listingUserId: string;
  listingUserName: string;
  listingUserEmail: string;
  listingUserPhone: string;
  listingUserCompany: string | null;
  listedByType: 'agent' | 'owner' | 'fsbo';
  countryId: string;
}

// Shared interface for common email parameters
export interface SharedEmailParams {
  // Visitor info
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  visitorMessage: string;
  
  // Property info
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  
  // Listing user info (agent/owner)
  listingUserId: string;
  listingUserName: string;
  listingUserEmail: string;
  listingUserPhone: string;
  listingUserCompany: string | null;
  listedByType: 'agent' | 'owner' | 'fsbo';
  
  // Meta
  countryId: string;
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
      listingUserName: params.listingUserName,
      listingUserEmail: params.listingUserEmail,
      listingUserPhone: params.listingUserPhone,
      listingUserCompany: params.listingUserCompany
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
      propertyId: params.propertyId,
      propertyTitle: params.propertyTitle,
      propertyLocation: params.propertyLocation,
      listingUserId: params.listingUserId,
      listingUserName: params.listingUserName,
      listingUserEmail: params.listingUserEmail,
      listingUserPhone: params.listingUserPhone,
      listingUserCompany: params.listingUserCompany,
      listedByType: params.listedByType,
      countryId: params.countryId
    }));

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.listingUserEmail,
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
 * using a single shared parameters object
 */
export async function sendViewingRequestEmails(params: SharedEmailParams): Promise<{
  visitorConfirmation: EmailResult;
  agentNotification: EmailResult;
}> {
  // Send both emails in parallel for better performance
  const [visitorResult, agentResult] = await Promise.allSettled([
    sendVisitorConfirmation({
      visitorName: params.visitorName,
      visitorEmail: params.visitorEmail,
      propertyTitle: params.propertyTitle,
      propertyLocation: params.propertyLocation,
      listingUserName: params.listingUserName,
      listingUserEmail: params.listingUserEmail,
      listingUserPhone: params.listingUserPhone,
      listingUserCompany: params.listingUserCompany
    }),
    sendAgentNotification({
      visitorName: params.visitorName,
      visitorEmail: params.visitorEmail,
      visitorPhone: params.visitorPhone,
      visitorMessage: params.visitorMessage,
      propertyId: params.propertyId,
      propertyTitle: params.propertyTitle,
      propertyLocation: params.propertyLocation,
      listingUserId: params.listingUserId,
      listingUserName: params.listingUserName,
      listingUserEmail: params.listingUserEmail,
      listingUserPhone: params.listingUserPhone,
      listingUserCompany: params.listingUserCompany,
      listedByType: params.listedByType,
      countryId: params.countryId
    })
  ]);

  return {
    visitorConfirmation: visitorResult.status === 'fulfilled' 
      ? { ...visitorResult.value, error: visitorResult.value.error ?? '' }
      : { success: false, error: 'Promise rejected: ' + (visitorResult.reason?.message || 'Unknown error') },
    agentNotification: agentResult.status === 'fulfilled' 
      ? { ...agentResult.value, error: agentResult.value.error ?? '' }
      : { success: false, error: 'Promise rejected: ' + (agentResult.reason?.message || 'Unknown error') }
  };
}