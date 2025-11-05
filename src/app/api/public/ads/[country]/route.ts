import { NextRequest, NextResponse } from 'next/server';
import { supabaseBackend } from '@/lib/supabase-backend';

// CORS headers for cross-origin requests from country-specific Home Hub sites
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow all origins for public API
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

/**
 * Public Ads API for Consumer Sites
 * GET /api/public/ads/[country] - Get ads for a specific country
 * 
 * Query parameters:
 * - placement: Ad placement slug (e.g., 'gy-home-hero', 'gy-search-sidebar')
 * - page_type: Type of page (home, search, property-detail, listings)
 * - property_type: Property type for targeting (residential, commercial, land, rental)
 * - price_range: Price range for targeting (min-max format, e.g., '100000-500000')
 * - city: City for geographic targeting
 * - limit: Number of ads to return (default: 1)
 */

interface AdResponse {
  id: string;
  campaign_id: string;
  creative_id: string;
  placement_id: string;
  
  // Ad content
  headline: string;
  description: string;
  call_to_action: string;
  destination_url: string;
  image_url: string | null;
  html_content: string | null;
  
  // Display specs
  width: number | null;
  height: number | null;
  creative_type: string;
  
  // Campaign info
  campaign_name: string;
  advertiser_company: string;
  
  // Tracking
  impression_url: string;
  click_url: string;
}

