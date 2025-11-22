import { NextRequest, NextResponse } from 'next/server';
import { supabaseBackend } from '@/lib/supabase-backend';

/**
 * Public API endpoint for service inquiries
 * Used by all Home Hub frontend sites to submit service requests
 * 
 * POST /api/public/services/inquiries - Submit a service inquiry
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      countryCode,
      inquiryType, // 'service' or 'package'
      serviceId,
      packageId,
      firstName,
      lastName,
      email,
      phone,
      propertyAddress,
      propertyType,
      propertySize,
      preferredDate,
      preferredTime,
      specialRequests,
      budgetRange,
      source = 'website',
      utmSource,
      utmCampaign
    } = body;

    // Validation
    if (!countryCode || !inquiryType || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: countryCode, inquiryType, firstName, lastName, email' },
        { status: 400 }
      );
    }

    if (inquiryType === 'service' && !serviceId) {
      return NextResponse.json(
        { error: 'serviceId is required for service inquiries' },
        { status: 400 }
      );
    }

    if (inquiryType === 'package' && !packageId) {
      return NextResponse.json(
        { error: 'packageId is required for package inquiries' },
        { status: 400 }
      );
    }

    // Validate country code
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return NextResponse.json(
        { error: 'Invalid country code. Must be 2 letter country code (e.g., GY, JM, BB)' },
        { status: 400 }
      );
    }

    // Insert inquiry
    const { data, error } = await supabaseBackend
      .from('service_inquiries')
      .insert({
        country_code: countryCode,
        inquiry_type: inquiryType,
        service_id: serviceId || null,
        package_id: packageId || null,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        property_address: propertyAddress,
        property_type: propertyType,
        property_size: propertySize,
        preferred_date: preferredDate,
        preferred_time: preferredTime,
        special_requests: specialRequests,
        budget_range: budgetRange,
        source,
        utm_source: utmSource,
        utm_campaign: utmCampaign,
        status: 'new'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating service inquiry:', error);
      return NextResponse.json(
        { error: 'Failed to submit inquiry' },
        { status: 500 }
      );
    }

    // TODO: Send notification email to admin/staff
    // TODO: Send confirmation email to customer
    
    return NextResponse.json({
      success: true,
      inquiryId: data.id,
      message: 'Your service inquiry has been submitted successfully. We will contact you within 24 hours.',
      data: {
        id: data.id,
        status: data.status,
        createdAt: data.created_at
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}