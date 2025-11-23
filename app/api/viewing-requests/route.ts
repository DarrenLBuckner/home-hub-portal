import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://guyanahomehub.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
        { success: false, message: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 1. Get property and owner details via JOIN
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        city,
        country_id,
        listed_by_type,
        user_id,
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
      .single();

    if (propertyError || !property) {
      console.error('Property fetch error:', propertyError);
      return NextResponse.json(
        { success: false, message: 'Property not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 2. Extract owner/agent information from the joined profiles data
    const owner = property.profiles as any;
    if (!owner) {
      return NextResponse.json(
        { success: false, message: 'Property owner not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    const ownerName = owner.display_name || `${owner.first_name || ''} ${owner.last_name || ''}`.trim();
    const ownerEmail = owner.email;
    const ownerCompany = owner.company || '';
    const ownerPhone = owner.phone || '';

    // 3. Store viewing request in database
    const { data: viewingRequest, error: dbError } = await supabase
      .from('viewing_requests')
      .insert({
        property_id: propertyId,
        property_title: property.title,
        property_location: property.city,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        visitor_phone: visitorPhone || null,
        visitor_message: visitorMessage,
        listing_user_id: property.user_id,
        listing_user_email: ownerEmail,
        listing_user_name: ownerName,
        listing_user_company: ownerCompany,
        listing_user_phone: ownerPhone,
        listed_by_type: property.listed_by_type,
        country_id: property.country_id,
        status: 'new'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      return NextResponse.json(
        { success: false, message: 'Failed to save viewing request' },
        { status: 500, headers: corsHeaders }
      );
    }

    // 4. Determine email content based on listing type
    const isAgent = property.listed_by_type === 'agent';
    const agentEmailSubject = isAgent
      ? `New Viewing Request: ${property.title}`
      : `Someone wants to view your property: ${property.title}`;

    const agentEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">${isAgent ? 'You have a new viewing request!' : 'Someone is interested in your property!'}</h2>
        <p><strong>Property:</strong> ${property.title}</p>
        <p><strong>Location:</strong> ${property.city}</p>

        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Contact Information:</h3>
          <ul style="list-style: none; padding: 0;">
            <li style="margin: 10px 0;"><strong>Name:</strong> ${visitorName}</li>
            <li style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${visitorEmail}">${visitorEmail}</a></li>
            ${visitorPhone ? `<li style="margin: 10px 0;"><strong>Phone:</strong> ${visitorPhone}</li>` : ''}
          </ul>
        </div>

        ${visitorMessage ? `
          <div style="margin: 20px 0;">
            <p><strong>Message:</strong></p>
            <p style="background-color: #f9fafb; padding: 15px; border-left: 4px solid #2563eb; border-radius: 4px;">${visitorMessage}</p>
          </div>
        ` : ''}

        <p style="color: #059669; font-weight: bold;">⚡ Please reach out to this potential ${isAgent ? 'client' : 'buyer/renter'} as soon as possible!</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="font-size: 14px; color: #6b7280;">
            <a href="https://portal-home-hub.com/dashboard/leads" style="color: #2563eb; text-decoration: none;">View all your leads in Portal Home Hub →</a>
          </p>
        </div>
      </div>
    `;

    // 5. Send email to property owner/agent
    try {
      await resend.emails.send({
        from: 'Guyana Home Hub Leads <leads@portalhomehub.com>',
        to: ownerEmail,
        subject: agentEmailSubject,
        html: agentEmailBody
      });

      // Update notification timestamp
      await supabase
        .from('viewing_requests')
        .update({ agent_notified_at: new Date().toISOString() })
        .eq('id', viewingRequest.id);
    } catch (emailError) {
      console.error('Failed to send agent email:', emailError);
      // Don't fail the request if email fails
    }

    // 6. Send confirmation email to visitor
    try {
      await resend.emails.send({
        from: 'Guyana Home Hub <leads@portalhomehub.com>',
        to: visitorEmail,
        subject: `Viewing Request Received - ${property.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Thank you for your viewing request!</h2>
            <p>Your request for <strong>${property.title}</strong> has been sent to ${ownerName}.</p>

            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Property Details:</strong></p>
              <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0;"><strong>Title:</strong> ${property.title}</li>
                <li style="margin: 10px 0;"><strong>Location:</strong> ${property.city}</li>
              </ul>
            </div>

            <p>They will contact you shortly at:</p>
            <ul style="list-style: none; padding: 0;">
              <li style="margin: 10px 0;">📧 Email: ${visitorEmail}</li>
              ${visitorPhone ? `<li style="margin: 10px 0;">📱 Phone: ${visitorPhone}</li>` : ''}
            </ul>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you don't hear back within 24 hours, please contact us at
              <a href="mailto:support@guyanahomehub.com" style="color: #2563eb;">support@guyanahomehub.com</a>
            </p>
          </div>
        `
      });

      // Update visitor notification timestamp
      await supabase
        .from('viewing_requests')
        .update({ visitor_notified_at: new Date().toISOString() })
        .eq('id', viewingRequest.id);
    } catch (emailError) {
      console.error('Failed to send visitor email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Viewing request submitted successfully',
      requestId: viewingRequest.id
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Viewing request error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to submit viewing request'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}