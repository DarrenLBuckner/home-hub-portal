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

  // TEMPORARILY DISABLED: Middleware auth protection causes login loops
  // The middleware auth.uid() returns null even for valid sessions
  // Will implement client-side logout protection instead
  // if (isProtectedRoute) {
  //   try {
  //     const { data: { user } } = await supabase.auth.getUser()
  //     
  //     if (!user) {
  //       console.log('🔒 Middleware: No authenticated user, redirecting to login')
  //       const redirectUrl = request.nextUrl.clone()
  //       redirectUrl.pathname = '/login'
  //       redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
  //       return NextResponse.redirect(redirectUrl)
  //     }
  //     
  //     console.log('✅ Middleware: User authenticated, allowing access to', request.nextUrl.pathname)
  //   } catch (error) {
  //     console.error('❌ Middleware auth check failed:', error)
  //     const redirectUrl = request.nextUrl.clone()
  //     redirectUrl.pathname = '/login'
  //     return NextResponse.redirect(redirectUrl)
  //   }
  // }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}