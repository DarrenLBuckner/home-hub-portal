import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' });

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const buf = await request.arrayBuffer();
  let event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || session.metadata?.email;
    if (email) {
      const supabase = createAdminClient();
      await supabase.from('owners').update({ status: 'active', subscription_status: 'active', subscription_start: new Date().toISOString() }).eq('email', email);
      // TODO: Trigger welcome email here
    }
  }

  // Handle payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const email = paymentIntent.metadata?.email;
    if (email) {
      const supabase = createAdminClient();
      await supabase.from('owners').update({ status: 'active', subscription_status: 'active', subscription_start: new Date().toISOString() }).eq('email', email);
      // TODO: Trigger welcome email here
    }
  }

  // Handle payment_intent.payment_failed
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const email = paymentIntent.metadata?.email;
    if (email) {
      const supabase = createAdminClient();
      await supabase.from('owners').update({ status: 'payment_failed' }).eq('email', email);
      // TODO: Optionally notify user of payment failure
    }
  }

  return NextResponse.json({ received: true });
}
