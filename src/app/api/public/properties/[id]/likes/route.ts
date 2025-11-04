import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const propertyId = params.id

    // Get total likes count for this property
    const { data: likes, error } = await supabase
      .from('property_likes')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)

    if (error) {
      console.error('Error fetching likes count:', error)
      return NextResponse.json({ error: 'Failed to fetch likes' }, { status: 500 })
    }

    // Get IP address for checking if user already liked
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Check if this IP has already liked this property (last 24 hours)
    const { data: existingLike, error: checkError } = await supabase
      .from('property_likes')
      .select('id')
      .eq('property_id', propertyId)
      .eq('ip_address', ip)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)

    if (checkError) {
      console.error('Error checking existing like:', checkError)
    }

    return NextResponse.json({
      likes_count: likes?.count || 0,
      user_has_liked: !!existingLike?.length,
      property_id: propertyId
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('Error in likes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const propertyId = params.id

    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Rate limiting: Check if this IP has liked this property in the last 24 hours
    const { data: existingLike, error: checkError } = await supabase
      .from('property_likes')
      .select('id')
      .eq('property_id', propertyId)
      .eq('ip_address', ip)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)

    if (checkError) {
      console.error('Error checking existing like:', checkError)
      return NextResponse.json({ error: 'Failed to check existing like' }, { status: 500 })
    }

    if (existingLike?.length > 0) {
      return NextResponse.json({ 
        error: 'Already liked this property today',
        likes_count: null,
        user_has_liked: true 
      }, { status: 409 })
    }

    // Add the like
    const { error: insertError } = await supabase
      .from('property_likes')
      .insert({
        property_id: propertyId,
        ip_address: ip,
        user_agent: request.headers.get('user-agent') || '',
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Error adding like:', insertError)
      return NextResponse.json({ error: 'Failed to add like' }, { status: 500 })
    }

    // Get updated count
    const { count, error: countError } = await supabase
      .from('property_likes')
      .select('*', { count: 'exact', head: true })
      .eq('property_id', propertyId)

    if (countError) {
      console.error('Error getting updated count:', countError)
    }

    return NextResponse.json({
      message: 'Like added successfully',
      likes_count: count || 0,
      user_has_liked: true,
      property_id: propertyId
    }, {
      status: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })

  } catch (error) {
    console.error('Error in likes POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}