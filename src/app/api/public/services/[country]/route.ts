import { NextRequest, NextResponse } from 'next/server';
import { supabaseBackend } from '@/lib/supabase-backend';

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
 * Public API endpoint for country-specific services
 * Used by all Home Hub frontend sites (Guyana, Jamaica, Barbados, etc.)
 * 
 * GET /api/public/services/GY - Get all services for Guyana
 * GET /api/public/services/JM - Get all services for Jamaica
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
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}