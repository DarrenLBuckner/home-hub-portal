// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard']
  const isProtectedRoute = protectedRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if (isProtectedRoute) {
    console.log(`🔒 MIDDLEWARE: Checking auth for protected route: ${request.nextUrl.pathname}`)
    
    // Get the session from cookies
    const accessToken = request.cookies.get('sb-opjnizbtppkynxzssijy-auth-token')
    console.log(`🍪 MIDDLEWARE: Access token exists: ${!!accessToken}`)
    
    const { data: { user }, error } = await supabase.auth.getUser()
    console.log(`👤 MIDDLEWARE: User object:`, user ? `${user.email} (${user.id})` : 'null')
    console.log(`❌ MIDDLEWARE: Auth error:`, error?.message || 'none')
    
    if (!user) {
      console.log(`🚫 MIDDLEWARE: No user found, redirecting to login`)
      // Redirect to login if not authenticated
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    console.log(`✅ MIDDLEWARE: User authenticated, allowing access to ${request.nextUrl.pathname}`)
    // For /dashboard routes, just let authenticated users through
    // The dashboard pages themselves will handle role-based redirects
    // This prevents middleware redirect loops
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}