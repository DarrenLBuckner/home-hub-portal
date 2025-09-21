import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Single shared instance to prevent multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export const createClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseInstance
}

// Export the singleton instance directly
export const supabase = createClient()