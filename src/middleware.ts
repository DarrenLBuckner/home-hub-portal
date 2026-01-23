// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Country code mapping from domain keywords
// Add new countries here as they launch
const COUNTRY_DOMAIN_MAP: Record<string, string> = {
  // Caribbean (7 countries)
  'guyana': 'GY',
  'jamaica': 'JM',
  'trinidad': 'TT',
  'barbados': 'BB',
  'bahamas': 'BS',
  'dominican': 'DO',
  'haiti': 'HT',
  'belize': 'BZ',

  // Latin America (15 countries)
  'argentina': 'AR',
  'bolivia': 'BO',
  'brasil': 'BR',
  'brazil': 'BR',  // Alternative spelling
  'chile': 'CL',
  'colombia': 'CO',
  'costarica': 'CR',
  'ecuador': 'EC',
  'elsalvador': 'SV',
  'guatemala': 'GT',
  'honduras': 'HN',
  'mexico': 'MX',
  'nicaragua': 'NI',
  'panama': 'PA',
  'paraguay': 'PY',
  'peru': 'PE',
  'uruguay': 'UY',

  // Africa (16 countries)
  'botswana': 'BW',
  'ivorycoast': 'CI',
  'cotedivoire': 'CI',  // Alternative spelling
  'egypt': 'EG',
  'ethiopia': 'ET',
  'ghana': 'GH',
  'kenya': 'KE',
  'morocco': 'MA',
  'namibia': 'NA',
  'nigeria': 'NG',
  'rwanda': 'RW',
  'senegal': 'SN',
  'southafrica': 'ZA',
  'tanzania': 'TZ',
  'uganda': 'UG',
  'zambia': 'ZM',
  'zimbabwe': 'ZW',

  // Asia (4 countries)
  'cambodia': 'KH',
  'philippines': 'PH',
  'thailand': 'TH',
  'vietnam': 'VN',
};

// Territory data interface
interface TerritoryData {
  country_code: string;
  display_name: string;
  default_language: string;
  supported_languages: string[];
  currency: string;
  status: 'active' | 'pending' | 'suspended' | 'terminated';
}

