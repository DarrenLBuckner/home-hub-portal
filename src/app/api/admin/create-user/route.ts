import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Type for the admin profile we're fetching
interface AdminProfile {
  id: string;
  user_type: string;
  admin_level: string | null;
  country_id: string | null;
}

/**
 * Create a new user (agent, landlord, FSBO, or admin)
 * 
 * Permission Hierarchy:
 * - Super Admin: Can create all user types
 * - Owner Admin: Can create Agent, Landlord, FSBO (for their territory only)
 * - Basic Admin: Cannot create any users
 */
export async function POST(request: NextRequest) {
  try {
    // Create clients
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Get user session from auth header
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (userError || !currentUser) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

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

    const currentAdmin = currentAdminData as AdminProfile;

    if (currentAdmin.user_type !== 'admin') {
      return NextResponse.json({ error: 'Only admins can create users' }, { status: 403 });
    }

    // Get request body
    const body = await request.json();
    const { email, firstName, lastName, phone, userType, territory } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !userType) {
      return NextResponse.json({ error: 'Missing required fields: email, firstName, lastName, userType' }, { status: 400 });
    }

    // Validate user type
    const validUserTypes = ['agent', 'landlord', 'fsbo'];
    if (!validUserTypes.includes(userType)) {
      return NextResponse.json({ error: `Invalid user type. Must be one of: ${validUserTypes.join(', ')}` }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Permission checks for user creation
    if (currentAdmin.admin_level === 'basic') {
      return NextResponse.json({
        error: 'Basic Admin cannot create users. Only Super Admin and Owner Admin can create users.'
      }, { status: 403 });
    }

    // Determine territory for the new user
    let finalTerritory = territory;
    if (currentAdmin.admin_level === 'owner') {
      // Owner Admin can only assign to their own territory
      finalTerritory = currentAdmin.country_id;
      if (!finalTerritory) {
        return NextResponse.json({
          error: 'Cannot determine your country assignment. Please contact Super Admin.'
        }, { status: 400 });
      }
    } else if (currentAdmin.admin_level === 'super') {
      // Super Admin must specify territory
      if (!finalTerritory) {
        return NextResponse.json({
          error: 'Super Admin must specify a territory when creating a user'
        }, { status: 400 });
      }
    }

    // Check if email already exists in profiles

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (existingProfile) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Generate a temporary password (minimum 12 characters for security)
    const tempPassword = generateSecurePassword();


    // Step 1: Create auth user (using supabase singleton)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: true, // Auto-confirm email so they can log in immediately
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        user_type: userType,
        phone: phone || null,
        territory: finalTerritory
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);

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
    const profileData = {
      id: authData.user.id, // Critical: must match auth.users.id
      email: email.trim().toLowerCase(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      full_name: `${firstName.trim()} ${lastName.trim()}`,
      phone: phone || null,
      user_type: userType,
      admin_level: null, // Not an admin
      country_id: finalTerritory,
      approval_status: 'approved',
      created_by_admin: currentAdmin.id,
      admin_created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // For agents/landlords/FSBO - set subscription to trial or pending
      subscription_status: 'pending_approval',
      subscription_plan: 'trial'
    };


    const { error: profileError } = await supabase
      .from('profiles')
      .upsert([profileData], { onConflict: 'id' });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Try to clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({
        error: `Failed to create user profile: ${profileError.message}`
      }, { status: 500 });
    }

    // Step 3: Return success with user info
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        userType: userType,
        territory: finalTerritory,
        tempPassword: tempPassword,
        createdAt: new Date().toISOString()
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Unexpected error in create-user API:', error);
    return NextResponse.json({
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Generate a secure temporary password
 */
function generateSecurePassword(): string {
  const length = 16;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
}
