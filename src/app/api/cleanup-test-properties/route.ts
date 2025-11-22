import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    
    // First, get a count of what we're dealing with
    const { count: beforeCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
    
    // Identify test properties to delete
    const testPropertyConditions = `
      (title ILIKE '%test%' 
       OR title ILIKE '%mock%' 
       OR title ILIKE '%fake%'
       OR title ILIKE '%demo%')
      OR owner_whatsapp IS NULL 
      OR owner_whatsapp = ''
      OR owner_email LIKE '%test%'
      OR owner_email LIKE '%example%'
      OR owner_email LIKE '%fake%'
    `
    
    // Get list of test properties first (for logging)
    const { data: testProperties, error: testQueryError } = await supabase
      .from('properties')
      .select('id, title, owner_email, owner_whatsapp, created_at')
      .or(testPropertyConditions.replace(/\n/g, '').trim())
    
    if (testQueryError) {
      console.error('Error querying test properties:', testQueryError)
      return NextResponse.json({ error: 'Failed to query test properties' }, { status: 500 })
    }
    
    console.log(`Found ${testProperties?.length || 0} test properties to delete:`)
    testProperties?.forEach((prop: any) => {
      console.log(`- ${prop.title} (${prop.owner_email}) - Created: ${prop.created_at}`)
    })
    
    // Delete associated media first
    if (testProperties && testProperties.length > 0) {
      const propertyIds = testProperties.map((p: any) => p.id)
      
      const { error: mediaDeleteError } = await supabase
        .from('property_media')
        .delete()
        .in('property_id', propertyIds)
      
      if (mediaDeleteError) {
        console.error('Error deleting property media:', mediaDeleteError)
        return NextResponse.json({ error: 'Failed to delete property media' }, { status: 500 })
      }
      
      const { error: propertyDeleteError } = await supabase
        .from('properties')
        .delete()
        .in('id', propertyIds)
      
      if (propertyDeleteError) {
        console.error('Error deleting test properties:', propertyDeleteError)
        return NextResponse.json({ error: 'Failed to delete test properties' }, { status: 500 })
      }
    }
    
    // Get final count
    const { count: afterCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
    
    // Get remaining properties
    const { data: remainingProperties } = await supabase
      .from('properties')
      .select('id, title, owner_email, owner_whatsapp, listed_by_type, status, created_at')
      .order('created_at', { ascending: false })
    
    console.log(`Before: ${beforeCount || 0} properties`)
    console.log(`After: ${afterCount || 0} properties`) 
    console.log(`Deleted: ${(beforeCount || 0) - (afterCount || 0)} properties`)
    
    return NextResponse.json({
      success: true,
      deleted: (beforeCount || 0) - (afterCount || 0),
      remaining: afterCount || 0,
      deletedProperties: testProperties?.map((p: any) => ({
        id: p.id,
        title: p.title,
        owner_email: p.owner_email
      })),
      remainingProperties: remainingProperties?.map((p: any) => ({
        id: p.id,
        title: p.title,
        owner_email: p.owner_email,
        owner_whatsapp: p.owner_whatsapp,
        listed_by_type: p.listed_by_type,
        status: p.status
      }))
    })
    
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ 
      error: 'Cleanup failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    // Just show what would be deleted (preview mode)
    const { data: testProperties, error } = await supabase
      .from('properties')
      .select('id, title, owner_email, owner_whatsapp, listed_by_type, status, created_at')
      .or(`title.ilike.%test%,title.ilike.%mock%,title.ilike.%fake%,title.ilike.%demo%,owner_email.like.%test%,owner_email.like.%example%,owner_email.like.%fake%,owner_whatsapp.is.null`)
    
    if (error) {
      return NextResponse.json({ error: 'Query failed' }, { status: 500 })
    }
    
    const { data: allProperties } = await supabase
      .from('properties')
      .select('id, title, owner_email, owner_whatsapp, listed_by_type, status, created_at')
      .order('created_at', { ascending: false })
    
    return NextResponse.json({
      totalProperties: allProperties?.length || 0,
      testPropertiesToDelete: testProperties?.length || 0,
      testProperties: testProperties || [],
      allProperties: allProperties || []
    })
    
  } catch (error) {
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 })
  }
}