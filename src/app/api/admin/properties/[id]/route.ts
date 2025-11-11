// Admin API endpoint for fetching individual property details
// GET /api/admin/properties/[id] - Get property details for admin
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// GET /api/admin/properties/[id] - Get property details with admin access
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('📂 Loading property details for admin...');
    
    const propertyId = params.id;
    
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID required' }, { status: 400 });
    }

    // Create supabase server client with service role
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
    
    // Authenticate the user first with anon key to get auth context
    const anonSupabase = createServerClient(
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

    const {
      data: { user },
      error: userErr,
    } = await anonSupabase.auth.getUser();

    if (userErr || !user) {
      console.error('Auth error:', userErr?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await anonSupabase
      .from('profiles')
      .select('admin_level, country_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.admin_level) {
      console.error('Admin check failed:', profileError?.message);
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Use service role client to bypass RLS and get property details
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        *,
        owner:profiles!user_id(
          id,
          email,
          first_name,
          last_name,
          user_type,
          phone
        ),
        property_media!left(
          media_url,
          media_type,
          is_primary,
          display_order
        )
      `)
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      console.error('❌ Property not found:', propertyError?.message);
      return NextResponse.json({ 
        error: 'Property not found' 
      }, { status: 404 });
    }

    // Sort images by display_order, putting primary first
    if (property.property_media) {
      property.property_media.sort((a: any, b: any) => {
        if (a.is_primary) return -1;
        if (b.is_primary) return 1;
        return (a.display_order || 0) - (b.display_order || 0);
      });
    }

    console.log('✅ Loaded property details:', { id: property.id, title: property.title });

    return NextResponse.json({ 
      success: true, 
      property 
    });
    
  } catch (err: any) {
    console.error('💥 Admin property loading error:', err);
    return NextResponse.json({ 
      error: `Failed to load property: ${err?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}