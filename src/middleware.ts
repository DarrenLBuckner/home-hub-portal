// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Country detection helper
function getCountryFromHost(hostname: string): 'GY' | 'JM' {
  if (hostname.includes('jamaica') || hostname.includes('jm')) {
    return 'JM';
  }
  return 'GY'; // Default to Guyana
}

export async function middleware(request: NextRequest) {
  // Detect country from hostname
  const country = getCountryFromHost(request.nextUrl.hostname);
  console.log(`🌍 MIDDLEWARE: Detected country: ${country} from hostname: ${request.nextUrl.hostname}`);

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Set country cookie for both server and client access
  response.cookies.set('country-code', country, {
    httpOnly: false, // Allow client-side access
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  });

  console.log(`🍪 MIDDLEWARE: Set country-code cookie to: ${country}`);

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
    
    // Extract project ID from Supabase URL dynamically
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const projectId = supabaseUrl.match(/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/)?.[1] || 'unknown'
    
    // Get the session from cookies using dynamic project ID
    const accessToken = request.cookies.get(`sb-${projectId}-auth-token`)
    console.log(`🍪 MIDDLEWARE: Access token exists: ${!!accessToken}`)
    
    const { data: { user }, error } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()
    
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

    // Check if accessing admin routes that require shorter sessions
    const isAdminRoute = request.nextUrl.pathname.startsWith('/dashboard/admin') || 
                        request.nextUrl.pathname.startsWith('/admin-dashboard') ||
                        request.nextUrl.pathname.startsWith('/dashboard/agent');
    
    if (isAdminRoute && session) {
      console.log(`🔐 MIDDLEWARE: Checking session age for admin route: ${request.nextUrl.pathname}`)
      
      // Check session age for admin routes
      // Use expires_at or fallback to current time if not available
      const sessionExpires = session.expires_at ? new Date(session.expires_at * 1000) : new Date();
      const now = new Date();
      // Calculate hours until expiration (session.expires_at is in seconds, not milliseconds)
      const sessionHours = session.expires_at 
        ? Math.max(0, (sessionExpires.getTime() - now.getTime()) / (1000 * 60 * 60))
        : 0;
      
      // Force re-login after 4 hours for admin/agent routes
      const maxAdminSessionHours = 4;
      
      console.log(`⏰ MIDDLEWARE: Session age: ${sessionHours.toFixed(2)} hours (max: ${maxAdminSessionHours})`)
      
      if (sessionHours > maxAdminSessionHours) {
        console.log(`🚨 MIDDLEWARE: Session too old for admin access (${sessionHours.toFixed(2)}h), forcing logout`)
        
        // Clear session and redirect to login with message
        await supabase.auth.signOut()
        
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/login'
        redirectUrl.searchParams.set('redirectedFrom', request.nextUrl.pathname)
        redirectUrl.searchParams.set('sessionExpired', 'admin')
        
        const response = NextResponse.redirect(redirectUrl)
        
        // Clear auth cookies using dynamic project ID
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const projectId = supabaseUrl.match(/https:\/\/([a-zA-Z0-9]+)\.supabase\.co/)?.[1] || 'unknown'
        response.cookies.delete(`sb-${projectId}-auth-token`)
        response.cookies.delete(`sb-${projectId}-auth-token-code-verifier`)
        
        return response
      }
      
      console.log(`✅ MIDDLEWARE: Admin session valid (${sessionHours.toFixed(2)}h old)`)
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
    // Protect *app* routes only. Exclude assets, api auth callbacks, and public files.
    "/((?!_next/|static/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|css|js)$|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|api/auth/).*)",
  ],
}