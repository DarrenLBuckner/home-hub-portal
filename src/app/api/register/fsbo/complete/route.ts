import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { sendWelcomeEmail, sendFSBOFoundingMemberEmail } from '@/lib/email.js';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Completing registration:', { ...body, registrationData: { ...body.registrationData, password: '[REDACTED]' } });
    
    const { tempRegistrationId, registrationData, paymentVerified } = body;
    
    if (!tempRegistrationId || !registrationData) {
      return NextResponse.json({ error: 'Missing registration data' }, { status: 400 });
    }
    
    const { first_name, last_name, email, phone, password, promo_code, promo_benefits, promo_spot_number, is_founding_member } = registrationData;
    const normalizedPhone = normalizePhoneNumber(phone);

    // For promo/founding member registrations, verify promo code was valid
    // For paid registrations, verify payment was completed
    if (!is_founding_member && !paymentVerified) {
      return NextResponse.json({ error: 'Payment verification required' }, { status: 400 });
    }
    
    // Final email check before creating user
    const supabase = createAdminClient();
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers.users?.some(user => user.email === email);
    
    if (emailExists) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 400 });
    }
    
    // NOW create the actual user account
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name,
        last_name,
        phone: normalizedPhone,
        user_type: 'owner',
      },
      email_confirm: true,
    });
    
    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create profile record with proper subscription status
    const subscriptionStatus = is_founding_member ? 'active' : 'pending_payment';
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: email,
        first_name: first_name,
        last_name: last_name,
        phone: normalizedPhone,
        user_type: 'owner',
        subscription_status: subscriptionStatus,
        is_founding_member: !!is_founding_member,
        promo_code: promo_code || null,
        promo_spot_number: promo_spot_number || null,
        created_at: new Date().toISOString()
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the registration if profile creation fails, but log it
    } else {
      console.log(`✅ Profile created for ${is_founding_member ? 'founding member' : 'regular'} FSBO user`);
    }

    // Handle promo code redemption if provided
    if (promo_code && data.user) {
      try {
        // Use 127.0.0.1 instead of localhost for server-to-server calls on Windows
        // localhost can have IPv6 resolution issues causing ECONNREFUSED
        const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL?.startsWith('http')
          ? process.env.NEXT_PUBLIC_FRONTEND_URL
          : 'http://127.0.0.1:3000';
        const redeemResponse = await fetch(`${baseUrl}/api/promo-codes/redeem`, {
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
          // For completed registrations, log but don't fail
        } else {
          console.log('Promo code redeemed successfully:', redeemResult.message);
        }
      } catch (redeemError) {
        console.error('Error redeeming promo code:', redeemError);
        // Don't fail registration if promo code redemption fails
      }
    }

    // Send appropriate welcome email based on user type
    try {
      if (is_founding_member && promo_code) {
        // Send special founding member email with personalized content
        await sendFSBOFoundingMemberEmail(email, first_name, promo_spot_number);
        console.log('✅ FSBO founding member welcome email sent successfully');
      } else {
        // Send regular welcome email for paid FSBO users
        await sendWelcomeEmail(email);
        console.log('✅ Regular FSBO welcome email sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }
    
    return NextResponse.json({ 
      success: true,
      user: data.user,
      message: 'Registration completed successfully!'
    });
    
  } catch (error: any) {
    console.error('Registration completion error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}