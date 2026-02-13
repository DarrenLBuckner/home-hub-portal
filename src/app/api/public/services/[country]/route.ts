import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const supabaseBackend = createServiceRoleClient();

// CORS headers for cross-origin requests from country-specific Home Hub sites
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for public API
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Business directory categories
const DIRECTORY_CATEGORIES = [
  { id: 'real-estate-agents', name: 'Real Estate Agents' },
  { id: 'general-contractors', name: 'General Contractors' },
  { id: 'renovations', name: 'Renovations & Repairs' },
  { id: 'electrical', name: 'Electrical & Plumbing' },
  { id: 'interior', name: 'Interior & Furniture' },
  { id: 'landscaping', name: 'Landscaping & Garden' },
  { id: 'building-materials', name: 'Building Materials & Hardware' },
  { id: 'moving-storage', name: 'Moving & Storage' },
  { id: 'cleaning', name: 'Cleaning Services' },
  { id: 'security', name: 'Security & Safety' },
  { id: 'legal-financial', name: 'Legal & Financial' },
  { id: 'insurance', name: 'Insurance & Banking' },
  { id: 'inspection', name: 'Inspection Services' },
];

// Business directory response interface
interface DirectoryBusiness {
  id: string;
  name: string;
  category: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  image: string | null;
  adType: string;
  featured: boolean;
  verified: boolean;
}

interface DirectoryCategory {
  id: string;
  name: string;
  count: number;
}

// Type definitions
interface Service {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  icon: string;
  category: string;
}

interface CountryService {
  service: Service;
  local_price: number;
  local_description?: string;
  currency_code: string;
  local_currency: string;
  contact_email: string;
  contact_phone: string;
  booking_url?: string;
  featured_image?: string;
  gallery_images?: string[];
  additional_info?: any;
}

interface PackageService {
  service: Service;
  quantity: number;
  notes?: string;
}

interface ServicePackage {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  icon: string;
  total_price: number;
  currency: string;
  savings_amount?: number;
  is_featured: boolean;
  package_type: string;
  duration_days?: number;
  includes?: string[];
  excludes?: string[];
  terms_conditions?: string;
  package_services?: PackageService[];
}

/**
 * Handle business directory requests
 * Returns businesses and category counts for the directory page
 */
