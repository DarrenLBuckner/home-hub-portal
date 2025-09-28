import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Portal Home Hub <info@portalhomehub.com>';

export async function sendWelcomeEmail(to) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Portal Home Hub!',
    html: `<h2>Welcome to Portal Home Hub!</h2>
      <p>Your account is now active. You can log in and start listing your property.</p>
      <a href="https://portalhomehub.com/login" style="color: #2563eb; font-weight: bold;">Login to your account</a>
      <p>Thank you for joining us!</p>`
  });
}

export async function sendPaymentConfirmationEmail(to) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Payment Confirmation - Portal Home Hub',
    html: `<h2>Payment Received</h2>
      <p>Your payment was successful and your subscription is now active.</p>
      <a href="https://portalhomehub.com/dashboard/fsbo" style="color: #16a34a; font-weight: bold;">Go to your dashboard</a>
      <p>Thank you for your business!</p>`
  });
}

export async function sendSubscriptionExpiryEmail(to) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Subscription Expiry Notice - Portal Home Hub',
    html: `<h2>Subscription Expiry Notice</h2>
      <p>Your subscription is about to expire. Please renew to continue listing your property.</p>
      <a href="https://portalhomehub.com/dashboard/fsbo" style="color: #f59e42; font-weight: bold;">Renew your subscription</a>
      <p>Need help? WhatsApp us at <a href="https://wa.me/5927629797" style="color: #16a34a;">+592 762-9797</a> for fast support!</p>`
  });
}

export async function sendPropertyApprovalEmail({ to, propertyTitle }) {
  return resend.emails.send({
    to,
    subject: `Your property "${propertyTitle}" has been approved!`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #16a34a;">🎉 Property Approved!</h2>
      <p>Your property listing <b>${propertyTitle}</b> is now live and visible to buyers!</p>
      <div style="margin: 20px 0; padding: 16px; background: #dcfce7; border-radius: 8px; border: 1px solid #16a34a;">
        <p style="margin: 0 0 12px 0;">Need help managing your listing? Contact us on WhatsApp:</p>
        <a href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20My%20property%20was%20just%20approved%20and%20I%20need%20help." 
           style="display: inline-block; padding: 12px 24px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
          📱 WhatsApp Support: +592 762-9797
        </a>
      </div>
    </div>`,
  });
}

export async function sendPropertyRejectionEmail({ to, propertyTitle }) {
  return resend.emails.send({
    to,
    subject: `Your property "${propertyTitle}" was not approved`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626;">📋 Property Review Required</h2>
      <p>Your property listing <b>${propertyTitle}</b> was not approved. Please review and resubmit.</p>
      <div style="margin: 20px 0; padding: 16px; background: #fef2f2; border-radius: 8px; border: 1px solid #dc2626;">
        <p style="margin: 0 0 12px 0;">Need help understanding why or fixing your listing? Contact us on WhatsApp:</p>
        <a href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20My%20property%20listing%20was%20not%20approved%20and%20I%20need%20help." 
           style="display: inline-block; padding: 12px 24px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
          📱 WhatsApp Support: +592 762-9797
        </a>
      </div>
    </div>`,
  });
}
