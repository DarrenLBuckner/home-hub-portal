import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/featuring/purchase - Purchase featuring for a property
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireAuth(request)
    const userId = auth.userId
    
    const body = await request.json()
    const { 
      property_id, 
      feature_type, 
      duration_days, 
      payment_method = 'stripe', // 'stripe' or 'credits' 
      site_id,
      currency = 'USD'
    } = body
    
    // Validate required fields
    if (!property_id || !feature_type || !duration_days) {
      return NextResponse.json(
        { error: 'Missing required fields: property_id, feature_type, duration_days' },
        { status: 400 }
      )
    }
    
    // Verify user owns the property
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, user_id, title, site_id, listing_source')
      .eq('id', property_id)
      .eq('user_id', userId)
      .single()
    
    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found or access denied' },
        { status: 404 }
      )
    }
    
    const finalSiteId = site_id || property.site_id || 'portal'
    
    // Get pricing for this feature type and duration
    const { data: pricing, error: pricingError } = await supabase
      .from('featuring_prices')
      .select('*')
      .eq('feature_type', feature_type)
      .eq('duration_days', duration_days)
      .eq('site_id', finalSiteId)
      .eq('is_active', true)
      .single()
    
    if (pricingError || !pricing) {
      return NextResponse.json(
        { error: 'Pricing not found for this feature type and duration' },
        { status: 404 }
      )
    }
    
    // Check for existing active featuring
    const { data: existingFeaturing } = await supabase
      .from('featured_listings')
      .select('*')
      .eq('property_id', property_id)
      .eq('status', 'active')
      .gt('end_date', new Date().toISOString())
      .single()
    
    if (existingFeaturing) {
      return NextResponse.json(
        { error: 'Property already has active featuring' },
        { status: 409 }
      )
    }
    
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + (duration_days * 24 * 60 * 60 * 1000))
    const amount = currency === 'GYD' ? pricing.price_gyd : pricing.price_usd
    
    // Handle payment method
    if (payment_method === 'credits') {
      // Check if user has credits (for agents)
      const { data: credits, error: creditsError } = await supabase
        .from('agent_feature_credits')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (creditsError || !credits) {
        return NextResponse.json(
          { error: 'No feature credits found for this user' },
          { status: 404 }
        )
      }
      
      // Check if user has enough credits
      const requiredCredits = feature_type === 'basic' ? 1 : 
                             feature_type === 'premium' ? 1 : 1 // Each feature type costs 1 credit of its type
      
      const availableCredits = feature_type === 'basic' ? credits.credits_balance :
                              feature_type === 'premium' ? credits.premium_credits :
                              credits.platinum_credits
      
      if (availableCredits < requiredCredits) {
        return NextResponse.json(
          { error: `Insufficient ${feature_type} credits. Available: ${availableCredits}, Required: ${requiredCredits}` },
          { status: 402 }
        )
      }
      
      // Deduct credits and create featuring
      const updateField = feature_type === 'basic' ? 'credits_balance' :
                         feature_type === 'premium' ? 'premium_credits' :
                         'platinum_credits'
      
      const usedField = feature_type === 'basic' ? 'credits_used_this_month' :
                       feature_type === 'premium' ? 'premium_used_this_month' :
                       'platinum_used_this_month'
      
      const { error: updateCreditsError } = await supabase
        .from('agent_feature_credits')
        .update({
          [updateField]: availableCredits - requiredCredits,
          [usedField]: (credits as any)[usedField] + requiredCredits
        })
        .eq('user_id', userId)
      
      if (updateCreditsError) {
        return NextResponse.json(
          { error: 'Failed to deduct credits' },
          { status: 500 }
        )
      }
      
      // Create featured listing
      const { data: featuredListing, error: listingError } = await supabase
        .from('featured_listings')
        .insert({
          property_id,
          user_id: userId,
          feature_type,
          amount_paid: 0, // Credits cost nothing
          currency: 'CREDITS',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          site_id: finalSiteId,
          status: 'active',
          payment_status: 'paid'
        })
        .select()
        .single()
      
      if (listingError) {
        return NextResponse.json(
          { error: 'Failed to create featured listing' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        featured_listing: featuredListing,
        payment_method: 'credits',
        credits_remaining: availableCredits - requiredCredits
      })
      
    } else {
      // Stripe payment - create payment intent
      const { data: featuredListing, error: listingError } = await supabase
        .from('featured_listings')
        .insert({
          property_id,
          user_id: userId,
          feature_type,
          amount_paid: amount,
          currency: currency,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          site_id: finalSiteId,
          status: 'active',
          payment_status: 'pending'
        })
        .select()
        .single()
      
      if (listingError) {
        return NextResponse.json(
          { error: 'Failed to create featured listing record' },
          { status: 500 }
        )
      }
      
      // TODO: Integrate with Stripe to create payment intent
      // For now, we'll mark as paid for testing
      const { error: updateError } = await supabase
        .from('featured_listings')
        .update({ payment_status: 'paid' })
        .eq('id', featuredListing.id)
      
      if (updateError) {
        console.error('Failed to update payment status:', updateError)
      }
      
      return NextResponse.json({
        success: true,
        featured_listing: featuredListing,
        payment_method: 'stripe',
        amount_paid: amount,
        currency: currency,
        // TODO: Include Stripe payment intent details
        payment_intent: {
          client_secret: 'pi_test_' + Math.random().toString(36).substr(2, 9),
          amount: amount,
          currency: currency.toLowerCase()
        }
      })
    }
    
  } catch (error: any) {
    console.error('Error purchasing featuring:', error)
    return NextResponse.json(
      { error: 'Failed to purchase featuring: ' + error.message },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}