async function trackImpression(
  campaignId: string,
  creativeId: string,
  placementId: string,
  advertiserId: string,
  request: NextRequest
) {
  try {
    // Extract user info from request
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const referrer = request.headers.get('referer') || '';
    
    // Simple device detection
    const deviceType = userAgent.toLowerCase().includes('mobile') ? 'mobile' : 
                      userAgent.toLowerCase().includes('tablet') ? 'tablet' : 'desktop';
    
    // Extract browser info
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
                   userAgent.includes('Firefox') ? 'Firefox' :
                   userAgent.includes('Safari') ? 'Safari' :
                   'Other';
    
    // Get current page URL from search params
    const url = new URL(request.url);
    const pageUrl = url.searchParams.get('page_url') || referrer;
    const pageType = url.searchParams.get('page_type') || 'unknown';
    const propertyId = url.searchParams.get('property_id') || null;
    const searchQuery = url.searchParams.get('search_query') || null;

    // Record impression
    await supabaseBackend
      .from('ad_impressions')
      .insert({
        campaign_id: campaignId,
        creative_id: creativeId,
        placement_id: placementId,
        advertiser_id: advertiserId,
        ip_address: ip,
        user_agent: userAgent,
        country_code: url.pathname.split('/').pop()?.toUpperCase(), // Extract from URL
        device_type: deviceType,
        browser: browser,
        page_url: pageUrl,
        page_type: pageType,
        referrer_url: referrer,
        search_query: searchQuery,
        property_id: propertyId,
        was_clicked: false,
        cost_charged: 0 // Will be updated on click
      });
  } catch (error) {
    console.error('Error tracking impression:', error);
    // Don't fail ad serving if tracking fails
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { country: string } }
) {
  try {
    const countryCode = params.country.toUpperCase();
    const { searchParams } = new URL(request.url);
    
    // Extract targeting parameters
    const placementSlug = searchParams.get('placement');
    const pageType = searchParams.get('page_type');
    const propertyType = searchParams.get('property_type');
    const priceRange = searchParams.get('price_range');
    const city = searchParams.get('city');
    const limit = Math.min(parseInt(searchParams.get('limit') || '1'), 10); // Max 10 ads

    // First, get available placements for this country
    let placementQuery = supabaseBackend
      .from('ad_placements')
      .select('id, slug, name, page_type, position')
      .eq('country_code', countryCode)
      .eq('is_active', true);

    if (placementSlug) {
      placementQuery = placementQuery.eq('slug', placementSlug);
    }

    if (pageType) {
      placementQuery = placementQuery.or(`page_type.eq.${pageType},page_type.eq.all`);
    }

    const { data: placements, error: placementError } = await placementQuery;

    if (placementError) {
      console.error('Error fetching placements:', placementError);
      return NextResponse.json({ ads: [] });
    }

    if (!placements || placements.length === 0) {
      return NextResponse.json({ ads: [] });
    }

    // Get active campaigns targeting this country
    let campaignQuery = supabaseBackend
      .from('ad_campaigns')
      .select(`
        id, name, advertiser_id, campaign_type, target_cities, target_property_types,
        target_price_min, target_price_max, bid_amount,
        advertiser:advertisers!inner(id, company_name, status),
        creatives:ad_creatives!inner(*)
      `)
      .contains('target_countries', [countryCode])
      .eq('is_active', true)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .lte('start_date', new Date().toISOString());

    const { data: campaigns, error: campaignError } = await campaignQuery;

    if (campaignError) {
      console.error('Error fetching campaigns:', campaignError);
      return NextResponse.json({ ads: [] });
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ ads: [] });
    }

    // Filter campaigns based on targeting criteria
    let filteredCampaigns = campaigns.filter((campaign: any) => {
      // Check advertiser is active
      const advertiser = campaign.advertiser;
      if (advertiser.status !== 'active' && advertiser.status !== 'approved') {
        return false;
      }

      // Check city targeting
      if (city && campaign.target_cities?.length > 0 && !campaign.target_cities.includes(city)) {
        return false;
      }

      // Check property type targeting
      if (propertyType && campaign.target_property_types?.length > 0 && !campaign.target_property_types.includes(propertyType)) {
        return false;
      }

      // Check price range targeting
      if (priceRange && (campaign.target_price_min || campaign.target_price_max)) {
        const [minPrice, maxPrice] = priceRange.split('-').map(Number);
        if (campaign.target_price_min && maxPrice < campaign.target_price_min) return false;
        if (campaign.target_price_max && minPrice > campaign.target_price_max) return false;
      }

      return true;
    });

    // Sort by bid amount (highest first) and randomly shuffle within same bid amounts
    filteredCampaigns = filteredCampaigns.sort((a, b) => {
      const bidDiff = (b.bid_amount || 0) - (a.bid_amount || 0);
      if (bidDiff !== 0) return bidDiff;
      return Math.random() - 0.5; // Random shuffle for same bids
    });

    // Build ad responses
    const ads: AdResponse[] = [];
    let adCount = 0;

    for (const campaign of filteredCampaigns) {
      if (adCount >= limit) break;

      // Get active creatives for this campaign
      const activeCreatives = (campaign as any).creatives.filter((c: any) => c.status === 'active');
      if (activeCreatives.length === 0) continue;

      // Select creative (prefer primary, otherwise random)
      const creative = activeCreatives.find((c: any) => c.is_primary) || 
                      activeCreatives[Math.floor(Math.random() * activeCreatives.length)];

      // Select placement for this ad
      const placement = placements[Math.floor(Math.random() * placements.length)];

      // Generate tracking URLs
      const impressionUrl = `/api/public/ads/track/impression?campaign=${campaign.id}&creative=${creative.id}&placement=${placement.id}`;
      const clickUrl = `/api/public/ads/track/click?campaign=${campaign.id}&creative=${creative.id}&placement=${placement.id}&url=${encodeURIComponent(creative.destination_url)}`;

      const ad: AdResponse = {
        id: `${campaign.id}-${creative.id}`,
        campaign_id: campaign.id,
        creative_id: creative.id,
        placement_id: placement.id,
        
        // Content
        headline: creative.headline || '',
        description: creative.description || '',
        call_to_action: creative.call_to_action || 'Learn More',
        destination_url: creative.destination_url,
        image_url: creative.image_url,
        html_content: creative.html_content,
        
        // Display specs
        width: creative.width,
        height: creative.height,
        creative_type: creative.creative_type,
        
        // Campaign info
        campaign_name: campaign.name,
        advertiser_company: (campaign as any).advertiser?.company_name || '',
        
        // Tracking
        impression_url: impressionUrl,
        click_url: clickUrl
      };

      ads.push(ad);
      adCount++;

      // Track impression asynchronously
      trackImpression(
        campaign.id,
        creative.id,
        placement.id,
        campaign.advertiser_id,
        request
      );
    }

    return NextResponse.json({
      ads,
      country: countryCode,
      placement: placementSlug,
      total_available: ads.length
    }, {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Error in public ads API:', error);
    return NextResponse.json({ ads: [] }, {
      headers: corsHeaders
    });
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}