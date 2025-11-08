import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

// GET /api/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await context.params
    
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('User fetch error:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update specific user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await context.params
    const body = await request.json() as Record<string, any>
    
    // CRITICAL SECURITY: Block any updates to Super Admin account
    const SUPER_ADMIN_EMAIL = 'mrdarrenbuckner@gmail.com'
    
    // Get the target user's current data
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', id)
      .single()
    
    if (fetchError || !currentUser) {
      console.error('User fetch error:', fetchError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Type assertion to help TypeScript understand the structure
    const userProfile = currentUser as { email: string }
    
    // Block any attempt to modify Super Admin
    if (userProfile.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      console.error('SECURITY VIOLATION: Attempt to modify Super Admin account blocked via API', {
        targetUserId: id,
        targetEmail: userProfile.email,
        updateData: JSON.stringify(body),
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'SECURITY VIOLATION: Super Admin account cannot be modified via API!' 
      }, { status: 403 })
    }
    
    // Special check for suspension attempts
    if (body.is_suspended === true) {
      console.error('SECURITY CHECK: Suspension attempt via API', {
        targetUserId: id,
        targetEmail: userProfile.email,
        timestamp: new Date().toISOString()
      })
    }
    
    // Update user with proper typing workaround
    const profilesQuery = supabase.from('profiles')
    const { data: user, error } = await (profilesQuery as any)
      .update(body)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('User update error:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('User update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete specific user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await context.params
    
    // CRITICAL SECURITY: Block deletion of Super Admin account
    const SUPER_ADMIN_EMAIL = 'mrdarrenbuckner@gmail.com'
    
    // Get the target user's current data before deletion
    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', id)
      .single()
    
    if (fetchError || !targetUser) {
      console.error('User fetch error before deletion:', fetchError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Type assertion to help TypeScript
    const userProfile = targetUser as { email: string }
    
    // Block any attempt to delete Super Admin
    if (userProfile.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      console.error('CRITICAL SECURITY VIOLATION: Attempt to delete Super Admin account blocked via API', {
        targetUserId: id,
        targetEmail: userProfile.email,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'CRITICAL SECURITY VIOLATION: Super Admin account cannot be deleted!' 
      }, { status: 403 })
    }
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('User deletion error:', error)
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('User deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