// In-memory cache for territory data
interface CachedTerritory {
  data: TerritoryData;
  expiry: number;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const territoryCache = new Map<string, CachedTerritory>();

// Default territory data for fallback (when database is unavailable)
const DEFAULT_TERRITORIES: Record<string, TerritoryData> = {
  GY: {
    country_code: 'GY',
    display_name: 'Guyana HomeHub',
    default_language: 'en',
    supported_languages: ['en'],
    currency: 'GYD',
    status: 'active',
  },
  JM: {
    country_code: 'JM',
    display_name: 'Jamaica HomeHub',
    default_language: 'en',
    supported_languages: ['en'],
    currency: 'JMD',
    status: 'pending',
  },
  CO: {
    country_code: 'CO',
    display_name: 'Colombia HomeHub',
    default_language: 'es',
    supported_languages: ['es', 'en'],
    currency: 'COP',
    status: 'pending',
  },
};

/**
 * Detects country code from hostname
 * Supports all 42 HomeHub countries
 *
 * @param hostname - The request hostname (e.g., 'guyanahomehub.com')
 * @returns ISO 3166-1 alpha-2 country code
 */
function getCountryFromHost(hostname: string): string {
  const lowerHost = hostname.toLowerCase();

  for (const [keyword, code] of Object.entries(COUNTRY_DOMAIN_MAP)) {
    if (lowerHost.includes(keyword)) {
      return code;
    }
  }

  // Default to Guyana for unrecognized domains
  // This ensures portal-home-hub.com and localhost work
  return 'GY';
}

// Site type detection helper
function getSiteTypeFromHost(hostname: string): 'portal' | 'public' {
  if (hostname.includes('portal')) {
    return 'portal';
  }
  return 'public'; // Default to public site
}

/**
 * Fetches territory data from the database with caching
 * Falls back to default data if database is unavailable
 */
async function getTerritoryData(
  countryCode: string,
  supabaseUrl: string,
  supabaseAnonKey: string
): Promise<TerritoryData> {
  // Check cache first
  const cached = territoryCache.get(countryCode);
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  try {
    // Fetch from database using fetch API (Edge compatible)
    const response = await fetch(
      `${supabaseUrl}/rest/v1/territories?country_code=eq.${countryCode}&select=country_code,display_name,default_language,supported_languages,currency,status`,
      {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      if (data && data.length > 0) {
        const territory = data[0] as TerritoryData;

        // Cache the result
        territoryCache.set(countryCode, {
          data: territory,
          expiry: Date.now() + CACHE_TTL,
        });

        return territory;
      }
    }
  } catch (error) {
    console.error(`Failed to fetch territory data for ${countryCode}:`, error);
  }

  // Fall back to default data
  return DEFAULT_TERRITORIES[countryCode] || DEFAULT_TERRITORIES.GY;
}

export async function middleware(request: NextRequest) {
  // Handle OPTIONS preflight requests FIRST, before any other logic
  if (request.method === 'OPTIONS') {
    console.log(`🔀 MIDDLEWARE: Handling OPTIONS preflight for: ${request.nextUrl.pathname}`);
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-site-id',
        'Access-Control-Max-Age': '86400', // 24 hours
      },
    });
  }

  // Detect country and site type from hostname
  const country = getCountryFromHost(request.nextUrl.hostname);
  const siteType = getSiteTypeFromHost(request.nextUrl.hostname);
  console.log(`🌍 MIDDLEWARE: Detected country: ${country}, site: ${siteType} from hostname: ${request.nextUrl.hostname}`);

  // Fetch territory data from database (with caching)
  const territory = await getTerritoryData(
    country,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  console.log(`📍 MIDDLEWARE: Territory status: ${territory.status}, language: ${territory.default_language}`);

  // Handle territory status - redirect to appropriate pages
  const pathname = request.nextUrl.pathname;

  // Skip status checks for special pages and API routes
  const skipStatusCheck = pathname.startsWith('/api') ||
                          pathname.startsWith('/maintenance') ||
                          pathname.startsWith('/coming-soon') ||
                          pathname.startsWith('/_next') ||
                          pathname.startsWith('/favicon');

  if (!skipStatusCheck) {
    if (territory.status === 'suspended' || territory.status === 'terminated') {
      console.log(`🚨 MIDDLEWARE: Territory ${country} is ${territory.status}, redirecting to maintenance`);
      const maintenanceUrl = new URL('/maintenance', request.url);
      return NextResponse.rewrite(maintenanceUrl);
    }

    // Note: 'pending' territories can still be accessed for testing
    // Uncomment the following to show coming soon page for pending territories:
    // if (territory.status === 'pending') {
    //   console.log(`⏳ MIDDLEWARE: Territory ${country} is pending, showing coming soon`);
    //   const comingSoonUrl = new URL('/coming-soon', request.url);
    //   return NextResponse.rewrite(comingSoonUrl);
    // }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Set country and site type cookies for both server and client access
  response.cookies.set('country-code', country, {
    httpOnly: false, // Allow client-side access
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  });

  response.cookies.set('site-type', siteType, {
    httpOnly: false, // Allow client-side access
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  });

  // Set territory data cookies for client-side access
  response.cookies.set('territory-language', territory.default_language, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  });

  response.cookies.set('territory-currency', territory.currency, {
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  });

  // Set headers for server-side access (downstream middleware/pages)
  response.headers.set('x-country-code', country);
  response.headers.set('x-country-name', territory.display_name);
  response.headers.set('x-default-language', territory.default_language);
  response.headers.set('x-currency', territory.currency);
  response.headers.set('x-territory-status', territory.status);

  console.log(`🍪 MIDDLEWARE: Set country-code cookie to: ${country}, site-type: ${siteType}, language: ${territory.default_language}`);

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
    '/dashboard/:path*',
    '/admin-dashboard/:path*',
    '/contact/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}