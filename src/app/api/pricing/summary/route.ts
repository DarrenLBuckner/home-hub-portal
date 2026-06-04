import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { isCustomPricePlan } from '@/lib/pricing-display';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('country_id') || 'GY';

    const supabase = await createClient();

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

    // Get min price for each user type (excluding extensions/addons)
    const { data: plans, error: plansError } = await supabase
      .from('pricing_plans')
      .select('user_type, plan_type, price, plan_name')
      .eq('is_active', true)
      .eq('country_id', countryId)
      .not('plan_name', 'ilike', '%Admin%')  // Hide admin plans from public display
      .not('plan_name', 'ilike', '%+30%')  // Hide +30 day extensions from summary
      .not('plan_type', 'eq', 'featured_upgrade')  // Hide featured upgrades from summary
      .order('price', { ascending: true });

    if (plansError) {
      console.error('Error fetching pricing plans:', plansError);
      return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
    }

    // Calculate price ranges for each user type
    const agentPlans = plans.filter(p => p.user_type === 'agent');
    const landlordPlans = plans.filter(p => p.user_type === 'landlord');
    const fsboPlans = plans.filter(p => p.user_type === 'fsbo');

    const formatPrice = (price: number) => {
      return `${country.currency_symbol}${(price / 100).toLocaleString()}`;
    };

    const getRange = (planList: any[]) => {
      // Exclude custom-priced (price=0 / custom_pricing) plans so a range never
      // shows "GY$0-...".
      const priced = planList.filter(p => !isCustomPricePlan(p));
      if (priced.length === 0) return null;
      const min = Math.min(...priced.map(p => p.price));
      const max = Math.max(...priced.map(p => p.price));
      if (min === max) return formatPrice(min);
      return `${formatPrice(min)}-${formatPrice(max)}`;
    };

    // Get the starting price for agents (monthly subscription). Exclude
    // custom-priced plans (e.g. Cornerstone, price=0) so "starting from" never
    // resolves to GY$0 — it should be the lowest REAL price (e.g. Foundation).
    // plans are ordered price-ASC, so the first non-custom agent plan is the min.
    const agentPricedPlans = agentPlans.filter(p => !isCustomPricePlan(p));
    const agentStarting = agentPricedPlans.length > 0 ? formatPrice(agentPricedPlans[0].price) : null;

    return NextResponse.json({
      success: true,
      country: country,
      summary: {
        agent: {
          starting: agentStarting,
          suffix: '/month'
        },
        landlord: {
          range: getRange(landlordPlans),
          suffix: '/listing'
        },
        fsbo: {
          range: getRange(fsboPlans),
          suffix: '/listing'
        }
      }
    });

  } catch (error) {
    console.error('Pricing summary error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}