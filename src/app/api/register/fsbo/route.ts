import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { sendWelcomeEmail } from '@/lib/email.js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received registration data:', { ...body, password: '[REDACTED]' });
    const { first_name, last_name, email, phone, password, promo_code, promo_benefits, promo_spot_number, is_founding_member } = body;
    if (!first_name || !last_name || !email || !phone || !password) {
      console.log('Missing fields:', { first_name: !!first_name, last_name: !!last_name, email: !!email, phone: !!phone, password: !!password });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create Supabase Auth user
    const supabase = createAdminClient();
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name,
        last_name,
        phone,
        user_type: 'owner',
      },
      email_confirm: true,
    });
    
    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Handle promo code redemption if provided
    if (promo_code && data.user) {
      try {
        const redeemResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/promo-codes/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: promo_code,
            userId: data.user.id
          })
        });

        const redeemResult = await redeemResponse.json();
        if (!redeemResult.success) {
          console.warn('Promo code redemption failed:', redeemResult.error);
        } else {
          console.log('Promo code redeemed successfully:', redeemResult.message);
        }
      } catch (redeemError) {
        console.error('Error redeeming promo code:', redeemError);
        // Don't fail registration if promo code redemption fails
      }
    }

    // Send welcome email (async, don't wait for it)
    try {
      await sendWelcomeEmail(email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }
    
    return NextResponse.json({ user: data.user });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
