import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = 'Portal Home Hub <info@portalhomehub.com>';

export async function sendWelcomeEmail(to) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: 'Welcome to Portal Home Hub - Application Received!',
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #2563eb;">Welcome to Portal Home Hub!</h2>
      <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0;">
        <strong style="color: #856404;">📋 Application Status: Under Review</strong>
        <p style="margin: 10px 0 0 0; color: #856404;">Our team will review your application within 24-48 hours. You'll receive an email once approved.</p>
      </div>
      <p>Thank you for signing up! Once your application is approved, you'll be able to log in and start listing your property.</p>
      <p>Questions? Contact us on WhatsApp: <a href="https://wa.me/5927629797" style="color: #16a34a;">+592 762-9797</a></p>
      <p>Thank you for joining us!</p>
    </div>`
  });
}

export async function sendFSBOFoundingMemberEmail(to, firstName, spotNumber) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: '🏠 Welcome to Portal Home Hub - Application Received!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          🎉 <h1 style="color: #16a34a; margin: 10px 0;">Welcome to Portal Home Hub, ${firstName}!</h1>
          <div style="background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 12px 24px; border-radius: 25px; display: inline-block; font-weight: bold;">
            Founding Member #${spotNumber}
          </div>
        </div>

        <!-- Application Status -->
        <div style="background: #fff3cd; padding: 20px; border-radius: 12px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
          <h3 style="color: #856404; margin: 0 0 10px 0;">📋 Application Status: Under Review</h3>
          <p style="margin: 0; color: #856404; line-height: 1.6;">
            Our team will review your application within <strong>24-48 hours</strong>. You'll receive an email once your account is approved and ready to use.
          </p>
        </div>

        <!-- Welcome Message -->
        <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Congratulations! You're now part of an exclusive group helping to revolutionize real estate in the Caribbean.
            As a founding member, you'll enjoy special benefits once your account is approved.
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

        <!-- What Happens Next -->
        <div style="background: #e0f2fe; padding: 20px; border-radius: 12px; border-left: 4px solid #2563eb; margin-bottom: 25px;">
          <h3 style="color: #0369a1; margin: 0 0 15px 0;">🚀 What Happens Next?</h3>
          <ol style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">Our team reviews your application (24-48 hours)</li>
            <li style="margin-bottom: 8px;">You receive an approval confirmation email</li>
            <li style="margin-bottom: 8px;">You can then log in and list your property</li>
          </ol>
        </div>

        <!-- Tips for Success -->
        <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e42; margin-bottom: 25px;">
          <h3 style="color: #d97706; margin: 0 0 15px 0;">💡 While You Wait - Prepare for Success:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">📱 <strong>Take high-quality photos</strong> - properties with professional photos get 3x more views</li>
            <li style="margin-bottom: 8px;">📝 <strong>Draft your description</strong> - highlight unique features and neighborhood benefits</li>
            <li style="margin-bottom: 8px;">💰 <strong>Research pricing</strong> - check similar properties in your area</li>
            <li style="margin-bottom: 8px;">📋 <strong>Gather documents</strong> - property details, measurements, amenities list</li>
          </ul>
        </div>

        <!-- Professional Services Available -->
        <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="color: #2563eb; margin: 0 0 15px 0;">📸 Professional Services Available:</h3>
          <ul style="margin: 0 0 15px 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">Professional photography services</li>
            <li style="margin-bottom: 8px;">Done-for-you listing creation</li>
            <li style="margin-bottom: 8px;">Lockbox installation services</li>
            <li style="margin-bottom: 8px;">Digital application processing</li>
            <li style="margin-bottom: 8px;">Marketing support and guidance</li>
          </ul>
          <p style="margin: 0; font-size: 14px; color: #6b7280; font-style: italic;">
            <strong>Note:</strong> Fees apply to these services. Service availability may vary depending on your location and local partnerships.
          </p>
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
          <h4 style="margin: 0 0 10px 0; color: #374151;">Questions About Your Application?</h4>
          <p style="margin: 0 0 15px 0; color: #6b7280;">Our team is here to help!</p>

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

export async function sendPropertyApprovalEmail({ to, propertyTitle, propertyId, siteId }) {
  // Determine the correct domain based on site_id
  const domain = siteId === 'jamaica' ? 'jamaicahomehub.com' : 'guyanahomehub.com';
  const propertyUrl = propertyId ? `https://${domain}/property/${propertyId}` : `https://${domain}`;

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `🎉 Your property listing is now live!`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #16a34a; margin: 0;">🎉 Property Approved!</h1>
      </div>

      <!-- Main Content -->
      <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; color: #374151; margin: 0 0 16px 0;">
          Great news! Your property listing <b>"${propertyTitle}"</b> has been approved and is now live on ${domain}!
        </p>

        <!-- View Property Button -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="${propertyUrl}"
             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #16a34a, #22c55e); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
            👀 View Your Live Listing
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; margin: 16px 0 0 0;">
          Your property is now visible to thousands of potential buyers searching for properties in the Caribbean.
        </p>
      </div>

      <!-- WhatsApp Support -->
      <div style="margin: 20px 0; padding: 16px; background: #dcfce7; border-radius: 8px; border: 1px solid #16a34a;">
        <p style="margin: 0 0 12px 0; color: #166534;">Need help managing your listing? Contact us on WhatsApp:</p>
        <a href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20My%20property%20was%20just%20approved%20and%20I%20need%20help."
           style="display: inline-block; padding: 12px 24px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
          📱 WhatsApp Support: +592 762-9797
        </a>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          © 2025 Portal Home Hub. All rights reserved.
        </p>
      </div>
    </div>`,
  });
}

export async function sendPropertyRejectionEmail({ to, propertyTitle, rejectionReason }) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Your property "${propertyTitle}" needs attention`,
    html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

      <!-- Header -->
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #dc2626; margin: 0;">📋 Property Review Required</h1>
      </div>

      <!-- Main Content -->
      <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; color: #374151; margin: 0 0 16px 0;">
          Your property listing <b>"${propertyTitle}"</b> was not approved at this time.
        </p>

        ${rejectionReason ? `
        <div style="margin: 16px 0; padding: 12px; background: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p style="margin: 0; color: #991b1b; font-size: 14px;"><b>Reason:</b> ${rejectionReason}</p>
        </div>
        ` : ''}

        <p style="font-size: 14px; color: #6b7280; margin: 16px 0 0 0;">
          Please review and update your listing, then resubmit for approval.
        </p>
      </div>

      <!-- WhatsApp Support -->
      <div style="margin: 20px 0; padding: 16px; background: #fef2f2; border-radius: 8px; border: 1px solid #dc2626;">
        <p style="margin: 0 0 12px 0; color: #991b1b;">Need help understanding why or fixing your listing? Contact us on WhatsApp:</p>
        <a href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20My%20property%20listing%20was%20not%20approved%20and%20I%20need%20help."
           style="display: inline-block; padding: 12px 24px; background: #16a34a; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold;">
          📱 WhatsApp Support: +592 762-9797
        </a>
      </div>

      <!-- Footer -->
      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          © 2025 Portal Home Hub. All rights reserved.
        </p>
      </div>
    </div>`,
  });
}

export async function sendLandlordWelcomeEmail(to, firstName, isFoundingMember = false, spotNumber = null) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: isFoundingMember
      ? `🏠 Welcome to Portal Home Hub - Application Received!`
      : '🏠 Welcome to Portal Home Hub - Application Received!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">

        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          🏠 <h1 style="color: #2563eb; margin: 10px 0;">Welcome to Portal Home Hub, ${firstName}!</h1>
          ${isFoundingMember ? `
          <div style="background: linear-gradient(135deg, #16a34a, #22c55e); color: white; padding: 12px 24px; border-radius: 25px; display: inline-block; font-weight: bold;">
            Founding Landlord #${spotNumber}
          </div>
          ` : ''}
        </div>

        <!-- Application Status -->
        <div style="background: #fff3cd; padding: 20px; border-radius: 12px; border-left: 4px solid #ffc107; margin-bottom: 25px;">
          <h3 style="color: #856404; margin: 0 0 10px 0;">📋 Application Status: Under Review</h3>
          <p style="margin: 0; color: #856404; line-height: 1.6;">
            Our team will review your application within <strong>24-48 hours</strong>. You'll receive an email once your account is approved and ready to use.
          </p>
        </div>

        <!-- Welcome Message -->
        <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; line-height: 1.6; color: #374151;">
            Thank you for signing up as a Landlord on Portal Home Hub! Once approved, you'll be able to list your rental properties and connect with quality tenants across the Caribbean.
          </p>
        </div>

        ${isFoundingMember ? `
        <!-- Founding Member Benefits -->
        <div style="background: #dcfce7; padding: 20px; border-radius: 12px; border-left: 4px solid #16a34a; margin-bottom: 25px;">
          <h3 style="color: #16a34a; margin: 0 0 15px 0;">🌟 Your Founding Landlord Benefits:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">✅ <strong>Extended FREE trial</strong> - Full platform access at no cost</li>
            <li style="margin-bottom: 8px;">🏠 <strong>Multiple property listings</strong> - List all your rental units</li>
            <li style="margin-bottom: 8px;">🎯 <strong>Exclusive discount</strong> when you continue after trial</li>
            <li style="margin-bottom: 8px;">⚡ <strong>Priority support</strong> - We're here to help!</li>
            <li style="margin-bottom: 8px;">🏆 <strong>Founding Landlord badge</strong> on your profile</li>
          </ul>
        </div>
        ` : ''}

        <!-- What Happens Next -->
        <div style="background: #e0f2fe; padding: 20px; border-radius: 12px; border-left: 4px solid #2563eb; margin-bottom: 25px;">
          <h3 style="color: #0369a1; margin: 0 0 15px 0;">🚀 What Happens Next?</h3>
          <ol style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">Our team reviews your application (24-48 hours)</li>
            <li style="margin-bottom: 8px;">You receive an approval confirmation email</li>
            <li style="margin-bottom: 8px;">You can then log in and list your rental properties</li>
          </ol>
        </div>

        <!-- Landlord Benefits -->
        <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="color: #374151; margin: 0 0 15px 0;">🏡 What You Can Do as an Approved Landlord:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">📝 <strong>List rental properties</strong> - Apartments, houses, commercial spaces</li>
            <li style="margin-bottom: 8px;">👥 <strong>Connect with tenants</strong> - Receive inquiries directly</li>
            <li style="margin-bottom: 8px;">📊 <strong>Track your listings</strong> - Manage all properties from one dashboard</li>
            <li style="margin-bottom: 8px;">📱 <strong>WhatsApp integration</strong> - Get tenant messages instantly</li>
            <li style="margin-bottom: 8px;">🔔 <strong>Email notifications</strong> - Never miss a viewing request</li>
          </ul>
        </div>

        <!-- Tips for Success -->
        <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
          <h3 style="color: #d97706; margin: 0 0 15px 0;">💡 While You Wait - Prepare for Success:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">📸 <strong>Take high-quality photos</strong> - Listings with good photos get 4x more views</li>
            <li style="margin-bottom: 8px;">📝 <strong>Draft property descriptions</strong> - Include amenities, utilities, and lease terms</li>
            <li style="margin-bottom: 8px;">💰 <strong>Research pricing</strong> - Check similar rentals in your area</li>
            <li style="margin-bottom: 8px;">📋 <strong>Gather documents</strong> - Property details, measurements, amenities list</li>
          </ul>
        </div>

        <!-- Support -->
        <div style="background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h4 style="margin: 0 0 10px 0; color: #374151;">Questions About Your Application?</h4>
          <p style="margin: 0 0 15px 0; color: #6b7280;">Our team is here to help!</p>

          <div style="margin: 15px 0;">
            <a href="https://wa.me/5927629797"
               style="background: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; margin: 5px;">
              💬 WhatsApp Support: +592 762-9797
            </a>
          </div>

          <p style="font-size: 14px; color: #9ca3af; margin: 15px 0 0 0;">
            Welcome to Portal Home Hub! 🏡
          </p>
        </div>

      </div>
    `
  });
}

