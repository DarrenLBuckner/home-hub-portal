import { createServiceRoleClient } from '@/lib/supabase/server'

// Best-effort IP extraction for Vercel/Node route handlers. There is no reliable
// request.ip in a Node route handler — the client IP arrives in proxy headers.
export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) {
    const first = xff.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp
  return 'unknown'
}

// Atomic counter rate limit backed by the Postgres function check_rate_limit
// (already deployed in the PHH Supabase). FAILS OPEN — a limiter error must never
// block legitimate lead capture.
export async function checkRateLimit(
  bucketKey: string,
  limit = 60,
  windowSeconds = 60,
): Promise<{ allowed: boolean; retryAfter: number }> {
  const retryAfter = windowSeconds - (Math.floor(Date.now() / 1000) % windowSeconds)
  try {
    const supabase = createServiceRoleClient()
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_bucket: bucketKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })
    if (error) {
      console.error('Rate limit check error (failing open):', error)
      return { allowed: true, retryAfter }
    }
    return { allowed: data === true, retryAfter }
  } catch (err) {
    // Any unexpected throw (e.g. client init) also fails open.
    console.error('Rate limit check threw (failing open):', err)
    return { allowed: true, retryAfter }
  }
}
