import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to get site_id from property or request
function getSiteIdFromCountry(country: string): string {
  if (!country) return 'portal';
  
  const countryLower = country.toLowerCase();
  if (countryLower.includes('guyana')) return 'guyana';
  if (countryLower.includes('ghana')) return 'ghana';
  return 'portal';
}

// GET /api/public/favorites - Get user's favorites by email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')
    const siteFilter = searchParams.get('site')
    
    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    // Build query for user's favorites
    let query = supabase
      .from('public_favorites')
      .select(`
        *,
        properties (
          id,
          title,
          price,
          property_type,
          region,
          city,
          bedrooms,
          bathrooms,
          images,
          status,
          site_id
        )
      `)
      .eq('user_email', userEmail)

    // Apply site filter if provided
    if (siteFilter) {
      query = query.eq('site_id', siteFilter)
    }

    const { data: favorites, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json(
        { error: 'Failed to fetch favorites' },
        { status: 500 }
      )
    }

    // Return with CORS headers
    return NextResponse.json(
      {
        favorites: favorites || [],
        total: favorites?.length || 0,
        user_email: userEmail,
        site_filter: siteFilter || 'all'
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-site-id',
        }
      }
    )
  } catch (error) {
    console.error('Favorites GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/public/favorites - Add favorite
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_email, property_id, site_id } = body

    if (!user_email || !property_id) {
      return NextResponse.json(
        { error: 'user_email and property_id are required' },
        { status: 400 }
      )
    }

    // Get property details for snapshot
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('title, price, region, city, property_type, site_id')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Determine site_id from property if not provided
    const finalSiteId = site_id || property.site_id || 'portal'

    // Add to favorites with property snapshot
    const { data: favorite, error } = await supabase
      .from('public_favorites')
      .insert({
        user_email,
        property_id,
        site_id: finalSiteId,
        property_title: property.title,
        property_price: property.price,
        property_location: `${property.city}, ${property.region}`,
        property_type: property.property_type
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'Property already in favorites' },
          { status: 409 }
        )
      }
      console.error('Error adding favorite:', error)
      return NextResponse.json(
        { error: 'Failed to add favorite' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Added to favorites',
        favorite: favorite
      },
      {
        status: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-site-id',
        }
      }
    )
  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/public/favorites - Remove favorite
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_email, property_id } = body

    if (!user_email || !property_id) {
      return NextResponse.json(
        { error: 'user_email and property_id are required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('public_favorites')
      .delete()
      .eq('user_email', user_email)
      .eq('property_id', property_id)

    if (error) {
      console.error('Error removing favorite:', error)
      return NextResponse.json(
        { error: 'Failed to remove favorite' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Removed from favorites' },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-site-id',
        }
      }
    )
  } catch (error) {
    console.error('Remove favorite error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-site-id',
    },
  })
}