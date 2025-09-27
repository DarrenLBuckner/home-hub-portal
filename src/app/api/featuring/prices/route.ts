import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/featuring/prices - Get featuring prices for a site
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('site') || 'portal'
    
    const { data, error } = await supabase
      .from('featuring_prices')
      .select('*')
      .eq('site_id', siteId)
      .eq('is_active', true)
      .order('feature_type')
      .order('duration_days')
    
    if (error) throw error
    
    // Group by feature type for easier frontend consumption
    const pricesByType = (data || []).reduce((acc, price) => {
      if (!acc[price.feature_type]) {
        acc[price.feature_type] = []
      }
      acc[price.feature_type].push(price)
      return acc
    }, {} as Record<string, any[]>)
    
    return NextResponse.json({
      prices: data || [],
      prices_by_type: pricesByType,
      site_id: siteId
    })
  } catch (error) {
    console.error('Error fetching featuring prices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featuring prices' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}