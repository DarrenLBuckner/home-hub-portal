// src/lib/auth.ts
import { createAdminClient } from '@/lib/supabase/admin'

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
    
    const authorized = allowedRoles.includes(user.user_type)
    return { authorized, userType: user.user_type }
  } catch (err) {
    return { authorized: false, error: 'Authentication error' }
  }
}

export async function requireAuth(request: Request) {
  // Basic auth check - you can enhance this with JWT verification
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader) {
    throw new Error('No authorization header')
  }
  
  // For now, return a placeholder user ID
  // In production, you'd verify the JWT token here
  return { userId: 'placeholder-user-id' }
}