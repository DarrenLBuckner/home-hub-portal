// src/lib/auth.ts
import { createAdminClient } from '@/supabase-admin'

export async function verifyUserRole(userId: string, allowedRoles: string[]) {
  const supabase = createAdminClient()
  
  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return { authorized: false, error: 'User not found' }
    }
    
    const authorized = allowedRoles.includes((user as any).user_type)
    return { authorized, userType: (user as any).user_type }
  } catch (err) {
    return { authorized: false, error: 'Authentication error' }
  }
}

export async function requireAuth(request: Request) {
  try {
    // Get the user ID from the request body (sent by authenticated frontend)
    const body = await request.clone().json()
    const userId = body.userId
    
    if (!userId) {
      throw new Error('No user ID provided')
    }
    
    // Verify the user exists in our database
    const supabase = createAdminClient()
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, user_type')
      .eq('id', userId)
      .single()
    
    if (error || !profile) {
      throw new Error('User not found or invalid')
    }
    
    return { userId, userType: (profile as any).user_type }
  } catch (err) {
    throw new Error('Authentication failed')
  }
}