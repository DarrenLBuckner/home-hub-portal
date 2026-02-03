import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    // Get query parameters
    const site = searchParams.get('site') // e.g., 'guyana'
    const listing_type = searchParams.get('listing_type') // 'sale' or 'rent'
    const listing_type_multiple = searchParams.get('listing_type_multiple') // 'lease,rent'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const bustCache = searchParams.get('bust') // Cache busting parameter
    
    // Search parameters
    const searchQuery = searchParams.get('search') || ''
    const locationQuery = searchParams.get('location') || ''
    const locationExact = searchParams.get('location_exact') || ''
    const propertyType = searchParams.get('property_type') || ''
    const propertyCategory = searchParams.get('property_category') || '' // residential or commercial
    
    console.log(`🔍 Fetching properties - site: ${site}, listing_type: ${listing_type}, listing_type_multiple: ${listing_type_multiple}, category: ${propertyCategory}, search: "${searchQuery}", location: "${locationQuery}"`)
    
    // Build the query - show properties with proper visibility logic:
    // - SALE properties: show active, under_contract, sold (for social proof)
    // - RENT properties: show active only (hide rented units)
    // - LEASE properties: show active, under_contract (commercial leases)
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_media!property_media_property_id_fkey (
          media_url,
          media_type,
          display_order,
          is_primary
        )
      `)
      .or(
        // Sale properties: show active, under_contract, sold for social proof
        `and(listing_type.eq.sale,status.in.(active,under_contract,sold)),` +
        // Rental properties: show active only (hide rented units)
        `and(listing_type.eq.rent,status.eq.active),` +
        // Lease properties: show active, under_contract (commercial leases)
        `and(listing_type.eq.lease,status.in.(active,under_contract)),` +
        // Short-term rent properties: show active only
        `and(listing_type.eq.short_term_rent,status.eq.active)`
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    // Add site filtering if provided
    // site_id is the lowercase country name (e.g., 'guyana', 'jamaica')
    // It maps to country_id which is the ISO code (e.g., 'GY', 'JM')
    // The public site passes site_id based on the domain (guyanahomehub.com → 'guyana')
    if (site) {
      console.log(`Filtering properties for site: ${site}`)
      query = query.eq('site_id', site)
    }
    
    // Add listing type filtering if provided
    if (listing_type) {
      query = query.eq('listing_type', listing_type)
    }
    
    // Add search filtering with performance optimization
    if (searchQuery) {
      // Search in title, description, and location using case-insensitive LIKE
      // For better performance, prioritize title matches first
      const searchTerm = String(searchQuery)
      query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%`)
    }
    
    // Add location filtering with proper string handling
    if (locationExact) {
      query = query.ilike('location', `%${String(locationExact)}%`)
    } else if (locationQuery && !searchQuery) {
      query = query.ilike('location', `%${String(locationQuery)}%`)
    }
    
    // Add property type filtering
    if (propertyType) {
      query = query.eq('property_type', propertyType)
    }

    // Add property category filtering (residential vs commercial)
    if (propertyCategory) {
      query = query.eq('property_category', propertyCategory)
    }

    // Add listing type filtering (sale vs rent/lease)
    if (listing_type_multiple) {
      const types = listing_type_multiple.split(',')
      query = query.in('listing_type', types)
    } else if (listing_type) {
      query = query.eq('listing_type', listing_type)
    }
    
    const { data: properties, error } = await query
    
    if (error) {
      console.error('Properties fetch error:', error)
      throw error
    }
    
    // Get total count for pagination with same visibility filters
    let countQuery = supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .or(
        // Sale properties: count active, under_contract, sold
        `and(listing_type.eq.sale,status.in.(active,under_contract,sold)),` +
        // Rental properties: count active only
        `and(listing_type.eq.rent,status.eq.active),` +
        // Lease properties: count active, under_contract
        `and(listing_type.eq.lease,status.in.(active,under_contract)),` +
        // Short-term rent properties: count active only
        `and(listing_type.eq.short_term_rent,status.eq.active)`
      )

    if (site) {
      countQuery = countQuery.eq('site_id', site)
    }
    if (listing_type_multiple) {
      const types = listing_type_multiple.split(',')
      countQuery = countQuery.in('listing_type', types)
    } else if (listing_type) {
      countQuery = countQuery.eq('listing_type', listing_type)
    }
    if (propertyCategory) {
      countQuery = countQuery.eq('property_category', propertyCategory)
    }
    
    const { count, error: countError } = await countQuery
    
    if (countError) {
      console.error('Count error:', countError)
    }
    
    // Transform the data to include images properly
    const transformedProperties = properties?.map((property: any) => {
      // Prefer images from the property.images column if present
      const images =
        Array.isArray(property.images) && property.images.length > 0
          ? property.images
          : (property.property_media
              ?.filter((media: any) => media.media_type === 'image')
              ?.sort((a: any, b: any) => {
                if (a.is_primary && !b.is_primary) return -1
                if (!a.is_primary && b.is_primary) return 1
                return a.display_order - b.display_order
              })
              ?.map((media: any) => media.media_url) || []);
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
        site: site || 'all',
        search_query: searchQuery || null
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-site-id',
          // Dynamic cache control - no cache if cache busting, otherwise short cache
          'Cache-Control': bustCache ? 'no-cache, no-store, must-revalidate' : 'public, max-age=60, s-maxage=60',
          'CDN-Cache-Control': bustCache ? 'no-cache' : 'max-age=60',
          'Vercel-CDN-Cache-Control': bustCache ? 'no-cache' : 'max-age=60'
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