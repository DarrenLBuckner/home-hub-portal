import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncPropertyToPublic } from '@/lib/supabase/sync'

// GET /api/properties - Get all properties
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data: properties, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Properties fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
    }
    
    return NextResponse.json(properties)
  } catch (error) {
    console.error('Properties API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/properties - Create new property and sync to public
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    // Create property in agent portal database
    const { data: property, error } = await supabase
      .from('properties')
      .insert([body])
      .select()
      .single()
    
    if (error) {
      console.error('Property creation error:', error)
      return NextResponse.json({ error: 'Failed to create property' }, { status: 500 })
    }
    
    // Sync to public database for customer viewing
    const syncResult = await syncPropertyToPublic(property)
    
    if (!syncResult.success) {
      console.warn('Property created but sync failed:', syncResult.error)
      // Don't fail the request, just log the sync issue
    }
    
    return NextResponse.json({ 
      property, 
      synced: syncResult.success,
      syncError: syncResult.success ? null : syncResult.error 
    }, { status: 201 })
    
  } catch (error) {
    console.error('Property creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}