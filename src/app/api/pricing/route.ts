import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('country_id') || 'GY';
    const userType = searchParams.get('user_type');

    const supabase = await createClient();

    // Build query
    let query = supabase
      .from('pricing_plans')
      .select(`
        id,
        plan_name,
        user_type,
        plan_type,
        price,
        max_properties,
        listing_duration_days,
        featured_listings_included,
        features,
        is_popular,
        display_order,
        country_id
      `)
      .eq('is_active', true)
      .eq('country_id', countryId)
      .not('plan_name', 'ilike', '%Admin%')  // Hide admin plans from public registration
      .not('plan_name', 'ilike', '%+30%')  // Hide +30 day extensions from registration
      .not('plan_type', 'eq', 'featured_upgrade')  // Hide featured upgrades from initial registration
      .order('display_order', { ascending: true });

    if (userType) {
      query = query.eq('user_type', userType);
    }

    const { data: plans, error: plansError } = await query;

    if (plansError) {
      console.error('Error fetching pricing plans:', plansError);
      return NextResponse.json({ error: 'Failed to fetch pricing plans' }, { status: 500 });
    }

    // Get country currency info - hardcoded for now since we don't have countries table yet
    const getCountryInfo = (countryId: string) => {
      switch (countryId) {
        case 'GY':
          return { id: 'GY', name: 'Guyana', currency_code: 'GYD', currency_symbol: 'GY$' };
        case 'JM':
          return { id: 'JM', name: 'Jamaica', currency_code: 'JMD', currency_symbol: 'J$' };
        default:
          return { id: countryId, name: countryId, currency_code: 'USD', currency_symbol: '$' };
      }
    };

    const country = getCountryInfo(countryId);

    // Format prices for display (convert from cents)
    const formattedPlans = plans.map(plan => ({
      ...plan,
      price_display: plan.price / 100,
      price_formatted: `${country.currency_symbol}${(plan.price / 100).toLocaleString()}`
    }));

    return NextResponse.json({
      success: true,
      country: country,
      plans: formattedPlans
    });

  } catch (error) {
    console.error('Pricing API error:', error);
    return NextResponse.json({ error: 'Server error fetching pricing' }, { status: 500 });
  }
}