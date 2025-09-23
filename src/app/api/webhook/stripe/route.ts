import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/supabase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-08-27.basil' });

// Helper function to find user by email and update subscription status
async function updateUserSubscriptionByEmail(email: string, updates: any) {
  const supabase = createAdminClient();
  
  try {
    // First, find the user by email in the auth.users table
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('Failed to list auth users:', authError);
      return { error: authError };
    }

    const authUser = authUsers.users.find(user => user.email === email);
    if (!authUser) {
      console.error(`No auth user found with email: ${email}`);
      return { error: 'User not found' };
    }

    // Update the profiles table using the user ID
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', authUser.id);

    if (updateError) {
      console.error(`Failed to update profile for user ${authUser.id}:`, updateError);
      return { error: updateError };
    }

    console.log(`Successfully updated subscription for user ${authUser.id} (${email})`);
    return { success: true };
  } catch (error) {
    console.error('Error in updateUserSubscriptionByEmail:', error);
    return { error };
  }
}

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const buf = await request.arrayBuffer();
  let event;
  try {
    event = stripe.webhooks.constructEvent(Buffer.from(buf), sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log(`Received Stripe webhook: ${event.type}`);

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_details?.email || session.metadata?.email;
    const plan = session.metadata?.plan || 'extended'; // Default to extended plan
    
    if (email) {
      const result = await updateUserSubscriptionByEmail(email, {
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        payment_intent_id: session.payment_intent
      });
      
      if (result.error) {
        console.error(`Failed to update subscription for checkout.session.completed: ${email}`, result.error);
      }
      // TODO: Trigger welcome email here
    } else {
      console.error('No email found in checkout.session.completed event');
    }
  }

  // Handle payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const email = paymentIntent.metadata?.email;
    const plan = paymentIntent.metadata?.plan || 'extended'; // Default to extended plan
    
    if (email) {
      const result = await updateUserSubscriptionByEmail(email, {
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days from now
        payment_intent_id: paymentIntent.id
      });
      
      if (result.error) {
        console.error(`Failed to update subscription for payment_intent.succeeded: ${email}`, result.error);
      }
      // TODO: Trigger welcome email here
    } else {
      console.error('No email found in payment_intent.succeeded metadata');
    }
  }

  // Handle payment_intent.payment_failed
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const email = paymentIntent.metadata?.email;
    
    if (email) {
      const result = await updateUserSubscriptionByEmail(email, {
        subscription_status: 'payment_failed'
      });
      
      if (result.error) {
        console.error(`Failed to update subscription for payment_intent.payment_failed: ${email}`, result.error);
      }
      // TODO: Optionally notify user of payment failure
    } else {
      console.error('No email found in payment_intent.payment_failed metadata');
    }
  }

  return NextResponse.json({ received: true });
}
