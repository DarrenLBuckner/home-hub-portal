import { NextRequest, NextResponse } from 'next/server';
import { getCountrySupabase } from '@/lib/country-db';

export async function GET(request: NextRequest) {
  try {
    const { country, getRegions, getPricingPlans } = await getCountrySupabase();
    
    // Get country-specific data
    const { data: regions, error: regionsError } = await getRegions();
    const { data: pricingPlans, error: plansError } = await getPricingPlans();
    
    if (regionsError || plansError) {
      return NextResponse.json({
        error: 'Database error',
        details: { regionsError, plansError }
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      country,
      data: {
        regions: regions?.length || 0,
        pricingPlans: pricingPlans?.length || 0,
        regionNames: regions?.slice(0, 5).map(r => r.name) || [],
        planNames: pricingPlans?.map(p => p.plan_name) || []
      }
    });
    
  } catch (error) {
    console.error('Country test API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}