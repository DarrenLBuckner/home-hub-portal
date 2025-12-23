// Admin API endpoint for full user deletion with cascade
// POST /api/admin/delete-user
// Handles auth.users deletion using service_role key (server-side only)

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// Super Admin email (protected from deletion)
const SUPER_ADMIN_EMAIL = 'mrdarrenbuckner@gmail.com'

interface DeletionResult {
  success: boolean
  deleted: {
    properties: number
    favorites: number
    userFavorites: number
    profile: boolean
    auth: boolean
  }
  wasFoundingAgent?: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🎯 Admin Delete User: Starting secure deletion for', userId)

    // Create clients
    const cookieStore = await cookies()

    // Anon client for authentication
    const anonSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Admin client with service role (for bypassing RLS and auth deletion)
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Step 1: Authenticate the requesting user
    console.log('1️⃣ Authenticating requesting user...')
    const { data: { user: requestingUser }, error: authError } = await anonSupabase.auth.getUser()

    if (authError || !requestingUser) {
      console.error('❌ Authentication failed:', authError?.message)
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    // Step 2: Get requesting user's admin profile
    console.log('2️⃣ Checking admin permissions...')
    const { data: adminProfile, error: adminError } = await anonSupabase
      .from('profiles')
      .select('id, email, admin_level, country_id')
      .eq('id', requestingUser.id)
      .single()

    if (adminError || !adminProfile) {
      console.error('❌ Failed to get admin profile:', adminError?.message)
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Determine if super admin
    const isSuperAdmin = adminProfile.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
      || adminProfile.admin_level === 'super'

    // Only super_admin and owner_admin can delete users
    if (!isSuperAdmin && adminProfile.admin_level !== 'owner') {
      console.error('❌ Insufficient permissions:', adminProfile.admin_level)
      return NextResponse.json({
        error: 'Forbidden - Only Super Admin or Owner Admin can delete users'
      }, { status: 403 })
    }

    // Step 3: Get target user's profile (with email for cascade deletion)
    console.log('3️⃣ Fetching target user profile...')
    const { data: targetUser, error: targetError } = await adminSupabase
      .from('profiles')
      .select('id, email, first_name, last_name, country_id, subscription_tier, user_type')
      .eq('id', userId)
      .single()

    if (targetError) {
      // Check if user exists in auth but not profiles (orphaned auth user)
      if (targetError.code === 'PGRST116') {
        console.log('⚠️ User not in profiles, checking auth...')
        const { data: authUser, error: authCheckError } = await adminSupabase.auth.admin.getUserById(userId)

        if (authCheckError || !authUser?.user) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Orphaned auth user - delete from auth only
        console.log('🧹 Found orphaned auth user, cleaning up...')
        const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(userId)

        if (deleteAuthError) {
          console.error('❌ Failed to delete orphaned auth user:', deleteAuthError)
          return NextResponse.json({
            error: 'Failed to delete orphaned auth user',
            details: deleteAuthError.message
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          deleted: {
            properties: 0,
            favorites: 0,
            userFavorites: 0,
            profile: false,
            auth: true
          },
          message: 'Orphaned auth user cleaned up successfully'
        })
      }

      console.error('❌ Failed to get target user:', targetError)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    // Step 4: Security check - cannot delete Super Admin
    if (targetUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
      console.error('🔒 CRITICAL: Attempt to delete Super Admin blocked!')
      return NextResponse.json({
        error: 'CRITICAL SECURITY VIOLATION: Super Admin account cannot be deleted!'
      }, { status: 403 })
    }

    // Step 5: Authorization check for owner_admin - territory restriction
    if (!isSuperAdmin && adminProfile.admin_level === 'owner') {
      if (targetUser.country_id !== adminProfile.country_id) {
        console.error('❌ Owner Admin cannot delete user from different territory')
        console.error('  Admin country:', adminProfile.country_id)
        console.error('  Target country:', targetUser.country_id)
        return NextResponse.json({
          error: 'Forbidden - You can only delete users in your assigned territory'
        }, { status: 403 })
      }
    }

    console.log('✅ Authorization passed. Starting cascade deletion...')
    console.log('👤 Target user:', {
      id: targetUser.id,
      email: targetUser.email,
      name: `${targetUser.first_name} ${targetUser.last_name}`,
      country: targetUser.country_id
    })

    // Track deletion counts
    const deletionResult: DeletionResult = {
      success: false,
      deleted: {
        properties: 0,
        favorites: 0,
        userFavorites: 0,
        profile: false,
        auth: false
      }
    }

    // Check if founding agent for counter management
    const isFoundingAgent = targetUser.subscription_tier === 'professional'
      || targetUser.subscription_tier === 'founding_member'
    let foundingAgentRedemption = null

    if (isFoundingAgent) {
      const { data: redemption } = await adminSupabase
        .from('promo_code_redemptions')
        .select('id, promo_code_id')
        .eq('user_id', userId)
        .single()
      foundingAgentRedemption = redemption
    }

    // Step 6: CASCADE DELETION (Critical order!)
    // FK constraints require this exact sequence

    // 6a. Delete properties (must be before profile due to FK)
    console.log('📦 Deleting properties...')
    try {
      // First delete property_media for these properties
      const { data: userProperties } = await adminSupabase
        .from('properties')
        .select('id')
        .eq('user_id', userId)

      if (userProperties && userProperties.length > 0) {
        const propertyIds = userProperties.map(p => p.id)
        await adminSupabase
          .from('property_media')
          .delete()
          .in('property_id', propertyIds)
      }

      const { error: propError, count: propCount } = await adminSupabase
        .from('properties')
        .delete({ count: 'exact' })
        .eq('user_id', userId)

      if (propError) {
        console.error('⚠️ Properties deletion error:', propError.message)
      } else {
        deletionResult.deleted.properties = propCount || 0
        console.log(`✅ Deleted ${deletionResult.deleted.properties} properties`)
      }
    } catch (e) {
      console.error('⚠️ Properties deletion exception:', e)
    }

    // 6b. Delete favorites (user_id based)
    console.log('❤️ Deleting favorites...')
    try {
      const { error: favError, count: favCount } = await adminSupabase
        .from('favorites')
        .delete({ count: 'exact' })
        .eq('user_id', userId)

      if (favError) {
        console.error('⚠️ Favorites deletion error:', favError.message)
      } else {
        deletionResult.deleted.favorites = favCount || 0
        console.log(`✅ Deleted ${deletionResult.deleted.favorites} favorites`)
      }
    } catch (e) {
      console.error('⚠️ Favorites deletion exception:', e)
    }

    // 6c. Delete user_favorites (email-based)
    console.log('⭐ Deleting user_favorites...')
    try {
      if (targetUser.email) {
        const { error: ufError, count: ufCount } = await adminSupabase
          .from('user_favorites')
          .delete({ count: 'exact' })
          .eq('user_email', targetUser.email)

        if (ufError) {
          console.error('⚠️ User_favorites deletion error:', ufError.message)
        } else {
          deletionResult.deleted.userFavorites = ufCount || 0
          console.log(`✅ Deleted ${deletionResult.deleted.userFavorites} user_favorites`)
        }
      }
    } catch (e) {
      console.error('⚠️ User_favorites deletion exception:', e)
    }

    // 6d. Additional cleanup tables
    console.log('🧹 Cleaning up related records...')
    const cleanupTables = [
      { table: 'property_drafts', field: 'user_id' },
      { table: 'viewing_requests', field: 'user_id' },
      { table: 'leads', field: 'user_id' },
      { table: 'email_events', field: 'user_id' },
      { table: 'agent_vetting', field: 'user_id' },
      { table: 'promo_code_redemptions', field: 'user_id' }
    ]

    for (const { table, field } of cleanupTables) {
      try {
        await adminSupabase.from(table).delete().eq(field, userId)
        console.log(`  ✅ Cleaned ${table}`)
      } catch (e) {
        console.log(`  ⚠️ Could not clean ${table}:`, e)
      }
    }

    // 6e. Delete profile (before auth due to FK)
    console.log('👤 Deleting profile...')
    try {
      const { error: profileError } = await adminSupabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) {
        console.error('❌ Profile deletion error:', profileError.message)
      } else {
        deletionResult.deleted.profile = true
        console.log('✅ Profile deleted')
      }
    } catch (e) {
      console.error('❌ Profile deletion exception:', e)
    }

    // 6f. Delete from auth.users (using admin client with service_role)
    console.log('🔐 Deleting from auth.users...')
    try {
      // Try to sign out all sessions first
      try {
        await adminSupabase.auth.admin.signOut(userId, 'global')
        console.log('  ✅ Cleared user sessions')
      } catch (signOutError) {
        console.log('  ⚠️ Could not clear sessions:', signOutError)
      }

      const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(userId)

      if (authDeleteError) {
        console.error('❌ Auth deletion error:', authDeleteError.message)

        // Verify if user still exists
        const { data: checkUser, error: checkError } = await adminSupabase.auth.admin.getUserById(userId)

        if (checkError || !checkUser?.user) {
          console.log('  ℹ️ User already removed from auth')
          deletionResult.deleted.auth = true
        } else {
          // Try one more time with hard delete
          const { error: retryError } = await adminSupabase.auth.admin.deleteUser(userId, false)
          if (!retryError) {
            deletionResult.deleted.auth = true
            console.log('  ✅ Auth deleted on retry')
          } else {
            console.error('  ❌ Auth deletion retry failed:', retryError.message)
          }
        }
      } else {
        deletionResult.deleted.auth = true
        console.log('✅ Auth.users deleted')
      }
    } catch (e) {
      console.error('❌ Auth deletion exception:', e)
    }

    // Step 7: Handle founding agent counter
    if (isFoundingAgent && foundingAgentRedemption) {
      try {
        // Decrement the promo code counter
        const { data: promoCode } = await adminSupabase
          .from('promo_codes')
          .select('current_redemptions')
          .eq('id', foundingAgentRedemption.promo_code_id)
          .single()

        if (promoCode && promoCode.current_redemptions > 0) {
          await adminSupabase
            .from('promo_codes')
            .update({
              current_redemptions: promoCode.current_redemptions - 1,
              updated_at: new Date().toISOString()
            })
            .eq('id', foundingAgentRedemption.promo_code_id)

          console.log('🏆 Founding agent counter decremented')
          deletionResult.wasFoundingAgent = true
        }
      } catch (e) {
        console.error('⚠️ Failed to decrement founding agent counter:', e)
      }
    }

    // Determine overall success
    deletionResult.success = deletionResult.deleted.profile && deletionResult.deleted.auth

    console.log('🎉 Deletion complete:', deletionResult)

    if (!deletionResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Partial deletion - some records may remain',
        deleted: deletionResult.deleted,
        wasFoundingAgent: deletionResult.wasFoundingAgent
      }, { status: 207 }) // 207 Multi-Status
    }

    return NextResponse.json({
      success: true,
      deleted: deletionResult.deleted,
      wasFoundingAgent: deletionResult.wasFoundingAgent,
      message: `User ${targetUser.first_name} ${targetUser.last_name} (${targetUser.email}) deleted successfully`
    })

  } catch (error: any) {
    console.error('💥 Admin delete-user error:', error)
    return NextResponse.json({
      error: `Failed to delete user: ${error?.message || 'Unknown error'}`
    }, { status: 500 })
  }
}
