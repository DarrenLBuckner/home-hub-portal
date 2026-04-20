import { createBrowserClient } from '@supabase/ssr'

/**
 * Read the country-code cookie set by middleware.
 * Returns 'GY' as a safe default if cookie is missing (matches middleware fallback).
 */
function readCountryCookie(): string {
  if (typeof document === 'undefined') return 'GY'
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith('country-code='))
  return match?.split('=')[1] ?? 'GY'
}

export function createClient() {
  const countryCode = readCountryCookie()
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          'x-country-code': countryCode,
        },
      },
    }
  )
}

// For backward compatibility
export function createClientComponentClient() {
  return createClient()
}
