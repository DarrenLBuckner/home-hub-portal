import { createClient } from '@supabase/supabase-js'

// For client-side admin operations, we'll use the regular client
// The service role should only be used server-side
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  
  // Note: This returns a regular client for client-side use
  // For true admin operations that bypass RLS, we need server-side API routes
  return createClient(supabaseUrl, supabaseAnonKey)
}