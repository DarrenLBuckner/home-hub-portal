import { createClient } from '@supabase/supabase-js';

const backendUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const backendAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseBackend = createClient(backendUrl, backendAnonKey);
