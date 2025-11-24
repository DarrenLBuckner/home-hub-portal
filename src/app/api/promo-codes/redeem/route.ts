import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Get the promo code
    const { data: promoCode, error: codeError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (codeError || !promoCode) {
      return NextResponse.json({
        success: false,
        error: 'Invalid promo code'
      });
    }

    // Check if user already redeemed this code
    const { data: existingRedemption } = await supabase
      .from('promo_code_redemptions')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('user_id', userId)
      .single();

    if (existingRedemption) {
      return NextResponse.json({
        success: false,
        error: 'You have already redeemed this code'
      });
    }

    // Calculate spot number
    const spotNumber = promoCode.current_redemptions + 1;

    // Create redemption record (trigger will auto-increment current_redemptions)
    const { error: redemptionError } = await supabase
      .from('promo_code_redemptions')
      .insert({
        promo_code_id: promoCode.id,
        user_id: userId,
        spot_number: spotNumber,
        trial_days_applied: promoCode.trial_days,
        property_limit_applied: promoCode.property_limit,
        discount_applied: promoCode.discount_percentage
      });

    if (redemptionError) {
      console.error('Redemption error:', redemptionError);
      return NextResponse.json({
        success: false,
        error: 'Failed to redeem code. Please try again.'
      });
    }

    // Update user profile with founding member benefits
    const trialExpiry = new Date();
    trialExpiry.setDate(trialExpiry.getDate() + promoCode.trial_days);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        beta_user: true,
        beta_expiry: trialExpiry.toISOString(),
        property_limit: promoCode.property_limit,
        subscription_tier: promoCode.assigns_to_tier || 'founding_member',
        subscription_status: 'trial',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Don't fail - redemption was successful, profile update is secondary
    }

    return NextResponse.json({
      success: true,
      spotNumber: spotNumber,
      message: `Welcome Founding Member #${spotNumber}!`
    });

  } catch (error) {
    console.error('Promo code redemption error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}