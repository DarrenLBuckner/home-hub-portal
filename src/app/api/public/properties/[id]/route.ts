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

    // Get single property by ID with status 'available'
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .eq('status', 'available')
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

    return NextResponse.json(data, {
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