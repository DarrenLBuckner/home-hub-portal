// src/lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type Database from '@/types/supabase'

export const createClientSupabaseClient = () => 
  createClientComponentClient<Database>()
