import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendViewingRequestEmails, SharedEmailParams } from '@/lib/email/viewing-requests';

// CORS headers for cross-origin requests
// Allow all origins to support multiple country domains (guyanahomehub.com, jamaicahomehub.com, etc.)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Simple in-memory rate limiting
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = 5; // 5 requests per hour
  const window = 60 * 60 * 1000; // 1 hour in milliseconds
  
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + window });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  console.log('=== VIEWING REQUEST API CALLED ===');
  try {
    // Rate limiting based on IP
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many requests. Please try again later.' 
        },
        { status: 429, headers: corsHeaders }
      );
    }

    // Use service role client to bypass RLS and access profile data
    const supabase = createServiceRoleClient();
    
    // Parse and extract request data
    const body = await request.json();
    const {
      propertyId,
      visitorName,
      visitorEmail,
      visitorPhone,
      visitorMessage
    } = body;

    // Validate required fields
    if (!propertyId || !visitorName || !visitorEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: propertyId, visitorName, visitorEmail' 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(visitorEmail)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format' 
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Fetch property with listing user details via JOIN
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        city,
        country_id,
        listed_by_type,
        user_id,
        status,
        profiles!properties_user_id_fkey (
          id,
          email,
          first_name,
          last_name,
          display_name,
          company,
          phone,
          approval_status
        )
      `)
      .eq('id', propertyId)
      .eq('status', 'active')
      .single();

    if (propertyError || !property) {
      console.error('Property fetch error:', propertyError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Property not found or not available' 
        },
        { status: 404, headers: corsHeaders }
      );
    }

    // Extract listing user information from joined profiles data
    const profile = property.profiles as any;
    if (!profile) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Property owner not found' 
        },
        { status: 404, headers: corsHeaders }
      );
    }

    const listingUserName = profile.display_name || 
                          `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 
                          'Property Owner';
    const listingUserEmail = profile.email;
    const listingUserCompany = profile.company || null;
    const listingUserPhone = profile.phone || '';

    // Insert complete viewing request record with ALL fields
    const { data: viewingRequest, error: insertError } = await supabase
      .from('viewing_requests')
      .insert({
        property_id: propertyId,
        property_title: property.title,
        property_location: property.city,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        visitor_phone: visitorPhone || null,
        visitor_message: visitorMessage || null,
        listing_user_id: property.user_id,
        listing_user_email: listingUserEmail,
        listing_user_name: listingUserName,
        listing_user_company: listingUserCompany,
        listing_user_phone: listingUserPhone,
        listed_by_type: property.listed_by_type,
        country_id: property.country_id,
        status: 'new',
        lead_source: 'website',
        lead_quality_score: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        agent_notified_at: null,
        visitor_notified_at: null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to save viewing request' 
        },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('Viewing request created with ID:', viewingRequest.id);

    // Send emails - initialize with proper typing
    let emailResults: {
      visitorConfirmation: { success: boolean; error?: string };
      agentNotification: { success: boolean; error?: string };
    } = {
      visitorConfirmation: { success: false, error: 'Not attempted' },
      agentNotification: { success: false, error: 'Not attempted' }
    };

    try {
      const emailParams: SharedEmailParams = {
        // Visitor info
        visitorName,
        visitorEmail,
        visitorPhone: visitorPhone || '',
        visitorMessage: visitorMessage || 'No additional message provided',
        
        // Property info
        propertyId,
        propertyTitle: property.title,
        propertyLocation: property.city,
        
        // Listing user info (agent/owner)
        listingUserId: property.user_id,
        listingUserName,
        listingUserEmail,
        listingUserPhone,
        listingUserCompany,
        listedByType: property.listed_by_type || 'owner',
        
        // Meta
        countryId: property.country_id
      };

      emailResults = await sendViewingRequestEmails(emailParams);

      // Update notification timestamps based on email success
      const timestampUpdates: any = {
        updated_at: new Date().toISOString()
      };

      if (emailResults.visitorConfirmation.success) {
        timestampUpdates.visitor_notified_at = new Date().toISOString();
        console.log('Visitor confirmation email sent successfully');
      } else {
        console.error('Visitor confirmation email failed:', emailResults.visitorConfirmation.error);
      }

      if (emailResults.agentNotification.success) {
        timestampUpdates.agent_notified_at = new Date().toISOString();
        console.log('Agent notification email sent successfully');
      } else {
        console.error('Agent notification email failed:', emailResults.agentNotification.error);
      }

      // Update the viewing request with notification timestamps
      await supabase
        .from('viewing_requests')
        .update(timestampUpdates)
        .eq('id', viewingRequest.id);

    } catch (emailError) {
      console.error('Email service error:', emailError);
      // Don't fail the request - the lead is captured, emails can be retried
    }

    // Return success response
    return NextResponse.json({
      success: true,
      requestId: viewingRequest.id,
      message: 'Viewing request submitted successfully',
      emailStatus: {
        visitorNotified: emailResults.visitorConfirmation.success,
        agentNotified: emailResults.agentNotification.success
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500, headers: corsHeaders }
    );
  }
}