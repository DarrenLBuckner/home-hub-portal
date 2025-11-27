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

export async function sendFSBOFoundingMemberEmail(to, firstName, spotNumber) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '🏠 Welcome to Portal Home Hub - Founding Member Access Activated!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          🎉 <h1 style="color: #16a34a; margin: 10px 0;">Welcome to Portal Home Hub, ${firstName}!</h1>
          <div style="background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 12px 24px; border-radius: 25px; display: inline-block; font-weight: bold;">
            Founding Member #${spotNumber}
          </div>
        </div>

        <!-- Welcome Message -->
        <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Congratulations! You're now part of an exclusive group helping to revolutionize real estate in the Caribbean. 
            As a founding member, you have immediate access to list your property - no approval process needed!
          </p>
        </div>

        <!-- Founding Member Benefits -->
        <div style="background: #dcfce7; padding: 20px; border-radius: 12px; border-left: 4px solid #16a34a; margin-bottom: 25px;">
          <h3 style="color: #16a34a; margin: 0 0 15px 0;">🌟 Your Founding Member Benefits:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">✅ <strong>60 days FREE</strong> platform access (Worth GY$41,184!)</li>
            <li style="margin-bottom: 8px;">🏠 <strong>Up to 1 property listing</strong> with full exposure</li>
            <li style="margin-bottom: 8px;">🎯 <strong>40% discount</strong> when you continue after trial</li>
            <li style="margin-bottom: 8px;">⚡ <strong>Priority support</strong> - we're here to help!</li>
            <li style="margin-bottom: 8px;">🏆 <strong>Founding Member badge</strong> on your profile</li>
            <li style="margin-bottom: 8px;">🚀 <strong>Beta program access</strong> - shape the future with us!</li>
          </ul>
        </div>

        <!-- Ready to Start -->
        <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="color: #2563eb; margin: 0 0 15px 0;">🚀 Ready to List Your Property?</h3>
          <p style="margin-bottom: 15px; color: #374151;">
            Unlike agents, you can start immediately! No waiting for approval - just login and create your first listing.
          </p>
          
          <h4 style="color: #16a34a; margin: 20px 0 10px 0;">📸 Professional Services Available:</h4>
          <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #374151;">
            <li>Professional photography services</li>
            <li>Done-for-you listing creation</li>
            <li>Lockbox installation services</li>
            <li>Digital application processing</li>
            <li>Marketing support and guidance</li>
          </ul>

          <div style="text-align: center; margin: 25px 0;">
            <a href="https://portalhomehub.com/login" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Login & Create Your First Listing
            </a>
          </div>
        </div>

        <!-- Tips for Success -->
        <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e42; margin-bottom: 25px;">
          <h3 style="color: #d97706; margin: 0 0 15px 0;">💡 Tips for Best Results:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">📱 <strong>Use high-quality photos</strong> - properties with professional photos get 3x more views</li>
            <li style="margin-bottom: 8px;">📝 <strong>Write detailed descriptions</strong> - highlight unique features and neighborhood benefits</li>
            <li style="margin-bottom: 8px;">💰 <strong>Price competitively</strong> - research similar properties in your area</li>
            <li style="margin-bottom: 8px;">⏰ <strong>Respond quickly</strong> - fast responses lead to faster sales</li>
            <li style="margin-bottom: 8px;">🎯 <strong>Keep listing updated</strong> - fresh listings get priority placement</li>
          </ul>
        </div>

        <!-- Beta Program Message -->
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 20px; border-radius: 12px; margin-bottom: 25px;">
          <h3 style="margin: 0 0 10px 0; color: white;">🌍 You're Changing Caribbean Real Estate!</h3>
          <p style="margin: 0; opacity: 0.9; line-height: 1.5;">
            As a founding member, you're part of our mission to revolutionize how properties are bought and sold across the Caribbean. 
            Your feedback and success help us build the best platform possible for everyone.
          </p>
        </div>

        <!-- Support -->
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h4 style="margin: 0 0 10px 0; color: #374151;">Need Help Getting Started?</h4>
          <p style="margin: 0 0 15px 0; color: #6b7280;">Our team is here to support you every step of the way!</p>
          
          <div style="margin: 15px 0;">
            <a href="https://wa.me/5927629797" 
               style="background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 5px;">
              💬 WhatsApp Support: +592 762-9797
            </a>
          </div>
          
          <p style="font-size: 14px; color: #9ca3af; margin: 15px 0 0 0;">
            Welcome to the future of Caribbean real estate! 🏡✨
          </p>
        </div>

      </div>
    `
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
