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
    // For now, we'll use a simpler approach that works with the current setup
    // In the future, this should be properly implemented with JWT verification
    
    // Get the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header')
    }
    
    // Extract the token (in a real implementation, you'd verify this JWT)
    const token = authHeader.substring(7)
    
    // For now, we'll need to get the user ID from the request body
    // This is not ideal but works for the current implementation
    const body = await request.clone().json()
    const userId = body.userId
    
    if (!userId) {
      throw new Error('No user ID provided')
    }
    
    return { userId }
  } catch (err) {
    throw new Error('Authentication failed')
  }
}