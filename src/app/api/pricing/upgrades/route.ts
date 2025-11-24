import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countryId = searchParams.get('country_id') || 'GY';
    
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Get featured upgrade plans
    const { data: upgrades, error: upgradesError } = await supabase
      .from('pricing_plans')
      .select(`
        id,
        plan_name,
        user_type,
        plan_type,
        price,
        listing_duration_days,
        featured_listings_included,
        features,
        display_order,
        country_id
      `)
      .eq('is_active', true)
      .eq('country_id', countryId)
      .eq('plan_type', 'featured_upgrade')
      .order('display_order', { ascending: true });
    
    if (upgradesError) {
      console.error('Error fetching upgrade plans:', upgradesError);
      return NextResponse.json(
        { error: 'Failed to fetch upgrade plans' },
        { status: 500 }
      );
    }
    
    // Get country currency info
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
    const formattedUpgrades = upgrades.map(upgrade => ({
      ...upgrade,
      price_display: upgrade.price / 100,
      price_formatted: `${country.currency_symbol}${(upgrade.price / 100).toLocaleString()}`
    }));
    
    return NextResponse.json({
      success: true,
      country: country,
      upgrades: formattedUpgrades
    });
    
  } catch (error) {
    console.error('Pricing upgrades API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}