import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

const supabaseBackend = createServiceRoleClient();

/**
 * Ad Click Tracking API
 * GET /api/public/ads/track/click - Track ad clicks and redirect to destination
 * 
 * Query parameters:
 * - campaign: Campaign ID
 * - creative: Creative ID
 * - placement: Placement ID
 * - url: Destination URL to redirect to
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaign');
    const creativeId = searchParams.get('creative');
    const placementId = searchParams.get('placement');
    const destinationUrl = searchParams.get('url');

    if (!campaignId || !creativeId || !placementId || !destinationUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get campaign details for pricing
    const { data: campaign, error: campaignError } = await supabaseBackend
      .from('ad_campaigns')
      .select('id, advertiser_id, bid_amount, billing_model')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Error fetching campaign for click tracking:', campaignError);
      // Still redirect even if tracking fails
      return NextResponse.redirect(destinationUrl);
    }

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

    // Calculate cost based on billing model
    let costCharged = 0;
    if (campaign.billing_model === 'cpc') {
      costCharged = campaign.bid_amount || 0;
    }

    // Record click impression
    const { error: impressionError } = await supabaseBackend
      .from('ad_impressions')
      .insert({
        campaign_id: campaignId,
        creative_id: creativeId,
        placement_id: placementId,
        advertiser_id: campaign.advertiser_id,
        ip_address: ip,
        user_agent: userAgent,
        device_type: deviceType,
        browser: browser,
        page_url: referrer,
        referrer_url: referrer,
        was_clicked: true,
        click_timestamp: new Date().toISOString(),
        cost_charged: costCharged
      });

    if (impressionError) {
      console.error('Error recording click:', impressionError);
    }

    // Also update any existing impression record if it exists
    try {
      await supabaseBackend
        .from('ad_impressions')
        .update({
          was_clicked: true,
          click_timestamp: new Date().toISOString(),
          cost_charged: costCharged
        })
        .eq('campaign_id', campaignId)
        .eq('creative_id', creativeId)
        .eq('placement_id', placementId)
        .eq('ip_address', ip)
        .eq('was_clicked', false)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour
    } catch (updateError) {
      console.error('Error updating impression click:', updateError);
    }

    // Redirect to destination URL
    return NextResponse.redirect(destinationUrl);

  } catch (error) {
    console.error('Error in click tracking API:', error);
    // If there's an error, still try to redirect to the destination
    const { searchParams } = new URL(request.url);
    const destinationUrl = searchParams.get('url');
    if (destinationUrl) {
      return NextResponse.redirect(destinationUrl);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}