async function handleDirectoryRequest(
  supabase: typeof supabaseBackend,
  countryCode: string,
  categoryFilter: string | null
) {
  try {
    // Build query for businesses
    let query = supabase
      .from('businesses')
      .select('*')
      .eq('site_id', countryCode)
      .eq('status', 'active');

    // Filter by category if provided and not 'all'
    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category', categoryFilter);
    }

    const { data: businessesData, error: businessesError } = await query;

    if (businessesError) {
      console.error('Error fetching businesses:', businessesError);
      return NextResponse.json(
        { error: 'Failed to fetch businesses' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get all businesses for category counts (unfiltered by category)
    const { data: allBusinesses, error: countError } = await supabase
      .from('businesses')
      .select('category')
      .eq('site_id', countryCode)
      .eq('status', 'active');

    if (countError) {
      console.error('Error fetching category counts:', countError);
    }

    // Calculate category counts
    const categoryCounts: Record<string, number> = {};
    if (allBusinesses) {
      for (const business of allBusinesses) {
        const cat = business.category;
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }

    // Build categories array with counts
    const categories: DirectoryCategory[] = DIRECTORY_CATEGORIES.map(cat => ({
      id: cat.id,
      name: cat.name,
      count: categoryCounts[cat.id] || 0,
    }));

    // Format businesses for response
    const businesses: DirectoryBusiness[] = (businessesData || []).map((b: {
      id: string;
      business_name?: string;
      name?: string;
      category: string;
      description: string | null;
      phone: string | null;
      email: string | null;
      website: string | null;
      address: string | null;
      image_url?: string | null;
      image?: string | null;
      ad_type?: string;
      featured?: boolean;
      verified?: boolean;
    }) => ({
      id: b.id,
      name: b.business_name || b.name || '',
      category: b.category,
      description: b.description,
      phone: b.phone,
      email: b.email,
      website: b.website,
      address: b.address,
      image: b.image_url || b.image || null,
      adType: b.ad_type || 'listing',
      featured: b.featured || false,
      verified: b.verified || false,
    }));

    return NextResponse.json(
      {
        businesses,
        categories,
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Directory request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

/**
 * Public API endpoint for country-specific services
 * Used by all Home Hub frontend sites (Guyana, Jamaica, Barbados, etc.)
 *
 * GET /api/public/services/GY - Get all services for Guyana
 * GET /api/public/services/JM - Get all services for Jamaica
 * GET /api/public/services/GY?type=directory - Get business directory for Guyana
 * etc.
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> }
) {
  try {
    const supabase = supabaseBackend;
    const resolvedParams = await params;
    const countryCode = resolvedParams.country.toUpperCase();

    // Validate country code
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return NextResponse.json(
        { error: 'Invalid country code. Must be 2 letter country code (e.g., GY, JM, BB)' },
        { status: 400 }
      );
    }

    // Check for directory type query parameter
    const url = new URL(request.url);
    const type = url.searchParams.get('type');
    const category = url.searchParams.get('category');

    // Handle business directory requests
    if (type === 'directory') {
      return handleDirectoryRequest(supabase, countryCode, category);
    }

    // Get country services with service details
    const { data: services, error: servicesError } = await supabase
      .from('country_services')
      .select(`
        *,
        service:services (
          id,
          name,
          slug,
          description,
          short_description,
          icon,
          category,
          sort_order
        )
      `)
      .eq('country_code', countryCode)
      .eq('is_available', true)
      .eq('service.is_active', true);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json(
        { error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    // Get country packages with included services
    const { data: packages, error: packagesError } = await supabase
      .from('service_packages')
      .select(`
        *,
        package_services (
          quantity,
          notes,
          service:services (
            id,
            name,
            slug,
            icon
          )
        )
      `)
      .eq('country_code', countryCode)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      );
    }

    // Format response data
    const formattedServices = services?.map((countryService: CountryService) => ({
      id: countryService.service.id,
      name: countryService.service.name,
      slug: countryService.service.slug,
      description: countryService.local_description || countryService.service.description,
      shortDescription: countryService.service.short_description,
      icon: countryService.service.icon,
      category: countryService.service.category,
      price: countryService.local_price,
      currency: countryService.local_currency,
      contactEmail: countryService.contact_email,
      contactPhone: countryService.contact_phone,
      bookingUrl: countryService.booking_url,
      featuredImage: countryService.featured_image,
      galleryImages: countryService.gallery_images || [],
      additionalInfo: countryService.additional_info || {}
    })) || [];

    const formattedPackages = packages?.map((pkg: ServicePackage) => ({
      id: pkg.id,
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description,
      shortDescription: pkg.short_description,
      price: pkg.total_price,
      currency: pkg.currency,
      savings: pkg.savings_amount,
      isFeatured: pkg.is_featured,
      packageType: pkg.package_type,
      durationDays: pkg.duration_days,
      includes: pkg.includes || [],
      excludes: pkg.excludes || [],
      termsConditions: pkg.terms_conditions,
      includedServices: pkg.package_services?.map((ps: PackageService) => ({
        id: ps.service.id,
        name: ps.service.name,
        slug: ps.service.slug,
        icon: ps.service.icon,
        quantity: ps.quantity,
        notes: ps.notes
      })) || []
    })) || [];

    // Group services by category for easier consumption
    const servicesByCategory = formattedServices.reduce((acc: Record<string, typeof formattedServices>, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {} as Record<string, typeof formattedServices>);

    return NextResponse.json({
      countryCode,
      countryName: services?.[0]?.country_name || '',
      services: formattedServices,
      servicesByCategory,
      packages: formattedPackages,
      featuredPackage: formattedPackages.find(pkg => pkg.isFeatured) || null,
      lastUpdated: new Date().toISOString()
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: corsHeaders
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Origin, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}