import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

// All publicly visible statuses (excludes draft — drafts must NEVER appear publicly).
const PUBLICLY_VISIBLE_STATUSES = ['active', 'under_contract', 'off_market', 'sold', 'rented'] as const

function resolveStatusValues(statusParam: string | null): readonly string[] {
  if (!statusParam || statusParam === 'all') return PUBLICLY_VISIBLE_STATUSES
  if ((PUBLICLY_VISIBLE_STATUSES as readonly string[]).includes(statusParam)) return [statusParam]
  // Unknown / unsafe values fall back to the publicly-visible set so draft can never leak.
  return PUBLICLY_VISIBLE_STATUSES
}

interface SortConfig {
  column: string
  ascending: boolean
}

function resolveSort(sortParam: string | null): SortConfig {
  switch (sortParam) {
    case 'created_at_asc':
      return { column: 'created_at', ascending: true }
    case 'price_desc':
      return { column: 'price', ascending: false }
    case 'price_asc':
      return { column: 'price', ascending: true }
    case 'created_at_desc':
    default:
      return { column: 'created_at', ascending: false }
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const bustCache = searchParams.get('bust')

    // Filters
    const site = searchParams.get('site')
    const listing_type = searchParams.get('listing_type')
    const listing_type_multiple = searchParams.get('listing_type_multiple')
    const searchQuery = searchParams.get('search') || ''
    const locationQuery = searchParams.get('location') || ''
    const locationExact = searchParams.get('location_exact') || ''
    const propertyType = searchParams.get('property_type') || ''
    const propertyCategory = searchParams.get('property_category') || ''
    const statusParam = searchParams.get('status')
    const sortParam = searchParams.get('sort')

    const statusValues = resolveStatusValues(statusParam)
    const sortConfig = resolveSort(sortParam)

    console.log(
      `🔍 Fetching properties - site: ${site}, listing_type: ${listing_type}, status: ${statusParam || 'all (default)'}, sort: ${sortParam || 'created_at_desc (default)'}, search: "${searchQuery}", location: "${locationQuery}"`
    )

    // Apply identical filters to both data and count queries so paginated totals always match
    // the rendered set (closes pre-existing count-query filter discrepancy).
    const applyFilters = (qb: any) => {
      qb = qb.in('status', statusValues)
      if (site) qb = qb.eq('site_id', site)
      if (listing_type_multiple) {
        qb = qb.in('listing_type', listing_type_multiple.split(','))
      } else if (listing_type) {
        qb = qb.eq('listing_type', listing_type)
      }
      if (searchQuery) {
        qb = qb.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%`
        )
      }
      if (locationExact) {
        qb = qb.ilike('location', `%${locationExact}%`)
      } else if (locationQuery && !searchQuery) {
        qb = qb.ilike('location', `%${locationQuery}%`)
      }
      if (propertyType) qb = qb.eq('property_type', propertyType)
      if (propertyCategory) qb = qb.eq('property_category', propertyCategory)
      return qb
    }

    // Data query
    let query = supabase
      .from('properties')
      .select(`
        *,
        profiles!properties_user_id_fkey (
          user_type
        ),
        property_media!property_media_property_id_fkey (
          media_url,
          media_type,
          display_order,
          is_primary
        )
      `)
    query = applyFilters(query)
    query = query
      .order(sortConfig.column, { ascending: sortConfig.ascending })
      .range(offset, offset + limit - 1)

    const { data: properties, error } = await query
    if (error) {
      console.error('Properties fetch error:', error)
      throw error
    }

    // Count query — same filters as data query for correct pagination totals.
    let countQuery = supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
    countQuery = applyFilters(countQuery)
    const { count, error: countError } = await countQuery
    if (countError) {
      console.error('Count error:', countError)
    }

    // Stable secondary sort: cluster sold/rented/off_market AGENT listings at the bottom of the
    // rendered page, preserving the user-selected primary sort within each group. Once consumers
    // pass status=active, this becomes a no-op for those calls — flagged for cleanup in a future PR.
    const demotedStatuses = new Set(['sold', 'rented', 'off_market'])
    properties?.sort((a: any, b: any) => {
      const aIsAgentDemoted = a.profiles?.user_type === 'agent' && demotedStatuses.has(a.status)
      const bIsAgentDemoted = b.profiles?.user_type === 'agent' && demotedStatuses.has(b.status)
      if (aIsAgentDemoted && !bIsAgentDemoted) return 1
      if (!aIsAgentDemoted && bIsAgentDemoted) return -1
      return 0
    })

    const transformedProperties =
      properties?.map((property: any) => {
        const images =
          Array.isArray(property.images) && property.images.length > 0
            ? property.images
            : property.property_media
                ?.filter((media: any) => media.media_type === 'image')
                ?.sort((a: any, b: any) => {
                  if (a.is_primary && !b.is_primary) return -1
                  if (!a.is_primary && b.is_primary) return 1
                  return a.display_order - b.display_order
                })
                ?.map((media: any) => media.media_url) || []
        return {
          ...property,
          images,
          property_media: undefined,
          profiles: undefined,
        }
      }) || []

    console.log(
      `✅ Fetched ${transformedProperties.length} properties (total ${count || 0}) for site: ${site || 'all'}`
    )

    return NextResponse.json(
      {
        properties: transformedProperties,
        total: count || 0,
        limit,
        offset,
        site: site || 'all',
        search_query: searchQuery || null,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-site-id',
          'Cache-Control': bustCache
            ? 'no-cache, no-store, must-revalidate'
            : 'public, max-age=60, s-maxage=60',
          'CDN-Cache-Control': bustCache ? 'no-cache' : 'max-age=60',
          'Vercel-CDN-Cache-Control': bustCache ? 'no-cache' : 'max-age=60',
        },
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
      'Access-Control-Allow-Headers': 'Content-Type, x-site-id',
    },
  })
}
