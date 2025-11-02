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

    // Get single property by ID with status 'active' and include agent profile for agents only
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_media!property_media_property_id_fkey (
          media_url,
          media_type,
          display_order,
          is_primary
        ),
        profiles!properties_user_id_fkey (
          id,
          first_name,
          last_name,
          phone,
          user_type,
          profile_image,
          company
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

    // Extract agent profile data if user is an agent OR admin (owner admins can also have photos)
    const canShowProfile = data.profiles?.user_type === 'agent' || data.profiles?.user_type === 'admin'
    const agentProfile = canShowProfile ? {
      id: data.profiles.id,
      first_name: data.profiles.first_name,
      last_name: data.profiles.last_name,
      phone: data.profiles.phone,
      profile_image: data.profiles.profile_image,
      company: data.profiles.company,
      user_type: data.profiles.user_type // Include user_type to distinguish agents from admins
    } : null

    const transformedProperty = {
      ...data,
      images,
      agent_profile: agentProfile, // Only include if user is an agent
      property_media: undefined, // Remove the nested object
      profiles: undefined // Remove the nested profiles object
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