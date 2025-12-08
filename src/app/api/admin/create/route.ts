import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Type for the admin profile we're fetching
interface AdminProfile {
  id: string;
  user_type: string;
  admin_level: string | null;
  country_id: string | null;
}

export async function POST(request: NextRequest) {
  try {
    // Get the current user session to verify they're an admin
    // Next.js 15 requires awaiting cookies()
    const cookieStore = await cookies();
    const supabaseAuth = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user: currentUser } } = await supabaseAuth.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized - not logged in' }, { status: 401 });
    }

    // Use admin client for privileged operations
    const supabaseAdmin = createAdminClient();

    // Get current admin's profile to check permissions
    const { data: currentAdminData, error: adminError } = await supabaseAdmin
      .from('profiles')
      .select('id, user_type, admin_level, country_id')
      .eq('id', currentUser.id)
      .single();

    if (adminError || !currentAdminData) {
      console.error('Failed to get current admin:', adminError);
      return NextResponse.json({ error: 'Failed to verify admin status' }, { status: 403 });
    }

    // Cast to our known type
    const currentAdmin = currentAdminData as AdminProfile;

    if (currentAdmin.user_type !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create other admins' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { email, firstName, lastName, password, adminLevel, countryId } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !password || !adminLevel) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Permission checks based on admin hierarchy
    const canCreate = checkPermission(currentAdmin.admin_level, adminLevel);
    if (!canCreate) {
      return NextResponse.json({
        error: `${currentAdmin.admin_level} admin cannot create ${adminLevel} admin accounts`
      }, { status: 403 });
    }

    // Determine country_id for the new admin
    // Super Admin can set any country, others inherit their own country
    let finalCountryId = countryId;
    if (currentAdmin.admin_level !== 'super') {
      // Force same country for non-super admins
      finalCountryId = currentAdmin.country_id;

      if (!finalCountryId) {
        return NextResponse.json({
          error: 'Cannot determine your country assignment. Please contact Super Admin.'
        }, { status: 400 });
      }
    }

    // Check if email already exists in profiles
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (existingProfile) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Step 1: Create auth user with service role client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password,
      email_confirm: true, // Auto-confirm email so they can log in immediately
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        user_type: 'admin'
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);

      // Handle specific error messages
      if (authError.message?.includes('already registered')) {
        return NextResponse.json({
          error: 'This email is already registered in the authentication system'
        }, { status: 400 });
      }

      return NextResponse.json({
        error: authError.message || 'Failed to create auth user'
      }, { status: 400 });
    }

    if (!authData?.user?.id) {
      return NextResponse.json({ error: 'Auth user creation failed - no user ID returned' }, { status: 500 });
    }

    // Step 2: Create profile with SAME ID as auth user
    // Use upsert to handle any existing partial records (e.g., from DB triggers)
    const profileData = {
      id: authData.user.id, // Critical: must match auth.users.id
      email: email.trim().toLowerCase(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      user_type: 'admin',
      admin_level: adminLevel,
      country_id: finalCountryId,
      approval_status: 'approved',
      created_by_admin: currentAdmin.id,
      admin_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData as any, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error:', profileError);

      // Rollback: delete the auth user we just created
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('Rolled back auth user after profile creation failure');
      } catch (rollbackError) {
        console.error('Failed to rollback auth user:', rollbackError);
      }

      return NextResponse.json({
        error: `Failed to create admin profile: ${profileError.message}`
      }, { status: 500 });
    }

    // Success!
    const levelNames: Record<string, string> = {
      'super': 'Super Admin',
      'owner': 'Owner Admin',
      'basic': 'Basic Admin'
    };

    console.log(`✅ Admin created successfully: ${email} (${levelNames[adminLevel]}) by ${currentAdmin.id}`);

    return NextResponse.json({
      success: true,
      message: `${levelNames[adminLevel]} created successfully`,
      admin: {
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        adminLevel: adminLevel,
        countryId: finalCountryId
      }
    });

  } catch (error: any) {
    console.error('Create admin error:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Permission check helper - determines if creator can create target level
function checkPermission(creatorLevel: string | null | undefined, targetLevel: string): boolean {
  // Define hierarchy: super (3) > owner (2) > basic (1)
  const hierarchy: Record<string, number> = {
    'super': 3,
    'owner': 2,
    'basic': 1
  };

  const creatorRank = hierarchy[creatorLevel || ''] || 0;
  const targetRank = hierarchy[targetLevel] || 0;

  // Super Admin can create any admin level
  if (creatorLevel === 'super') return true;

  // Owner Admin can create owner (same level) or basic (lower level)
  if (creatorLevel === 'owner') {
    return targetLevel === 'owner' || targetLevel === 'basic';
  }

  // Basic Admin cannot create any admins
  return false;
}
