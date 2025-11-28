import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Professional Services Agreement - Portal Home Hub',
  description: 'Professional Services Agreement for Portal Home Hub property management platform and services.',
};

export default function ProfessionalServicesAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PORTAL HOME HUB</h1>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">PROFESSIONAL SERVICES AGREEMENT</h2>
          <p className="text-gray-600 mb-4">Last Updated: November 28, 2025</p>
          
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-8">
            <p className="text-red-800 font-bold text-center">IMPORTANT: READ CAREFULLY BEFORE PURCHASING</p>
            <p className="text-red-800 font-bold text-center text-lg">ALL FEES ARE NON-REFUNDABLE</p>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6">
              This Professional Services Agreement ("Agreement") is entered into between Portal Home Hub, Inc. ("Portal Home Hub," "we," "us," or "our") and you ("User," "you," or "your") when you purchase any professional services on our platform.
            </p>

            <p className="text-gray-700 mb-6">
              By purchasing any services, including agent subscriptions, property listings, or advertising, you acknowledge that you have read, understood, and agree to be bound by this Agreement, our Terms of Use, Privacy Policy, Acceptable Use Policy, and Cookie Policy.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">1. SERVICES OFFERED</h3>
            <p className="text-gray-700 mb-4">
              Portal Home Hub offers the following professional services (collectively, the "Services"):
            </p>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">1.1 Agent Subscription Services</h4>
            <p className="text-gray-700 mb-3">
              Licensed real estate agents and brokers ("Agents") may subscribe to our platform on a recurring basis. Subscription plans include:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Unlimited property listings:</strong> Post unlimited properties during active subscription period</li>
              <li><strong>Professional profile:</strong> Enhanced profile with contact information, credentials, and reviews</li>
              <li><strong>Lead management:</strong> Receive and manage inquiries from property seekers</li>
              <li><strong>Analytics dashboard:</strong> Track views, inquiries, and performance metrics</li>
              <li><strong>Priority support:</strong> Access to dedicated support channels</li>
              <li><strong>Additional features:</strong> As specified in your selected subscription tier</li>
            </ul>

            <p className="text-gray-700 mb-3"><strong>Subscription Plans:</strong></p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Monthly Subscription:</strong> Billed monthly, renews automatically</li>
              <li><strong>Annual Subscription:</strong> Billed annually, renews automatically (discounted rate)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <em>Note: Specific features and pricing for each tier are displayed during the purchase process and may vary by market.</em>
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">1.2 Per-Property Listing Services</h4>
            <p className="text-gray-700 mb-3">
              Landlords and For Sale By Owner sellers ("FSBO") may purchase individual property listings. Each listing includes:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Single property listing:</strong> Post one property for a specified duration</li>
              <li><strong>Photo gallery:</strong> Upload multiple photos and videos</li>
              <li><strong>Detailed description:</strong> Full property details, features, and amenities</li>
              <li><strong>Contact management:</strong> Receive inquiries from interested parties</li>
              <li><strong>Basic analytics:</strong> View counts and inquiry statistics</li>
              <li><strong>Listing duration:</strong> Typically 30, 60, or 90 days as selected at purchase</li>
            </ul>

            <p className="text-gray-700 mb-3"><strong>Listing Options:</strong></p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Standard Listing:</strong> Basic visibility in search results</li>
              <li><strong>Featured Listing:</strong> Enhanced visibility with prominent placement (additional fee)</li>
              <li><strong>Premium Listing:</strong> Top placement, homepage features, social media promotion (highest fee)</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">1.3 Advertising Services</h4>
            <p className="text-gray-700 mb-3">
              Businesses may purchase advertising space on our platform. Advertising options include:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Banner Ads:</strong> Display advertising in various sizes and positions</li>
              <li><strong>Sponsored Listings:</strong> Promoted properties in search results</li>
              <li><strong>Native Advertising:</strong> Content-style ads integrated into platform</li>
              <li><strong>Email Campaigns:</strong> Promoted content in user newsletters (subject to approval)</li>
            </ul>

            <p className="text-gray-700 mb-3"><strong>Ad Campaigns:</strong></p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li><strong>Duration-based:</strong> Purchase ads for specific time periods (7 days, 30 days, 90 days)</li>
              <li><strong>Impression-based:</strong> Pay per number of impressions delivered</li>
              <li><strong>Click-based:</strong> Pay per click (subject to fraud detection)</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-4">2. ELIGIBILITY AND REQUIREMENTS</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">2.1 Agent Requirements</h4>
            <p className="text-gray-700 mb-3">To purchase Agent Subscription Services, you must:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Hold a valid real estate license in the jurisdiction where you operate</li>
              <li>Provide proof of professional liability insurance (may be required in certain markets)</li>
              <li>Comply with all applicable real estate laws and regulations</li>
              <li>Maintain good standing with your local real estate board or regulatory body</li>
              <li>Agree to our Acceptable Use Policy and professional conduct standards</li>
            </ul>
            <p className="text-gray-700 mb-4">
              <strong>Verification:</strong> We reserve the right to verify your credentials and may suspend or terminate your account if you provide false information or lose your professional license.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">2.2 Landlord and FSBO Requirements</h4>
            <p className="text-gray-700 mb-3">To purchase Per-Property Listing Services, you must:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Have legal authority to list the property (owner, authorized agent, or power of attorney)</li>
              <li>Provide accurate property information and documentation</li>
              <li>Comply with all applicable fair housing and anti-discrimination laws</li>
              <li>Ensure the property meets all local safety and habitability requirements</li>
              <li>Not list properties involved in illegal activities</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">2.3 Advertiser Requirements</h4>
            <p className="text-gray-700 mb-3">To purchase Advertising Services, you must:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>Be a legitimate business entity or individual</li>
              <li>Provide advertising content that complies with our Advertising Standards (Section 7)</li>
              <li>Not advertise illegal products, services, or activities</li>
              <li>Have all necessary rights and licenses for advertising content</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-4">3. PAYMENT TERMS AND PRICING</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">3.1 Pricing</h4>
            <p className="text-gray-700 mb-4">
              Pricing for all Services is displayed on our platform at the time of purchase. Prices may vary by market/geographic location, service tier or package selected, duration of service, promotional periods or discounts, and currency and local market conditions.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Price Changes:</strong> We reserve the right to change pricing at any time. Price changes apply to new purchases and renewals, but will not affect active subscriptions or listings purchased before the price change unless you are provided 30 days advance notice.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">3.2 Payment Methods</h4>
            <p className="text-gray-700 mb-3">We accept the following payment methods:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Credit cards (Visa, Mastercard, American Express)</li>
              <li>Debit cards</li>
              <li>Digital wallets (PayPal, Google Pay, Apple Pay)</li>
              <li>Bank transfers (for certain markets or large purchases)</li>
              <li>Mobile money (for African and Caribbean markets where available)</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Payment processing is handled by secure third-party processors. We do not store your complete payment card details.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">3.3 Billing and Invoicing</h4>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>One-time purchases:</strong> (per-property listings, one-time ads) Charged immediately upon purchase</li>
              <li><strong>Subscription services:</strong> (agent subscriptions) Charged on the date you subscribe and automatically on each renewal date</li>
              <li><strong>Recurring advertising:</strong> (if applicable) Charged according to campaign schedule</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You will receive a receipt via email for each successful payment. Invoices are available in your account dashboard.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">3.4 Taxes</h4>
            <p className="text-gray-700 mb-4">
              All prices are exclusive of applicable taxes unless otherwise stated. You are responsible for all sales taxes, VAT, GST, duties, and other taxes or fees required by your jurisdiction. Where required by law, we will collect and remit applicable taxes.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">3.5 Failed Payments</h4>
            <p className="text-gray-700 mb-4">
              If a payment fails: For subscriptions, we will attempt to charge your payment method up to 3 times over 10 days. If all attempts fail, your subscription will be cancelled and access to subscription features will be suspended. For one-time purchases, your purchase will not be processed and services will not be activated.
            </p>
            <p className="text-gray-700 mb-6">
              You are responsible for ensuring your payment method has sufficient funds and is current. We are not liable for service interruptions due to payment failures.
            </p>

            <div className="bg-red-50 border border-red-200 p-6 rounded-lg my-8">
              <h3 className="text-xl font-bold text-red-800 mb-4">4. NO REFUND POLICY</h3>
              <p className="text-red-800 font-bold text-lg mb-4">ALL FEES ARE FINAL AND NON-REFUNDABLE</p>
              
              <h4 className="text-lg font-semibold text-red-700 mb-3">4.1 General No-Refund Policy</h4>
              <p className="text-gray-700 mb-3">
                ALL PAYMENTS ARE FINAL AND NON-REFUNDABLE. This applies to all Services, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Agent subscription fees (monthly, annual, or any other billing period)</li>
                <li>Per-property listing fees (landlord and FSBO listings)</li>
                <li>Featured or premium listing upgrades</li>
                <li>Advertising services and campaigns</li>
                <li>Add-on features or services</li>
              </ul>

              <h4 className="text-lg font-semibold text-red-700 mb-3">4.2 No Refunds for Early Sale/Rental</h4>
              <p className="text-gray-700 mb-3">NO REFUNDS will be provided if:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Your property sells or rents before the listing period expires</li>
                <li>You decide not to sell or rent your property</li>
                <li>You change your mind about the service</li>
                <li>You decide to list with an agent instead</li>
                <li>You don't receive the number of inquiries you expected</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Once your listing is live, fees are earned and non-refundable regardless of outcome.
              </p>

              <h4 className="text-lg font-semibold text-red-700 mb-3">4.3 No Refunds for Subscription Cancellation</h4>
              <p className="text-gray-700 mb-4">If you cancel an Agent subscription:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>NO PRORATED REFUNDS:</strong> You will not receive a refund for any unused portion of your subscription period</li>
                <li><strong>Access maintained until end of period:</strong> You retain access to subscription features until the end of your current billing period</li>
                <li><strong>No auto-renewal after cancellation:</strong> Your subscription will not renew after the current period ends</li>
              </ul>
              <p className="text-gray-700 mb-4">
                <em>Example: If you subscribe on January 1 for a monthly plan and cancel on January 15, you will have access until January 31 but will not receive a refund for the days between January 15-31.</em>
              </p>

              <h4 className="text-lg font-semibold text-red-700 mb-3">4.4 No Refunds for Service Issues or Dissatisfaction</h4>
              <p className="text-gray-700 mb-3">NO REFUNDS will be provided for:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Poor performance or low visibility of your listings</li>
                <li>Fewer inquiries than expected</li>
                <li>Technical issues that are resolved within a reasonable timeframe</li>
                <li>Dissatisfaction with platform features or changes</li>
                <li>Your decision that the service isn't right for you</li>
              </ul>
              <p className="text-gray-700 mb-4">
                We make no guarantees about the performance, results, or outcomes from using our Services.
              </p>

              <h4 className="text-lg font-semibold text-red-700 mb-3">4.5 EU Consumer Right of Withdrawal Exception</h4>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-4">
                <p className="text-blue-800 font-semibold mb-2">Important for EU Consumers:</p>
                <p className="text-gray-700 mb-3">
                  Under EU Consumer Rights Directive, consumers normally have a 14-day right of withdrawal for online purchases. HOWEVER, by purchasing our Services, you expressly request that we begin performance immediately and acknowledge that:
                </p>
                <ul className="list-disc list-inside text-gray-700 mb-3 space-y-1">
                  <li><strong>You waive your right of withdrawal:</strong> You expressly agree that we begin providing the service immediately upon purchase</li>
                  <li><strong>Services fully performed:</strong> Once your listing is published or subscription activated, the service has been fully performed with your consent</li>
                  <li><strong>No refund after activation:</strong> You lose your right of withdrawal once the service begins</li>
                </ul>
                <p className="text-gray-700">
                  At the time of purchase, you must explicitly consent to immediate service activation and acknowledge loss of withdrawal rights. This consent is required to complete your purchase.
                </p>
              </div>

              <h4 className="text-lg font-semibold text-red-700 mb-3">4.6 Exceptions to No-Refund Policy</h4>
              <p className="text-gray-700 mb-3">The ONLY circumstances where a refund may be provided:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li><strong>Duplicate charges:</strong> If you are accidentally charged twice for the same service</li>
                <li><strong>Service not delivered due to our fault:</strong> If we completely fail to activate your service despite successful payment (not including temporary technical issues)</li>
                <li><strong>Fraudulent charges:</strong> If your payment method was used without authorization (subject to verification)</li>
                <li><strong>At our sole discretion:</strong> In exceptional circumstances at Portal Home Hub's sole and absolute discretion</li>
              </ul>
              <p className="text-gray-700">
                To request a refund under these limited exceptions, contact billing@portalhomehub.com within 7 days of the charge with evidence supporting your claim.
              </p>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-4">5. AGENT SUBSCRIPTION TERMS</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">5.1 Auto-Renewal</h4>
            <p className="text-gray-700 mb-4">
              ALL SUBSCRIPTIONS AUTO-RENEW. By subscribing, you authorize Portal Home Hub to automatically charge your payment method at the end of each billing period until you cancel. Monthly subscriptions renew automatically each month on your subscription anniversary date. Annual subscriptions renew automatically each year on your subscription anniversary date.
            </p>
            <p className="text-gray-700 mb-4">
              You will receive an email reminder 7 days before each renewal. You are responsible for cancelling before the renewal date if you do not wish to continue.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">5.2 Cancellation Process</h4>
            <p className="text-gray-700 mb-3">You may cancel your subscription at any time by:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Visiting your account settings and clicking 'Cancel Subscription'</li>
              <li>Emailing subscriptions@portalhomehub.com with your account information</li>
              <li>Contacting customer support</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Cancellation must be completed at least 24 hours before your next renewal date to avoid being charged for the next period. Cancellations take effect at the end of your current billing period.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">5.3 Access After Cancellation</h4>
            <p className="text-gray-700 mb-3">After cancellation:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>You retain full access until the end of your current paid period</li>
              <li>Your listings remain active until the end of the period</li>
              <li>After the period ends, your listings are automatically deactivated</li>
              <li>Your account and data are retained for 90 days in case you reactivate</li>
              <li>After 90 days of inactivity, your listings may be permanently deleted</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">5.4 Subscription Changes</h4>
            <p className="text-gray-700 mb-3">You may upgrade or downgrade your subscription tier at any time:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li><strong>Upgrades:</strong> Take effect immediately. You will be charged a prorated amount for the remainder of your current billing period.</li>
              <li><strong>Downgrades:</strong> Take effect at the end of your current billing period. No credits or refunds for the difference.</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-4">6. LISTING DURATION AND RENEWAL</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">6.1 Per-Property Listing Duration</h4>
            <p className="text-gray-700 mb-4">
              Per-property listings purchased by landlords and FSBO sellers have a fixed duration selected at purchase (typically 30, 60, or 90 days). Your listing is live and visible for the full purchased duration, automatically deactivates at the end of the period, and expired listings cannot be extended; you must purchase a new listing.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">6.2 Early Removal</h4>
            <p className="text-gray-700 mb-4">
              You may remove your listing before it expires (e.g., if your property sells/rents). NO REFUNDS will be provided for early removal or unused time.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">6.3 Renewal Options</h4>
            <p className="text-gray-700 mb-3">Before your listing expires, you will receive notification with the option to:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Renew the same listing:</strong> Purchase another period for the same property</li>
              <li><strong>Create a new listing:</strong> If you have a different property to list</li>
              <li><strong>Upgrade to subscription:</strong> Switch to an agent subscription for unlimited listings</li>
            </ul>
            <p className="text-gray-700 mb-6">
              Renewals require a new payment and are subject to current pricing (which may differ from your original purchase).
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">7. ADVERTISING STANDARDS AND APPROVAL</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">7.1 Ad Content Requirements</h4>
            <p className="text-gray-700 mb-3">All advertising content must:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Be truthful, accurate, and not misleading</li>
              <li>Comply with all applicable advertising laws and regulations</li>
              <li>Not infringe on intellectual property rights</li>
              <li>Be appropriate for a professional real estate audience</li>
              <li>Meet our technical specifications (size, format, file size)</li>
              <li>Not contain malicious code or tracking beyond what we approve</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">7.2 Prohibited Advertising Content & Private Listing Disclaimer</h4>
            
            <h5 className="text-base font-semibold text-gray-700 mb-3">Private Listing Verification Disclaimer</h5>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded mb-4">
              <p className="text-amber-800 font-semibold mb-2">⚠️ Important Notice for Private Listings:</p>
              <p className="text-gray-700 mb-3">
                Portal Home Hub hosts both professionally managed listings and private listings posted directly by property owners ("For Sale By Owner" or FSBO listings). <strong>We do not independently verify the accuracy, legitimacy, or compliance of private listings with local regulations.</strong>
              </p>
              <p className="text-gray-700 mb-3">
                Private listings may not have undergone professional verification, compliance checks, or quality control that typically accompanies professionally managed properties. Users engaging with private listings do so at their own risk and should conduct thorough due diligence.
              </p>
              <p className="text-gray-700">
                <strong>Professional Users:</strong> Exercise additional caution when working with private listings and ensure your clients understand the distinction between professionally managed and private listings.
              </p>
            </div>

            <h5 className="text-base font-semibold text-gray-700 mb-3">Prohibited Advertising Content</h5>
            <p className="text-gray-700 mb-3">We do not accept advertisements for:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Illegal products, services, or activities</li>
              <li>Adult content or services</li>
              <li>Gambling (except legally licensed operators in permitted jurisdictions)</li>
              <li>Tobacco, vaping, or recreational drugs</li>
              <li>Weapons or ammunition</li>
              <li>Multi-level marketing or pyramid schemes</li>
              <li>Get-rich-quick schemes or financial scams</li>
              <li>Content that promotes hate, violence, or discrimination</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">7.3 Ad Approval Process</h4>
            <p className="text-gray-700 mb-3">All advertising is subject to our approval:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>Review period:</strong> We review ads within 24-48 hours of submission</li>
              <li><strong>Rejection:</strong> We may reject ads that don't meet our standards. Fees are still non-refundable.</li>
              <li><strong>Revisions:</strong> You may revise rejected ads within your campaign period</li>
              <li><strong>Removal:</strong> We reserve the right to remove approved ads if they later violate policies</li>
            </ul>
            <p className="text-gray-700 mb-4">
              NO REFUNDS will be provided for rejected or removed advertising content.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">7.4 Ad Performance</h4>
            <p className="text-gray-700 mb-3">We make no guarantees regarding:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>Number of impressions delivered</li>
              <li>Click-through rates or conversions</li>
              <li>Ad placement or positioning</li>
              <li>Return on investment or sales generated</li>
            </ul>
            <p className="text-gray-700 mb-6">
              Ad performance varies based on many factors outside our control. Poor ad performance does not entitle you to refunds, credits, or compensation.
            </p>

            <h3 className="text-xl font-bold text-gray-900 mb-4">8. WARRANTIES, DISCLAIMERS, AND LIMITATIONS</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">8.1 Your Warranties</h4>
            <p className="text-gray-700 mb-3">By purchasing Services, you warrant that:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>You have legal authority to enter into this Agreement</li>
              <li>All information you provide is accurate and complete</li>
              <li>You own or have rights to all content you upload</li>
              <li>You will comply with all applicable laws and our policies</li>
              <li>Your payment information is accurate and you authorize charges</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">8.2 Service Disclaimers</h4>
            <p className="text-gray-700 mb-4">
              THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE." TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li><strong>No guarantee of results:</strong> We do not guarantee your property will sell, rent, or receive inquiries</li>
              <li><strong>No guarantee of uptime:</strong> We strive for reliable service but don't guarantee uninterrupted access</li>
              <li><strong>No guarantee of traffic:</strong> We don't guarantee specific numbers of views, clicks, or leads</li>
              <li><strong>No guarantee of buyers/renters:</strong> We facilitate connections but don't guarantee transactions</li>
            </ul>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">8.3 Limitation of Liability</h4>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>Portal Home Hub is not liable for any lost profits, lost revenue, lost business opportunities, or consequential damages arising from your use of the Services</li>
              <li>Our total liability to you for any claims related to the Services is limited to the amount you paid us in the 12 months prior to the claim, or $100, whichever is greater</li>
              <li>We are not responsible for the actions of users, property transactions, or outcomes of listings</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-4">9. TERMINATION AND SUSPENSION</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">9.1 Our Right to Terminate</h4>
            <p className="text-gray-700 mb-3">We may suspend or terminate your access to Services at any time if:</p>
            <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
              <li>You violate this Agreement or any of our policies</li>
              <li>You engage in fraudulent or illegal activity</li>
              <li>Your payment fails or you have unpaid fees</li>
              <li>You lose your professional license (for agents)</li>
              <li>We are required to do so by law or court order</li>
              <li>At our sole discretion for any reason or no reason</li>
            </ul>
            <p className="text-gray-700 mb-4">
              NO REFUNDS will be provided if we terminate your account for violations.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">9.2 Effect of Termination</h4>
            <p className="text-gray-700 mb-3">Upon termination:</p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>Your listings are immediately deactivated</li>
              <li>You lose access to your account and all features</li>
              <li>You remain liable for all outstanding fees</li>
              <li>No refunds or credits are provided for unused services</li>
              <li>We may delete your data after a reasonable period</li>
            </ul>

            <h3 className="text-xl font-bold text-gray-900 mb-4">10. GENERAL PROVISIONS</h3>
            
            <h4 className="text-lg font-semibold text-gray-800 mb-3">10.1 Entire Agreement</h4>
            <p className="text-gray-700 mb-4">
              This Agreement, together with our Terms of Use, Privacy Policy, Acceptable Use Policy, and Cookie Policy, constitutes the entire agreement between you and Portal Home Hub regarding the Services.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">10.2 Amendments</h4>
            <p className="text-gray-700 mb-4">
              We may update this Agreement at any time. Material changes will be notified via email or platform notification at least 30 days before they take effect. Continued use of Services after changes take effect constitutes acceptance.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">10.3 Assignment</h4>
            <p className="text-gray-700 mb-4">
              You may not transfer or assign your rights under this Agreement. We may assign this Agreement to any successor or affiliate.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">10.4 Governing Law and Disputes</h4>
            <p className="text-gray-700 mb-4">
              This Agreement is governed by the laws of the State of Delaware, United States. Any disputes shall be resolved in the courts of Delaware, except as required by mandatory consumer protection laws in your jurisdiction.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>For EU consumers:</strong> You retain any mandatory consumer rights under EU law, including the right to bring disputes in your local jurisdiction.
            </p>

            <h4 className="text-lg font-semibold text-gray-800 mb-3">10.5 Severability</h4>
            <p className="text-gray-700 mb-6">
              If any provision of this Agreement is found invalid or unenforceable, the remaining provisions remain in full force and effect.
            </p>

            {/* Contact Section */}
            <div className="bg-gray-100 p-6 rounded-lg mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">11. CONTACT INFORMATION</h3>
              <p className="text-gray-700 mb-4">
                For questions about this Agreement or billing issues, contact:
              </p>
              <div className="space-y-2 mb-6">
                <p className="text-gray-800 font-semibold">Portal Home Hub, Inc.</p>
                <p className="text-gray-700">Billing inquiries: billing@portalhomehub.com</p>
                <p className="text-gray-700">Subscription management: subscriptions@portalhomehub.com</p>
                <p className="text-gray-700">General support: support@portalhomehub.com</p>
                <p className="text-gray-700">Website: www.portalhomehub.com</p>
              </div>

              <div className="space-y-3">
                <a 
                  href="https://wa.me/5927629797?text=Hi%20Portal%20Home%20Hub!%20I%20have%20a%20question%20about%20your%20professional%20services%20agreement." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <span className="mr-2">💬</span>
                  WhatsApp Support
                </a>
                <p className="text-sm text-gray-600">
                  Preferred method for fastest response • +592 762-9797
                </p>
              </div>
            </div>

            <hr className="my-8" />

            <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-800 mb-4">ACKNOWLEDGMENT</h3>
              <p className="text-blue-800 font-semibold mb-3">By completing your purchase, you acknowledge that:</p>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>You have read and agree to this Professional Services Agreement</li>
                <li>You understand ALL fees are NON-REFUNDABLE</li>
                <li><strong>For EU consumers:</strong> You expressly request immediate service activation</li>
                <li><strong>For EU consumers:</strong> You waive your 14-day right of withdrawal</li>
                <li>You authorize automatic charges for subscription renewals</li>
              </ol>
            </div>
            
            <div className="text-center text-xs text-gray-500 mt-4">
              © 2025 Portal Home Hub, Inc. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}