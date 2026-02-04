import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Get site_id from headers (sent by Guyana proxy)
    const siteId = request.headers.get('x-site-id') || 'guyana'

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid property ID format' },
        { status: 400 }
      );
    }

    // Step 1: Fetch the property (single row) - NO JOINS to avoid .single() issues
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        *,
        profiles!properties_user_id_fkey (
          id,
          first_name,
          last_name,
          phone,
          user_type,
          profile_image,
          company,
          is_founding_member,
          is_founding_advisor,
          is_verified_agent
        )
      `)
      .eq('id', id)
      .eq('site_id', siteId)
      .or(
        // Sale properties: show active, under_contract, sold
        `and(listing_type.eq.sale,status.in.(active,under_contract,sold)),` +
        // Rental properties: show active only (rented properties hidden)
        `and(listing_type.eq.rent,status.eq.active),` +
        // Lease properties: show active, under_contract
        `and(listing_type.eq.lease,status.in.(active,under_contract)),` +
        // Short-term rent: show active only
        `and(listing_type.eq.short_term_rent,status.eq.active)`
      )
      .single()

    if (propertyError) {
      console.error('Property fetch error:', propertyError);
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Step 2: Fetch property images separately (multiple rows)
    const { data: media, error: mediaError } = await supabase
      .from('property_media')
      .select('media_url, media_type, display_order, is_primary')
      .eq('property_id', id)
      .order('display_order', { ascending: true })

    if (mediaError) {
      console.error('Media fetch error:', mediaError);
      // Don't fail the entire request if media fetch fails
      // Return property with empty images array
    }

    // Step 3: Transform and combine data
    // Prefer images from the property.images column if present
    const images =
      Array.isArray(property.images) && property.images.length > 0
        ? property.images
        : (media
            ?.filter((m: any) => m.media_type === 'image')
            ?.sort((a: any, b: any) => {
              if (a.is_primary && !b.is_primary) return -1
              if (!a.is_primary && b.is_primary) return 1
              return a.display_order - b.display_order
            })
            ?.map((m: any) => m.media_url) || []);

    // Extract agent profile data if user is an agent OR admin
    const canShowProfile = property.profiles?.user_type === 'agent' || property.profiles?.user_type === 'admin'
    const agentProfile = canShowProfile ? {
      id: property.profiles.id,
      first_name: property.profiles.first_name,
      last_name: property.profiles.last_name,
      phone: property.profiles.phone,
      profile_image: property.profiles.profile_image,
      company: property.profiles.company,
      user_type: property.profiles.user_type,
      is_founding_member: property.profiles.is_founding_member,
      is_founding_advisor: property.profiles.is_founding_advisor,
      is_verified_agent: property.profiles.is_verified_agent
    } : null

    // Step 4: Detect private listing (FSBO/Landlord)
    const isPrivateListing = (
      property.listing_source === 'fsbo' ||
      property.listing_source === 'landlord' ||
      property.listed_by_type === 'owner' ||
      property.listed_by_type === 'fsbo' ||
      property.profiles?.user_type === 'fsbo' ||
      property.profiles?.user_type === 'landlord'
    );

    // Weekly rotation agent selection
    async function getPromotedAgent(supabase, propertyId, siteId) {
      const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      const seed = hashCode(propertyId + String(weekNumber));
      const { data: premiumAgents } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company, phone, profile_image, is_verified_agent')
        .eq('country_id', property.country_id || 'GY')
        .eq('is_premium_agent', true)
        .eq('user_type', 'agent');
      if (!premiumAgents || premiumAgents.length === 0) return null;
      const index = Math.abs(seed) % premiumAgents.length;
      return premiumAgents[index];
    }

    function hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    // Owner contact extraction
    const ownerContact = isPrivateListing ? {
      name: property.owner_name || property.contact_name || 'Property Owner',
      phone: property.owner_whatsapp || property.owner_phone || null
    } : null;

    // Promoted agent selection
    let promotedAgent = null;
    if (isPrivateListing) {
      promotedAgent = await getPromotedAgent(supabase, property.id, property.site_id);
    }

    // Step 5: Create final response
    const result = {
      ...property,
      property_media: media || [],
      images,
      image_count: images.length,
      agent_profile: agentProfile,
      promoted_agent: isPrivateListing ? promotedAgent : null,
      owner_contact: ownerContact,
      is_private_listing: isPrivateListing,
      profiles: undefined, // Remove nested profiles object
    };

    return NextResponse.json(result, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  } catch (error) {
    console.error('Error in property API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        }
      }
    )
  }
}