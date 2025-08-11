import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/users - Get all users
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Users fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    
    return NextResponse.json(users)
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/users - Create new user profile
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    const { data: user, error } = await supabase
      .from('profiles')
      .insert([body])
      .select()
      .single()
    
    if (error) {
      console.error('User creation error:', error)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }
    
    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('User creation API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}