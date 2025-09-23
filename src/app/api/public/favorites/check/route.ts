import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/public/favorites/check - Check if property is favorited by user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get('email')
    const propertyId = searchParams.get('property_id')
    
    if (!userEmail || !propertyId) {
      return NextResponse.json(
        { error: 'email and property_id parameters are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('public_favorites')
      .select('id, created_at')
      .eq('user_email', userEmail)
      .eq('property_id', propertyId)
      .maybeSingle()

    if (error) {
      console.error('Error checking favorite:', error)
      return NextResponse.json(
        { error: 'Failed to check favorite status' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        is_favorited: !!data,
        favorite_id: data?.id || null,
        favorited_at: data?.created_at || null
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  } catch (error) {
    console.error('Check favorite error:', error)
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}