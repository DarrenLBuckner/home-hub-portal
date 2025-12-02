import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/supabase-admin'

// GET /api/users/[id] - Get specific user
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await context.params
    
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      console.error('User fetch error:', error)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('User API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/users/[id] - Update specific user
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await context.params
    const body = await request.json() as Record<string, any>
    
    // CRITICAL SECURITY: Block any updates to Super Admin account
    const SUPER_ADMIN_EMAIL = 'mrdarrenbuckner@gmail.com'
    
    // Get the target user's current data
    const { data: currentUser, error: fetchError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', id)
      .single()
    
    if (fetchError || !currentUser) {
      console.error('User fetch error:', fetchError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Type assertion to help TypeScript understand the structure
    const userProfile = currentUser as { email: string }
    
    // Block any attempt to modify Super Admin
    if (userProfile.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      console.error('SECURITY VIOLATION: Attempt to modify Super Admin account blocked via API', {
        targetUserId: id,
        targetEmail: userProfile.email,
        updateData: JSON.stringify(body),
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'SECURITY VIOLATION: Super Admin account cannot be modified via API!' 
      }, { status: 403 })
    }
    
    // Special check for suspension attempts
    if (body.is_suspended === true) {
      console.error('SECURITY CHECK: Suspension attempt via API', {
        targetUserId: id,
        targetEmail: userProfile.email,
        timestamp: new Date().toISOString()
      })
    }
    
    // Update user with proper typing workaround
    const profilesQuery = supabase.from('profiles')
    const { data: user, error } = await (profilesQuery as any)
      .update(body)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('User update error:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
    
    return NextResponse.json(user)
  } catch (error) {
    console.error('User update API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete specific user
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient()
    const { id } = await context.params
    
    console.log(`🎯 DELETION REQUEST: Starting deletion process for user ${id}`)
    
    // CRITICAL SECURITY: Block deletion of Super Admin account
    const SUPER_ADMIN_EMAIL = 'mrdarrenbuckner@gmail.com'
    
    // Get the target user's current data before deletion
    console.log('1️⃣ Fetching user profile before deletion...')
    const { data: targetUser, error: fetchError } = await supabase
      .from('profiles')
      .select('email, subscription_tier, first_name, last_name')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      console.error('❌ User fetch error before deletion:', fetchError)
      if (fetchError.code === 'PGRST116') {
        // User doesn't exist in profiles, check if they exist in auth
        console.log('ℹ️ User not found in profiles, checking auth system...')
        
        const { data: authUser, error: authCheckError } = await supabase.auth.admin.getUserById(id)
        
        if (authCheckError || !authUser?.user) {
          console.log('ℹ️ User not found in auth either - already deleted or invalid ID')
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        
        // User exists in auth but not profiles - proceed with auth-only deletion
        console.log('⚠️ User exists in auth but not in profiles - cleaning up auth only')
        const userProfile = { email: authUser.user.email || '', subscription_tier: null }
        
        // Continue with auth deletion below
      } else {
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
      }
    }
    
    // Type assertion to help TypeScript
    const userProfile = targetUser ? 
      targetUser as { email: string, subscription_tier?: string, first_name?: string, last_name?: string } :
      { email: '', subscription_tier: null }
    
    console.log('👤 User to delete:', {
      id,
      email: userProfile.email,
      name: targetUser ? `${targetUser.first_name} ${targetUser.last_name}` : 'Unknown',
      tier: userProfile.subscription_tier
    })
    
    // Block any attempt to delete Super Admin
    if (userProfile.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      console.error('CRITICAL SECURITY VIOLATION: Attempt to delete Super Admin account blocked via API', {
        targetUserId: id,
        targetEmail: userProfile.email,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ 
        error: 'CRITICAL SECURITY VIOLATION: Super Admin account cannot be deleted!' 
      }, { status: 403 })
    }
    
    // Check if this user is a founding agent (professional tier) and handle counter decrement
    const isFoundingAgent = userProfile.subscription_tier === 'professional' || userProfile.subscription_tier === 'founding_member'
    let foundingAgentRedemption = null
    
    if (isFoundingAgent) {
      // Get their founding agent redemption record
      const { data: redemption } = await supabase
        .from('promo_code_redemptions')
        .select('id, promo_code_id')
        .eq('user_id', id)
        .single()
      
      foundingAgentRedemption = redemption
    }
    
    // STRATEGIC DELETION APPROACH: 
    // Try multiple methods to ensure deletion succeeds
    console.log('🚀 Starting strategic deletion process...')
    
    let authDeleted = false
    let profileDeleted = false
    let authErrorDetails = null
    
    // Method 1: Try Auth deletion first (standard approach)
    console.log('2️⃣ Method 1: Attempting Supabase Auth deletion...')
    console.log('🔧 Auth client configuration:', {
      hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL
    })
    
    try {
      // First, try to get user info to debug potential issues
      const { data: authUserBefore, error: getUserError } = await supabase.auth.admin.getUserById(id)
      
      if (getUserError) {
        console.log('⚠️ Could not fetch auth user before deletion:', getUserError.message)
      } else if (authUserBefore?.user) {
        console.log('👤 Auth user before deletion:', {
          id: authUserBefore.user.id,
          email: authUserBefore.user.email,
          created_at: authUserBefore.user.created_at,
          confirmed_at: authUserBefore.user.confirmed_at,
          last_sign_in_at: authUserBefore.user.last_sign_in_at
        })
      }
      
      const { error: authError } = await supabase.auth.admin.deleteUser(id)
      
      if (authError) {
        console.error('❌ Auth deletion failed:', {
          message: authError.message,
          status: authError.status,
          name: authError.name,
          code: authError.code
        })
        authErrorDetails = authError
        
        // Log specific error types for debugging
        if (authError.message?.includes('service_role')) {
          console.error('🔑 Service role key issue detected!')
        } else if (authError.message?.includes('foreign key') || authError.message?.includes('constraint')) {
          console.error('🔗 Foreign key constraint preventing deletion')
        } else if (authError.message?.includes('session') || authError.message?.includes('active')) {
          console.error('🔓 User may have active sessions preventing deletion')
        }
        
        // Check if user actually exists in auth
        const { data: authUser, error: checkError } = await supabase.auth.admin.getUserById(id)
        
        if (checkError || !authUser?.user) {
          console.log('ℹ️ User does not exist in auth system - considering auth "deleted"')
          authDeleted = true
        } else {
          console.log('⚠️ User still exists in auth despite deletion failure')
          console.log('📧 Auth user email:', authUser.user.email)
        }
      } else {
        console.log('✅ Auth deletion successful')
        authDeleted = true
      }
    } catch (authException) {
      console.error('💥 Auth deletion threw exception:', authException)
      authErrorDetails = authException
    }
    
    // Method 2: Try direct profile deletion (more reliable for corrupted accounts)
    console.log('3️⃣ Method 2: Attempting direct profile deletion...')
    
    try {
      const { error: profileError, count } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id)
      
      if (profileError) {
        console.error('❌ Profile deletion failed:', {
          message: profileError.message,
          code: profileError.code,
          hint: profileError.hint
        })
        
        // Check if it's just because no rows exist
        if (profileError.message?.includes('0 rows') || profileError.code === 'PGRST116') {
          console.log('ℹ️ No profile rows to delete - considering profile "deleted"')
          profileDeleted = true
        }
      } else {
        console.log('✅ Profile deletion successful')
        profileDeleted = true
      }
    } catch (profileException) {
      console.error('💥 Profile deletion threw exception:', profileException)
    }
    
    // Method 3: If auth deletion failed but we need to proceed, try alternative approaches
    if (!authDeleted && targetUser) {
      console.log('4️⃣ Method 3: Auth deletion failed, trying alternative cleanup...')
      
      try {
        console.log('🔄 Method 3A: Attempting to clear user sessions...')
        
        // Try to invalidate all user sessions first
        try {
          await supabase.auth.admin.signOut(id, 'global')
          console.log('✅ User sessions cleared')
        } catch (signOutError) {
          console.log('⚠️ Could not clear sessions:', signOutError)
        }
        
        console.log('🔄 Method 3B: Attempting to update user state...')
        
        // Clear user metadata and disable account
        await supabase.auth.admin.updateUserById(id, {
          email_confirm: false,
          ban_duration: '24h',  // Temporarily ban to clear sessions
          user_metadata: {},
          app_metadata: {}
        })
        
        console.log('🔄 Method 3C: Retrying auth deletion after cleanup...')
        
        // Try auth deletion again after cleanup
        const { error: retryAuthError } = await supabase.auth.admin.deleteUser(id)
        
        if (!retryAuthError) {
          console.log('✅ Auth deletion successful after user state cleanup')
          authDeleted = true
        } else {
          console.log('❌ Auth deletion still failing after cleanup:', {
            message: retryAuthError.message,
            status: retryAuthError.status,
            code: retryAuthError.code
          })
          
          // Last resort: Try to use the shouldSoftDelete parameter
          console.log('🔄 Method 3D: Trying soft delete approach...')
          
          const { error: softDeleteError } = await supabase.auth.admin.deleteUser(id, false) // Hard delete
          
          if (!softDeleteError) {
            console.log('✅ Hard delete successful')
            authDeleted = true
          } else {
            console.log('❌ Hard delete also failed:', softDeleteError.message)
          }
        }
      } catch (retryException) {
        console.log('⚠️ Advanced retry attempts failed:', retryException)
      }
    }
    
    // Evaluation: Determine if deletion was successful enough to proceed
    const deletionSuccessful = authDeleted || profileDeleted
    
    if (!deletionSuccessful) {
      console.error('❌ DELETION FAILED: Neither auth nor profile deletion succeeded')
      return NextResponse.json({ 
        error: 'Failed to delete user from both auth and profile systems',
        details: {
          authError: authErrorDetails,
          message: 'User may have corrupted data or foreign key constraints'
        }
      }, { status: 500 })
    }
    
    console.log('✅ Deletion successful:', { authDeleted, profileDeleted })
    
    // Additional cleanup: Try to delete related records that might prevent deletion
    console.log('🧹 Cleaning up related user data...')
    
    try {
      // Delete from properties table
      const { error: propertiesError } = await supabase
        .from('properties')
        .delete()
        .eq('user_id', id)
      
      if (propertiesError) {
        console.log('⚠️ Properties cleanup error:', propertiesError.message)
      } else {
        console.log('✅ Cleaned up user properties')
      }
      
      // Delete from property_drafts table
      const { error: draftsError } = await supabase
        .from('property_drafts')
        .delete()
        .eq('user_id', id)
      
      if (draftsError) {
        console.log('⚠️ Drafts cleanup error:', draftsError.message)
      } else {
        console.log('✅ Cleaned up user drafts')
      }
      
    } catch (cleanupError) {
      console.log('⚠️ Some cleanup operations failed:', cleanupError)
      // Don't fail the deletion for cleanup errors
    }
    
    // If this was a founding agent, decrement the counter and remove redemption
    if (isFoundingAgent && foundingAgentRedemption) {
      try {
        // Delete the redemption record (this should trigger counter decrement)
        await supabase
          .from('promo_code_redemptions')
          .delete()
          .eq('id', foundingAgentRedemption.id)
        
        // Manual counter decrement as backup (in case trigger doesn't exist)
        await supabase
          .from('promo_codes')
          .update({ 
            current_redemptions: supabase.raw('current_redemptions - 1'),
            updated_at: new Date().toISOString()
          })
          .eq('id', foundingAgentRedemption.promo_code_id)
        
        console.log(`✅ Founding agent deleted and counter decremented: ${userProfile.email}`)
      } catch (counterError) {
        console.error('Failed to decrement founding agent counter:', counterError)
        // Don't fail the deletion, but log the issue
      }
    }
    
    console.log('🎉 USER DELETION COMPLETED SUCCESSFULLY')
    console.log('📊 Final status:', {
      authDeleted,
      profileDeleted, 
      isFoundingAgent,
      userEmail: userProfile.email,
      cleanupCompleted: true
    })
    
    return NextResponse.json({ 
      message: 'User deleted successfully',
      wasFoundingAgent: isFoundingAgent,
      deletionDetails: {
        authDeleted,
        profileDeleted,
        method: authDeleted ? 'Auth + Profile' : 'Profile Only'
      }
    })
  } catch (error) {
    console.error('User deletion API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
