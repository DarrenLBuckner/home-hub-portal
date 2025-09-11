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
      <p>Contact support if you need help.</p>`
  });
}

export async function sendPropertyApprovalEmail({ to, propertyTitle }) {
  return resend.emails.send({
    to,
    subject: `Your property "${propertyTitle}" has been approved!`,
    html: `<div>Your property listing <b>${propertyTitle}</b> is now live and visible to buyers!</div>`,
  });
}

export async function sendPropertyRejectionEmail({ to, propertyTitle }) {
  return resend.emails.send({
    to,
    subject: `Your property "${propertyTitle}" was not approved`,
    html: `<div>Your property listing <b>${propertyTitle}</b> was not approved. Please review and resubmit.</div>`,
  });
}
