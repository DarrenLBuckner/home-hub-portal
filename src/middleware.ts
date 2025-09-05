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
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Redirect to login if not authenticated
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check user role for specific dashboard routes
    if (request.nextUrl.pathname.startsWith('/dashboard/')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type, subscription_status')
        .eq('id', user.id)
        .single()

      const dashboardType = request.nextUrl.pathname.split('/')[2] // admin, agent, fsbo
      
      // Redirect if user type doesn't match dashboard
      if (profile) {
        // Super admin can access admin routes, regular admin can only access admin routes
        if (dashboardType === 'admin' && profile.user_type !== 'admin' && profile.user_type !== 'super_admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        if (dashboardType === 'agent' && profile.user_type !== 'agent') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        if (dashboardType === 'fsbo' && profile.user_type !== 'fsbo') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
        if (dashboardType === 'landlord' && profile.user_type !== 'landlord') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}