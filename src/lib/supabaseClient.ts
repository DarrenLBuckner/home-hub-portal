import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Single shared instance to prevent multiple GoTrueClient instances
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export function for compatibility with existing imports
export const createClient = () => supabase
