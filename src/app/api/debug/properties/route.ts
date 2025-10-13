import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Create supabase server client with service role for admin access
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin access
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

    // Get all properties with user information
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        status,
        listing_type,
        property_type,
        created_at,
        updated_at,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Properties query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('properties')
      .select('*', { count: 'exact', head: true });

    // Get count by status
    const { data: statusCounts } = await supabase
      .from('properties')
      .select('status')
      .then(({ data, error }) => {
        if (error || !data) return { data: [] };
        const counts: Record<string, number> = {};
        data.forEach(p => {
          counts[p.status] = (counts[p.status] || 0) + 1;
        });
        return { data: counts };
      });

    return NextResponse.json({
      success: true,
      totalProperties: totalCount || 0,
      statusCounts: statusCounts || {},
      recentProperties: properties?.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        listing_type: p.listing_type,
        property_type: p.property_type,
        created_at: p.created_at,
        user_id: p.user_id
      })) || [],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Properties debug error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}