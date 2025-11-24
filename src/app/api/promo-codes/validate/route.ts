import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, userType, countryId } = await request.json();

    // Validate required fields
    if (!code || !userType || !countryId) {
      return NextResponse.json(
        { valid: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Look up the promo code
    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    // Code doesn't exist
    if (error || !promoCode) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid code. Please check and try again.'
      });
    }

    // Code is inactive
    if (!promoCode.is_active) {
      return NextResponse.json({
        valid: false,
        error: 'This code is no longer active.'
      });
    }

    // Code is expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'This code has expired.'
      });
    }

    // No spots remaining
    if (promoCode.current_redemptions >= promoCode.max_redemptions) {
      return NextResponse.json({
        valid: false,
        error: 'Sorry, all spots have been claimed!'
      });
    }

    // Wrong user type - IMPORTANT: Provide helpful error message
    if (promoCode.user_type !== userType) {
      const userTypeLabels: Record<string, string> = {
        'agent': 'Real Estate Agents',
        'property_owner': 'Landlords',
        'fsbo': 'For Sale By Owner sellers',
        'developer': 'Developers'
      };
      return NextResponse.json({
        valid: false,
        error: `This code is for ${userTypeLabels[promoCode.user_type] || promoCode.user_type} only.`
      });
    }

    // Wrong country
    if (promoCode.country_id !== countryId) {
      return NextResponse.json({
        valid: false,
        error: 'This code is not valid for your selected country.'
      });
    }

    // SUCCESS! Calculate benefits
    const spotsRemaining = promoCode.max_redemptions - promoCode.current_redemptions;
    const spotNumber = promoCode.current_redemptions + 1;

    return NextResponse.json({
      valid: true,
      code: promoCode.code,
      spotsRemaining: spotsRemaining,
      spotNumber: spotNumber,
      maxSpots: promoCode.max_redemptions,
      benefits: {
        trialDays: promoCode.trial_days,
        propertyLimit: promoCode.property_limit,
        discountPercentage: promoCode.discount_percentage,
        tier: promoCode.assigns_to_tier,
        description: promoCode.description
      }
    });

  } catch (error) {
    console.error('Promo code validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}