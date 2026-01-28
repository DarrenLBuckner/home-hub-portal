import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received landlord registration data:', { ...body, password: '[REDACTED]' });
    const { first_name, last_name, email, phone, password, plan, promo_code, promo_benefits, promo_spot_number, is_founding_member } = body;

    if (!first_name || !last_name || !email || !phone || !password) {
      console.log('Missing fields:', { first_name: !!first_name, last_name: !!last_name, email: !!email, phone: !!phone, password: !!password });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Create Supabase Auth user
    const supabase = createAdminClient();
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name,
        last_name,
        phone: normalizedPhone,
        user_type: 'landlord',
        plan: plan || 'basic',
      },
      email_confirm: true,
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Prepare profile data with INSTANT APPROVAL for Landlords - properties still need approval
    const profileData: Record<string, any> = {
      email: email,
      first_name: first_name,
      last_name: last_name,
      phone: normalizedPhone,
      user_type: 'landlord',
      approval_status: 'approved', // Landlords get instant access - properties still need approval
      country_id: body.country_id || 'GY',
      updated_at: new Date().toISOString(),
    };

    // Handle promo code benefits directly (more reliable than HTTP call)
    let promoCodeData = null;
    if (promo_code) {
      console.log('Looking up promo code:', promo_code);
      const { data: promoCode, error: promoError } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promo_code.toUpperCase().trim())
        .single();

      if (promoError || !promoCode) {
        console.warn('Promo code lookup failed:', promoError?.message || 'Code not found');
      } else {
        promoCodeData = promoCode;

        // Calculate trial expiry date
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + promoCode.trial_days);

        // Apply promo code benefits to profile
        profileData.beta_user = true;
        profileData.beta_expiry = trialExpiry.toISOString();
        profileData.property_limit = promoCode.property_limit;
        profileData.subscription_tier = promoCode.assigns_to_tier || 'founding_member';
        profileData.subscription_status = 'active';

        console.log('Applying promo benefits:', {
          beta_expiry: profileData.beta_expiry,
          property_limit: profileData.property_limit,
          subscription_tier: profileData.subscription_tier
        });
      }
    }

    // Force update the profile to landlord type with promo benefits
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', data.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Try creating if update failed
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          ...profileData,
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Profile insert error:', insertError);
      }
    }

    // Create promo code redemption record if promo was applied
    if (promoCodeData && data.user) {
      const spotNumber = promoCodeData.current_redemptions + 1;
      const { error: redemptionError } = await supabase
        .from('promo_code_redemptions')
        .insert({
          promo_code_id: promoCodeData.id,
          user_id: data.user.id,
          spot_number: spotNumber,
          trial_days_applied: promoCodeData.trial_days,
          property_limit_applied: promoCodeData.property_limit,
          discount_applied: promoCodeData.discount_percentage
        });

      if (redemptionError) {
        console.error('Promo redemption record error:', redemptionError);
      } else {
        console.log(`Promo code redeemed successfully! Founding Member #${spotNumber}`);
      }
    }

    // Send welcome email to new landlord
    try {
      const { sendLandlordWelcomeEmail } = await import('@/lib/email.js');
      const spotNumber = promoCodeData ? promoCodeData.current_redemptions + 1 : null;
      const isFoundingMember = !!promoCodeData;
      await sendLandlordWelcomeEmail(email, first_name, isFoundingMember, spotNumber);
      console.log('✅ Landlord welcome email sent successfully');
    } catch (emailError) {
      console.warn('⚠️ Failed to send welcome email:', emailError);
      // Continue registration even if email fails
    }
    
    return NextResponse.json({ 
      user: data.user,
      message: 'Registration successful! Welcome email sent. You can now login to access your dashboard.' 
    });
  } catch (error: any) {
    console.error('Landlord registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}