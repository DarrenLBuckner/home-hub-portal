import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

// TODO: rate limit 60/IP/min

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const supabase = createServiceRoleClient()

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('slug', slug)
      .eq('user_type', 'agent')
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const { data: listings, error: listingsError } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        slug,
        price,
        bedrooms,
        bathrooms,
        location,
        status,
        property_media!property_media_property_id_fkey (
          media_url,
          media_type,
          display_order,
          is_primary
        )
      `)
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (listingsError) {
      console.error('Agent listings fetch error:', listingsError)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    const results = (listings ?? []).map((property: any) => {
      const images = (property.property_media ?? [])
        .filter((m: any) => m.media_type === 'image')
        .sort((a: any, b: any) => {
          if (a.is_primary && !b.is_primary) return -1
          if (!a.is_primary && b.is_primary) return 1
          return a.display_order - b.display_order
        })
      return {
        id: property.id,
        title: property.title,
        slug: property.slug,
        price: property.price,
        thumbnail: images[0]?.media_url ?? null,
        beds: property.bedrooms,
        baths: property.bathrooms,
        location: property.location,
        status: property.status,
      }
    })

    return NextResponse.json(results, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error in agent listings API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
