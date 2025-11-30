import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userType, countryId } = await request.json();

    // Only provide counter for agents
    if (userType !== 'agent') {
      return NextResponse.json({
        success: false,
        error: 'Counter only available for agents'
      });
    }

    const supabase = createServiceRoleClient();

    // Get the founding agent promo code for the specified country
    const { data: promoCode, error } = await supabase
      .from('promo_codes')
      .select('max_redemptions, current_redemptions, is_active')
      .eq('code', 'FOUNDERS-AGENT-GY')
      .eq('country_id', countryId || 'GY')
      .eq('user_type', 'agent')
      .single();

    if (error || !promoCode) {
      return NextResponse.json({
        success: false,
        error: 'Founding agent program not found'
      });
    }

    // Check if program is still active
    if (!promoCode.is_active) {
      return NextResponse.json({
        success: false,
        error: 'Founding agent program is no longer active'
      });
    }

    const spotsRemaining = Math.max(0, promoCode.max_redemptions - promoCode.current_redemptions);

    return NextResponse.json({
      success: true,
      spotsRemaining: spotsRemaining,
      maxSpots: promoCode.max_redemptions,
      spotsClaimed: promoCode.current_redemptions
    });

  } catch (error) {
    console.error('Founding agent counter error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get founding agent counter'
    }, { status: 500 });
  }
}