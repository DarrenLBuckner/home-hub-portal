import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/featuring/credits - Get user's feature credits
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireAuth(request)
    const userId = auth.userId
    
    // Get user's feature credits
    const { data: credits, error } = await supabase
      .from('agent_feature_credits')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      // If no credits record exists, create one
      if (error.code === 'PGRST116') {
        const { data: newCredits, error: createError } = await supabase
          .from('agent_feature_credits')
          .insert({ user_id: userId })
          .select()
          .single()
        
        if (createError) {
          return NextResponse.json(
            { error: 'Failed to create credits record' },
            { status: 500 }
          )
        }
        
        return NextResponse.json({
          credits: newCredits,
          has_credits: false
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch credits' },
        { status: 500 }
      )
    }
    
    // Check if monthly reset is needed
    const today = new Date()
    const lastReset = new Date(credits.last_reset_date)
    const needsReset = lastReset.getMonth() !== today.getMonth() || 
                      lastReset.getFullYear() !== today.getFullYear()
    
    if (needsReset) {
      // Reset monthly usage counters
      const { data: updatedCredits, error: resetError } = await supabase
        .from('agent_feature_credits')
        .update({
          credits_used_this_month: 0,
          premium_used_this_month: 0,
          platinum_used_this_month: 0,
          last_reset_date: today.toISOString().split('T')[0]
        })
        .eq('user_id', userId)
        .select()
        .single()
      
      if (resetError) {
        console.error('Failed to reset monthly credits:', resetError)
      } else {
        return NextResponse.json({
          credits: updatedCredits,
          has_credits: (updatedCredits.credits_balance + updatedCredits.premium_credits + updatedCredits.platinum_credits) > 0,
          reset_applied: true
        })
      }
    }
    
    const hasCredits = (credits.credits_balance + credits.premium_credits + credits.platinum_credits) > 0
    
    return NextResponse.json({
      credits,
      has_credits: hasCredits
    })
    
  } catch (error: any) {
    console.error('Error fetching feature credits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feature credits: ' + error.message },
      { status: 500 }
    )
  }
}

// POST /api/featuring/credits - Add credits (admin only or subscription system)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const auth = await requireAuth(request)
    const userId = auth.userId
    
    const body = await request.json()
    const { 
      target_user_id,
      credits_to_add = 0, 
      premium_credits_to_add = 0, 
      platinum_credits_to_add = 0,
      monthly_allowance_update = false,
      reason = 'manual_addition'
    } = body
    
    // For now, allow users to add credits to their own account (testing)
    // In production, this should be restricted to admin or subscription system
    const targetUserId = target_user_id || userId
    
    // Get current credits
    const { data: currentCredits, error: fetchError } = await supabase
      .from('agent_feature_credits')
      .select('*')
      .eq('user_id', targetUserId)
      .single()
    
    let updateData: any = {}
    
    if (currentCredits) {
      // Update existing credits
      updateData = {
        credits_balance: currentCredits.credits_balance + credits_to_add,
        premium_credits: currentCredits.premium_credits + premium_credits_to_add,
        platinum_credits: currentCredits.platinum_credits + platinum_credits_to_add
      }
      
      if (monthly_allowance_update) {
        updateData.monthly_basic_allowance = credits_to_add
        updateData.monthly_premium_allowance = premium_credits_to_add
        updateData.monthly_platinum_allowance = platinum_credits_to_add
      }
    } else {
      // Create new credits record
      updateData = {
        user_id: targetUserId,
        credits_balance: credits_to_add,
        premium_credits: premium_credits_to_add,
        platinum_credits: platinum_credits_to_add
      }
      
      if (monthly_allowance_update) {
        updateData.monthly_basic_allowance = credits_to_add
        updateData.monthly_premium_allowance = premium_credits_to_add
        updateData.monthly_platinum_allowance = platinum_credits_to_add
      }
    }
    
    const { data: updatedCredits, error: updateError } = await supabase
      .from('agent_feature_credits')
      .upsert(updateData)
      .select()
      .single()
    
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update credits' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      credits: updatedCredits,
      added: {
        basic: credits_to_add,
        premium: premium_credits_to_add,
        platinum: platinum_credits_to_add
      },
      reason
    })
    
  } catch (error: any) {
    console.error('Error adding feature credits:', error)
    return NextResponse.json(
      { error: 'Failed to add feature credits: ' + error.message },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}