// ============================================
// OWNER/LANDLORD APPROVAL & REJECTION EMAILS
// ============================================

/**
 * Send approval email when FSBO/Landlord application is approved
 */
export async function sendOwnerApprovalEmail({ to, firstName, userType, isFoundingMember = false, trialDays = null, propertyLimit = null, countryName = 'Guyana' }) {
  const userTypeLabel = userType === 'landlord' ? 'Landlord' : 'Property Owner';
  const domain = countryName === 'Jamaica' ? 'jamaicahomehub.com' : 'guyanahomehub.com';

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `🎉 You're Approved! Start Listing on ${countryName} HomeHub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">

        <!-- Header -->
        <div style="background: #22c55e; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 You're Approved!</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px; background: #f9fafb;">
          <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">Hi ${firstName},</p>

          <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
            Great news! Your <strong>${userTypeLabel}</strong> account on ${countryName} HomeHub has been approved.
          </p>

          <p style="font-size: 16px; color: #374151; margin: 0 0 25px 0;">
            You can now log in and start listing your ${userType === 'landlord' ? 'rental properties' : 'property'}!
          </p>

          <!-- Next Steps Box -->
          <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <strong style="color: #374151; display: block; margin-bottom: 15px;">📋 Next Steps:</strong>
            <ol style="margin: 0; padding-left: 25px; color: #374151; line-height: 1.8;">
              <li>Log in to your account</li>
              <li>Click "Create Listing" from your dashboard</li>
              <li>Add your property details and photos</li>
              <li>Publish and reach ${userType === 'landlord' ? 'tenants' : 'buyers'}!</li>
            </ol>
          </div>

          ${isFoundingMember ? `
          <!-- Founding Member Benefits -->
          <div style="background: #ecfdf5; border-left: 4px solid #22c55e; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 25px;">
            <strong style="color: #16a34a; display: block; margin-bottom: 15px;">🎉 Your Founding Member Benefits:</strong>
            <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
              ${trialDays ? `<li>✅ <strong>${trialDays} days FREE</strong> platform access</li>` : ''}
              ${propertyLimit ? `<li>✅ <strong>${propertyLimit} property listing${propertyLimit > 1 ? 's' : ''}</strong></li>` : ''}
              <li>✅ <strong>Priority support</strong> - We're here to help!</li>
              <li>✅ <strong>Founding Member badge</strong> on your profile</li>
            </ul>
          </div>
          ` : ''}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://${domain}/login"
               style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Log In Now
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0 0;">
            Questions? Reply to this email or contact us on WhatsApp:
            <a href="https://wa.me/5927629797" style="color: #16a34a;">+592 762-9797</a>
          </p>

          <p style="font-size: 16px; color: #374151; margin: 25px 0 0 0;">
            Welcome to the community!<br>
            <strong>The ${countryName} HomeHub Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px; background: #f3f4f6;">
          <p style="margin: 0;">© 2026 Portal HomeHub. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

/**
 * Send rejection email when FSBO/Landlord application is permanently rejected
 */
export async function sendOwnerRejectionEmail({ to, firstName, userType, reason, countryName = 'Guyana' }) {
  const userTypeLabel = userType === 'landlord' ? 'Landlord' : 'Property Owner';

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Application Update - ${countryName} HomeHub`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">

        <!-- Header -->
        <div style="background: #1e3a5f; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Application Update</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px; background: #f9fafb;">
          <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">Hi ${firstName},</p>

          <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
            Thank you for your interest in ${countryName} HomeHub. After reviewing your ${userTypeLabel} application, we are unable to approve your account at this time.
          </p>

          <!-- Reason Box -->
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 0 12px 12px 0; margin: 25px 0;">
            <strong style="color: #991b1b; display: block; margin-bottom: 10px;">Reason:</strong>
            <p style="margin: 0; color: #991b1b; line-height: 1.6;">${reason || 'Your application did not meet our platform requirements.'}</p>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0 0;">
            If you believe this decision was made in error, please reply to this email with any additional information that may help us reconsider.
          </p>

          <p style="font-size: 16px; color: #374151; margin: 25px 0 0 0;">
            Thank you for understanding.<br>
            <strong>The ${countryName} HomeHub Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px; background: #f3f4f6;">
          <p style="margin: 0;">© 2026 Portal HomeHub. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

/**
 * Send correction needed email when FSBO/Landlord application needs fixes
 */
export async function sendOwnerCorrectionEmail({ to, firstName, userType, reason, countryName = 'Guyana' }) {
  const userTypeLabel = userType === 'landlord' ? 'Landlord' : 'Property Owner';
  const domain = countryName === 'Jamaica' ? 'jamaicahomehub.com' : 'guyanahomehub.com';

  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `⚠️ Action Required - Your ${countryName} HomeHub Application`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0;">

        <!-- Header -->
        <div style="background: #f59e0b; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ Action Required</h1>
        </div>

        <!-- Content -->
        <div style="padding: 30px; background: #f9fafb;">
          <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">Hi ${firstName},</p>

          <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
            Thank you for applying to ${countryName} HomeHub! We've reviewed your ${userTypeLabel} application and need a few corrections before we can approve your account.
          </p>

          <!-- Correction Box -->
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 0 12px 12px 0; margin: 25px 0;">
            <strong style="color: #92400e; display: block; margin-bottom: 10px;">What needs to be corrected:</strong>
            <p style="margin: 0; color: #92400e; line-height: 1.6;">${reason || 'Please update the required information.'}</p>
          </div>

          <!-- How to Fix -->
          <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <strong style="color: #374151; display: block; margin-bottom: 15px;">How to fix this:</strong>
            <ol style="margin: 0; padding-left: 25px; color: #374151; line-height: 1.8;">
              <li>Log in to your account</li>
              <li>Update the required information in your profile</li>
              <li>Your application will be automatically resubmitted for review</li>
            </ol>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://${domain}/login"
               style="display: inline-block; background: #1e3a5f; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Log In & Update
            </a>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0 0;">
            Need help? Reply to this email or contact us on WhatsApp:
            <a href="https://wa.me/5927629797" style="color: #16a34a;">+592 762-9797</a>
          </p>

          <p style="font-size: 16px; color: #374151; margin: 25px 0 0 0;">
            <strong>The ${countryName} HomeHub Team</strong>
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px; background: #f3f4f6;">
          <p style="margin: 0;">© 2026 Portal HomeHub. All rights reserved.</p>
        </div>
      </div>
    `
  });
}

export async function sendPropertyGuideEmail(to) {
  return resend.emails.send({
    from: 'Guyana Home Hub <info@portalhomehub.com>',
    to,
    subject: '🏡 Your Free Property Guide: Complete Guide to Buying Property in Guyana from Abroad',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 0; background: #f8fafc;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 40px 30px; text-align: center;">
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">🏡 Guyana Home Hub</div>
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Your Free Property Guide is Here!</h1>
          <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Complete Guide to Buying Property in Guyana from Abroad</p>
        </div>

        <!-- Welcome Message -->
        <div style="background: white; padding: 30px; margin: 0;">
          <h2 style="color: #2563eb; margin: 0 0 20px 0;">Thank you for your interest in Guyanese real estate!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
            Whether you're part of the diaspora looking to invest in your homeland, planning to retire in Guyana, 
            or exploring real estate opportunities during this exciting oil boom period, this comprehensive guide 
            will walk you through everything you need to know.
          </p>

          <!-- Key Benefits -->
          <div style="background: #f0f9ff; padding: 25px; border-radius: 12px; border-left: 4px solid #2563eb; margin: 25px 0;">
            <h3 style="color: #2563eb; margin: 0 0 15px 0;">🌟 What You'll Learn in This Guide:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
              <li><strong>Legal Requirements:</strong> Can foreigners buy property in Guyana? (Yes, with some conditions)</li>
              <li><strong>Step-by-Step Process:</strong> Complete buying process from search to ownership</li>
              <li><strong>Cost Breakdown:</strong> All fees, taxes, and hidden costs explained</li>
              <li><strong>Investment Opportunities:</strong> Why now is the perfect time to invest</li>
              <li><strong>Fraud Prevention:</strong> How to protect yourself from property scams</li>
              <li><strong>Financing Options:</strong> Different ways to fund your property purchase</li>
              <li><strong>Property Management:</strong> Managing your investment from abroad</li>
            </ul>
          </div>

          <!-- Download Button -->
          <div style="text-align: center; margin: 30px 0;">
            <p style="margin-bottom: 20px; color: #374151; font-size: 16px;">
              Your comprehensive guide is ready for download:
            </p>
            <a href="https://www.portalhomehub.com/diaspora-property-guide.html" 
               style="background: #2563eb; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">
              📄 Download Your Free Guide
            </a>
          </div>

          <!-- Market Highlights -->
          <div style="background: #dcfce7; padding: 25px; border-radius: 12px; border-left: 4px solid #16a34a; margin: 25px 0;">
            <h3 style="color: #16a34a; margin: 0 0 15px 0;">📈 Current Market Highlights:</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
              <li><strong>Oil Boom Impact:</strong> Massive offshore discoveries driving economic growth</li>
              <li><strong>GDP Growth:</strong> 20-60% annual growth projections through 2025</li>
              <li><strong>Property Appreciation:</strong> Prime locations seeing 10-20% annual increases</li>
              <li><strong>Rental Yields:</strong> Strong diaspora demand creating 5-10% annual returns</li>
              <li><strong>Limited Supply:</strong> Desirable areas have restricted land availability</li>
            </ul>
          </div>

          <!-- Next Steps -->
          <div style="background: #fef3c7; padding: 25px; border-radius: 12px; border-left: 4px solid #f59e0b; margin: 25px 0;">
            <h3 style="color: #d97706; margin: 0 0 15px 0;">🚀 Ready to Take Action?</h3>
            <p style="margin: 0 0 15px 0; color: #374151; line-height: 1.6;">
              After reading your guide, if you're ready to explore properties or need personalized advice:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
              <li>Browse current properties at <a href="https://www.guyanahomehub.com" style="color: #2563eb; text-decoration: none;"><strong>GuyanHome Hub</strong></a></li>
              <li>Connect with verified real estate agents</li>
              <li>Get personalized investment advice</li>
              <li>Join our diaspora investor community</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background: #374151; color: white; padding: 30px; text-align: center;">
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 10px;">🏡 Guyana Home Hub</div>
          <p style="margin: 0 0 10px 0; font-size: 16px; opacity: 0.9;">Buy. Rent. Sell — All in One Place.</p>
          <p style="margin: 0 0 20px 0; color: #d1d5db;">Your trusted partner for Guyanese real estate</p>
          
          <div style="margin: 20px 0;">
            <a href="https://www.guyanahomehub.com" style="color: #60a5fa; text-decoration: none; margin: 0 15px;">🌐 Browse Properties</a>
            <a href="https://wa.me/5927629797" style="color: #34d399; text-decoration: none; margin: 0 15px;">💬 WhatsApp Support</a>
          </div>
          
          <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #4b5563; font-size: 13px; color: #9ca3af;">
            <p style="margin: 0;">Caribbean Home Hub LLC | Bringing you closer to home</p>
            <p style="margin: 5px 0 0 0;">This guide is for informational purposes only. Always consult qualified professionals.</p>
          </div>
        </div>
      </div>
    `,
  });
}
