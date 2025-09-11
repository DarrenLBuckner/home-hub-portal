import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

// GET /api/properties/[id] - Get specific property
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await context.params
    
    const { data: property, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('Property fetch error:', error)
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    
    return NextResponse.json(property)
  } catch (error) {
    console.error('Property API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/properties/[id] - Update specific property
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await context.params
    const body = await request.json()
    
    const { data: property, error } = await supabase
      .from('properties')
      .update(body)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Property update error:', error)
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 })
    }
    
    return NextResponse.json(property)
  } catch (error) {
    console.error('Property update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/properties/[id] - Delete specific property
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await context.params
    
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Property deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Property deleted successfully' })
  } catch (error) {
    console.error('Property deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
