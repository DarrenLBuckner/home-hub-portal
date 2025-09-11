// Country data fetcher
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export async function getActiveCountries() {
  const { data, error } = await supabase.from("countries").select().eq("status", "active");
  if (error) throw error;
  return data;
}

export async function getCountryRegions(countryCode: string) {
  // TODO: Replace with real regions table
  const { data, error } = await supabase.from("regions").select().eq("country_code", countryCode);
  if (error) throw error;
  return data;
}
