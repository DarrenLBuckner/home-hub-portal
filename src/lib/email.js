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

        <!-- Tips for Success -->
        <div style="background: #fef3c7; padding: 20px; border-radius: 12px; border-left: 4px solid #f59e42; margin-bottom: 25px;">
          <h3 style="color: #d97706; margin: 0 0 15px 0;">💡 Tips to Sell Your Property Fast:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #374151;">
            <li style="margin-bottom: 8px;">📱 <strong>Use high-quality photos</strong> - properties with professional photos get 3x more views</li>
            <li style="margin-bottom: 8px;">📝 <strong>Write detailed descriptions</strong> - highlight unique features and neighborhood benefits</li>
            <li style="margin-bottom: 8px;">💰 <strong>Price competitively</strong> - research similar properties in your area</li>
            <li style="margin-bottom: 8px;">⏰ <strong>Respond quickly</strong> - fast responses lead to faster sales</li>
            <li style="margin-bottom: 8px;">🎯 <strong>Keep listing updated</strong> - fresh listings get priority placement</li>
          </ul>
        </div>

        <!-- Ready to Start -->
        <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <h3 style="color: #2563eb; margin: 0 0 15px 0;">🚀 Ready to List Your Property?</h3>
          <p style="margin-bottom: 15px; color: #374151;">
            Unlike agents, you can start immediately! No waiting for approval - just login and create your first listing.
          </p>

          <div style="text-align: center; margin: 25px 0;">
            <a href="https://portalhomehub.com/login" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Login & Create Your First Listing
            </a>
          </div>

          <!-- Professional Services Available -->
          <div style="background: #f0f9ff; padding: 20px; border-radius: 12px; border-left: 4px solid #2563eb; margin-top: 25px;">
            <h4 style="color: #2563eb; margin: 0 0 15px 0;">📸 Additional Professional Services Available:</h4>
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
