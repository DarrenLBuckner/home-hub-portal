# Payment Setup Instructions for Guyana Home Hub Portal

## 1. Choose a Payment Provider
- Stripe (recommended)
- PayPal
- Square
- Local Caribbean gateways (if needed)

## 2. Create an Account & Get API Keys
- Sign up for your provider
- Create a project/app
- Obtain API keys (public & secret)

## 3. Add API Keys to `.env.local`
```
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

## 4. Install Payment SDK
For Stripe:
```
npm install @stripe/stripe-js stripe
```
For PayPal:
```
npm install @paypal/react-paypal-js
```

## 5. Decide Payment Flow
- One-time payments, subscriptions, or both?
- Pay before access or after approval?
- Pricing tiers/options?

## 6. Prepare Payment Page
- `/pay` page is scaffolded
- Add payment form/components from SDK
- Use API keys from `.env.local`

## 7. Backend Integration (Optional)
- Create Next.js API route (e.g. `/api/payment`)
- Use secret key only in backend code

## 8. Test in Sandbox Mode
- Use test cards and sandbox credentials
- Verify successful and failed payments

## 9. Go Live
- Switch to live API keys in `.env.local`
- Update pricing
- Monitor transactions in provider dashboard

## 10. Provide API Keys & Preferences
Send to developer:
- Provider name
- Public & secret API keys (paste only in `.env.local`)
- Pricing options & payment flow preferences

---

Once ready, developer will help integrate, test, and ensure payments work for your users.
