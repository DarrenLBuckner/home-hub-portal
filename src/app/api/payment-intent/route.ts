import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { convertGYDToUSDCents } from '@/lib/currencyConversion';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = 'usd', email, plan } = body;
    if (!amount || !email || !plan) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Convert GYD to USD cents for Stripe
    const usdAmountCents = convertGYDToUSDCents(amount);
    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: usdAmountCents,
      currency,
      receipt_email: email,
      metadata: { plan, original_gyd: amount },
    });
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
