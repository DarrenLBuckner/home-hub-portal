import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const siteFilter = searchParams.get('site')
    const siteHeader = request.headers.get('x-site-id')
    const showFeatured = searchParams.get('featured') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit
    
    // Determine site filter from query param or header
    const site = siteFilter || siteHeader
    
    // Build query with site filtering and featuring support
    let query = supabase
      .from('properties')
      .select(`
        *,
        featured_listings(
          feature_type,
          start_date,
          end_date,
          status
        )
      `, { count: 'exact' })
      .eq('status', 'available')
    
    // Apply site filter if provided
    if (site) {
      query = query.eq('site_id', site)
    }
    
    // Apply featured filter if requested
    if (showFeatured) {
      query = query.eq('is_featured', true)
    }
    
    // Apply pagination
    query = query.range(offset, offset + limit - 1)
    
    // Order by featuring priority, then visibility score, then created date
    query = query.order('is_featured', { ascending: false })
                 .order('feature_order_priority', { ascending: false })
                 .order('visibility_score', { ascending: false })
                 .order('created_at', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) throw error
    
    // Separate featured and regular properties for better organization
    const featuredProperties = (data || []).filter(p => p.is_featured)
    const regularProperties = (data || []).filter(p => !p.is_featured)
    
    // If not specifically requesting featured only, get a separate featured query for highlights
    let highlightedFeatured = []
    if (!showFeatured && featuredProperties.length < 3) {
      let featuredQuery = supabase
        .from('properties')
        .select(`
          *,
          featured_listings(
            feature_type,
            start_date,
            end_date,
            status
          )
        `)
        .eq('status', 'available')
        .eq('is_featured', true)
        .order('feature_order_priority', { ascending: false })
        .order('visibility_score', { ascending: false })
        .limit(6)
      
      if (site) {
        featuredQuery = featuredQuery.eq('site_id', site)
      }
      
      const { data: featuredData } = await featuredQuery
      highlightedFeatured = featuredData || []
    }
    
    // Return with CORS headers for frontend
    return NextResponse.json(
      { 
        properties: data || [],
        featured_properties: highlightedFeatured,
        featured_count: featuredProperties.length,
        regular_count: regularProperties.length,
        total: count || 0,
        page,
        limit,
        has_more: count ? offset + limit < count : false,
        site_filter: site || 'all',
        featured_filter: showFeatured
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-site-id',
        }
      }
    )
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch properties', 
        properties: [], 
        featured_properties: [],
        total: 0,
        site_filter: null 
      },
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
      'Access-Control-Allow-Headers': 'Content-Type, x-site-id',
    },
  })
}