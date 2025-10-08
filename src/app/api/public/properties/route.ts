import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const site = searchParams.get('site') // e.g., 'guyana'
    const listing_type = searchParams.get('listing_type') // 'sale' or 'rent'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    console.log(`🔍 Fetching properties - site: ${site}, listing_type: ${listing_type}`)
    
    // Build the query - look for active properties
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_media!property_media_property_id_fkey (
          *
        )
      `)
      .in('status', ['active', 'pending']) // Look for active and pending properties
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Add site filtering if provided - but make it optional since many properties don't have site_id
    if (site) {
      console.log(`Filtering properties for site: ${site}`)
      // For now, skip site filtering since properties don't have site_id set
      // query = query.eq('site_id', site)
      console.log(`Note: Site filtering temporarily disabled - properties don't have site_id field`)
    }
    
    // Add listing type filtering if provided
    if (listing_type) {
      query = query.eq('listing_type', listing_type)
    }
    
    const { data: properties, error } = await query
    
    if (error) {
      console.error('Properties fetch error:', error)
      throw error
    }
    
    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'pending'])
    
    if (countError) {
      console.error('Count error:', countError)
    }
    
    // Transform the data to include images properly
    const transformedProperties = properties?.map((property: any) => {
      const images = property.property_media
        ?.filter((media: any) => media.media_type === 'image')
        ?.sort((a: any, b: any) => {
          // Primary images first, then by display_order
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return a.display_order - b.display_order
        })
        ?.map((media: any) => media.media_url) || []
      
      return {
        ...property,
        images,
        property_media: undefined // Remove the nested object
      }
    }) || []
    
    console.log(`✅ Fetched ${transformedProperties.length} properties for site: ${site || 'all'}`)
    
    // Return with CORS headers for frontend
    return NextResponse.json(
      { 
        properties: transformedProperties,
        total: count || 0,
        limit,
        offset,
        site: site || 'all'
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
      { error: 'Failed to fetch properties', properties: [] },
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