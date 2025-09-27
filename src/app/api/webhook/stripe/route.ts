import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' });

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const buf = await request.arrayBuffer();
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log('Stripe webhook received:', event.type);

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || session.metadata?.email;
    const paymentType = session.metadata?.payment_type || 'subscription';
    
    console.log('Checkout completed for:', email, 'Payment type:', paymentType);
    
    // TODO: Create payment history record once payment_history table is set up
    // TODO: Update user profile subscription status
  }

  // Handle payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const email = paymentIntent.metadata?.email;
    const paymentType = paymentIntent.metadata?.payment_type || 'subscription';
    
    console.log('Payment succeeded for:', email, 'Amount:', paymentIntent.amount, 'Type:', paymentType);
    
    // TODO: Create payment history record once payment_history table is set up
    // TODO: Update user profile subscription status
  }

  // Handle payment_intent.payment_failed
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const email = paymentIntent.metadata?.email;
    
    console.log('Payment failed for:', email, 'Amount:', paymentIntent.amount);
    
    // TODO: Create payment history record for failed payment
    // TODO: Update user profile to inactive status
  }

  return NextResponse.json({ received: true });
}
