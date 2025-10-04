import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 User Profile Diagnostic - Starting');
    
    // Create supabase server client
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
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get user
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    
    if (userErr || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    // Admin config (same as properties create)
    const adminConfig: { [email: string]: { level: string } } = {
      'mrdarrenbuckner@gmail.com': { level: 'super' },
      'qumar@guyanahomehub.com': { level: 'owner' },
      'Qumar@guyanahomehub.com': { level: 'owner' }
    };
    
    // Check admin status
    const userEmail = userProfile?.email?.toLowerCase();
    const matchedAdminEmail = Object.keys(adminConfig).find(email => email.toLowerCase() === userEmail);
    const adminSettings = matchedAdminEmail ? adminConfig[matchedAdminEmail] : null;
    const isEligibleAdmin = userProfile && adminSettings && ['super', 'owner'].includes(adminSettings.level);
    
    // Count existing properties
    const { count: totalCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);
      
    const { count: saleCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('listing_type', 'sale');
      
    const { count: rentalCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('listing_type', 'rent');
    
    const diagnosticData = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: userProfile,
      profileError,
      adminDetection: {
        userEmail,
        userEmailLower: userEmail,
        matchedAdminEmail,
        adminSettings,
        isEligibleAdmin,
        adminConfigKeys: Object.keys(adminConfig)
      },
      propertyCounts: {
        total: totalCount || 0,
        sale: saleCount || 0,
        rental: rentalCount || 0
      },
      expectedLimits: isEligibleAdmin ? {
        sale: 20,
        rental: 5,
        source: 'admin_config'
      } : {
        sale: 'varies by user type',
        rental: 'varies by user type', 
        source: 'enhanced_property_limits'
      }
    };
    
    console.log('🔍 User Profile Diagnostic Data:', diagnosticData);
    
    return NextResponse.json(diagnosticData);
    
  } catch (err: any) {
    console.error('💥 Diagnostic API error:', err);
    return NextResponse.json({ error: err?.message || 'Unknown error' }, { status: 500 });
  }
}