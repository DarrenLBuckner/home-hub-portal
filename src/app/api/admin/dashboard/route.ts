import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { 
            return cookieStore.get(name)?.value; 
          },
          set(name: string, value: string, options: any) { 
            cookieStore.set({ name, value, ...options }); 
          },
          remove(name: string, options: any) { 
            cookieStore.set({ name, value: "", ...options }); 
          },
        },
      }
    );
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('❌ Admin API: No authenticated user', userError?.message);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('✅ Admin API: User authenticated:', user.email);

    // Get user profile with admin info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,email,user_type,admin_level,country_id,display_name,first_name,last_name,created_by_admin,admin_created_at,account_code')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('❌ Admin API: Profile query error', profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Check if user is admin
    if (profile.user_type !== 'admin') {
      console.log('❌ Admin API: User is not admin:', profile.user_type);
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    console.log('✅ Admin API: Admin verified:', profile.email, profile.admin_level);

    // Get admin dashboard metrics using service role for broader access
    const supabaseServiceRole = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
          set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }); },
          remove(name: string, options: any) { cookieStore.set({ name, value: "", ...options }); },
        },
      }
    );

    // Get property statistics
    const { data: properties, error: propertiesError } = await supabaseServiceRole
      .from('properties')
      .select('id,status,created_at,property_type');

    if (propertiesError) {
      console.log('⚠️ Admin API: Properties query error (non-fatal)', propertiesError);
    }

    // Calculate statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = {
      pending: properties?.filter(p => p.status === 'pending').length || 0,
      today: properties?.filter(p => new Date(p.created_at) >= today).length || 0,
      active: properties?.filter(p => p.status === 'approved' || p.status === 'active').length || 0,
      rejected: properties?.filter(p => p.status === 'rejected').length || 0,
      propertyTypes: {
        fsbo: properties?.filter(p => p.property_type === 'fsbo').length || 0,
        agent: properties?.filter(p => p.property_type === 'agent').length || 0,
        landlord: properties?.filter(p => p.property_type === 'landlord').length || 0,
      }
    };

    // Return admin data with stats
    const adminData = {
      profile,
      statistics: stats,
      permissions: {
        canManageUsers: profile.admin_level === 'super',
        canManageProperties: true,
        canViewAnalytics: true,
        canManageSystem: profile.admin_level === 'super',
      }
    };

    console.log('✅ Admin API: Returning admin data successfully');
    return NextResponse.json(adminData);

  } catch (error) {
    console.error('💥 Admin API: Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}