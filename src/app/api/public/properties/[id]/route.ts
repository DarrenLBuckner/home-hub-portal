import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get single property by ID with status 'active'
    const { data, error } = await supabase
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
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching property:', error)
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Transform the data to include images properly (same logic as list endpoint)
    const images = data.property_media
      ?.filter((media: any) => media.media_type === 'image')
      ?.sort((a: any, b: any) => {
        // Primary images first, then by display_order
        if (a.is_primary && !b.is_primary) return -1
        if (!a.is_primary && b.is_primary) return 1
        return a.display_order - b.display_order
      })
      ?.map((media: any) => media.media_url) || []

    const transformedProperty = {
      ...data,
      images,
      property_media: undefined // Remove the nested object
    }

    return NextResponse.json(transformedProperty, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  } catch (error) {
    console.error('Error in property API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  }
}