import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin operations
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

    console.log('🔧 Setting up Qumar as Owner Admin...');

    // First check what countries exist
    const { data: countries, error: countriesError } = await supabase
      .from('countries')
      .select('id, name');

    console.log('Available countries:', countries);

    // Update Qumar's profile to admin status (without country_id for now)
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        admin_level: 'owner',
        display_name: 'Qumar Torrington',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'qumar@guyanahomehub.com')
      .select();

    if (updateError) {
      console.error('❌ Error updating Qumar profile:', updateError);
      return NextResponse.json({ 
        error: "Failed to update profile", 
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('✅ Qumar profile updated:', updatedProfile);

    // Also check for alternate email capitalization
    const { data: altProfile, error: altError } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        admin_level: 'owner',
        display_name: 'Qumar Torrington',
        updated_at: new Date().toISOString()
      })
      .eq('email', 'Qumar@guyanahomehub.com')
      .select();

    if (altError) {
      console.log('ℹ️ No alternate capitalization found (normal):', altError.message);
    } else if (altProfile?.length > 0) {
      console.log('✅ Alternate profile also updated:', altProfile);
    }

    return NextResponse.json({
      success: true,
      message: "Qumar has been set up as Owner Admin successfully",
      updatedProfiles: [updatedProfile, altProfile].filter(Boolean),
      countries: countries,
      debug: {
        countriesError: countriesError?.message,
        updateError: updateError ? String(updateError) : null,
        altError: altError ? String(altError) : null
      }
    });

  } catch (error) {
    console.error('💥 Setup error:', error);
    return NextResponse.json({ 
      error: "Setup failed", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}