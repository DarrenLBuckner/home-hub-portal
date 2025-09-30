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

export async function requireAuth(request: Request, requestBody?: any) {
  try {
    // Get the user ID from the request body (sent by authenticated frontend)
    const body = requestBody || await request.json()
    let userId = body.userId
    
    // If no userId provided or it's a placeholder, try to extract from session
    if (!userId || userId === 'will-be-extracted-by-api') {
      // Try to extract from Supabase session using cookies
      try {
        const { createServerComponentClient } = require('@supabase/auth-helpers-nextjs')
        const { cookies } = require('next/headers')
        
        const supabase = createServerComponentClient({ cookies })
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session?.user?.id) {
          console.error('❌ Session extraction failed:', error?.message || 'No session found')
          
          // Additional fallback: try to get user from Authorization header
          const authHeader = request.headers.get('authorization')
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            const adminSupabase = createAdminClient()
            const { data: { user }, error: userError } = await adminSupabase.auth.getUser(token)
            if (user?.id) {
              userId = user.id
              console.log('✅ Extracted userId from Authorization header:', userId)
            } else {
              console.error('❌ Failed to extract user from token:', userError)
            }
          }
          
          if (!userId) {
            throw new Error(`Failed to extract user from session: ${error?.message || 'No session found'}`)
          }
        } else {
          userId = session.user.id
          console.log('✅ Extracted userId from server session:', userId)
        }
      } catch (sessionError) {
        console.error('❌ Failed to extract user from session:', sessionError)
        console.error('❌ Session error details:', sessionError instanceof Error ? sessionError.message : 'Unknown error')
        
        // If session extraction fails due to corrupted cookies, 
        // we can't authenticate the request
        throw new Error('Authentication failed due to corrupted session. Please log out and log back in.')
      }
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