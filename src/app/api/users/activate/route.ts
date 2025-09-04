import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendPaymentConfirmationEmail } from '@/lib/email.js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, plan, paymentIntentId } = body;
    
    if (!userId || !plan || !paymentIntentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Get user email for confirmation email
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    
    // Update user profile to activate account
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_plan: plan,
        subscription_expires: new Date(Date.now() + (plan === 'basic' ? 60 : plan === 'extended' ? 90 : 180) * 24 * 60 * 60 * 1000).toISOString(),
        payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    // Send payment confirmation email (async, don't wait for it)
    if (user?.user?.email) {
      try {
        await sendPaymentConfirmationEmail(user.user.email);
      } catch (emailError) {
        console.error('Failed to send payment confirmation email:', emailError);
        // Don't fail the activation if email fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}