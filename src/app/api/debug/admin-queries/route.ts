import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role
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

    console.log('🔍 Testing exact admin dashboard query...');

    // Test the EXACT query from mobile dashboard
    const { data: mobileQuery, error: mobileError } = await supabase
      .from('properties')
      .select(`
        *,
        profiles!inner (
          first_name,
          last_name,
          user_type
        )
      `)
      .in('status', ['pending', 'draft']);

    console.log('Mobile dashboard query results:', {
      count: mobileQuery?.length || 0,
      error: mobileError,
      properties: mobileQuery
    });

    // Test the EXACT query from desktop dashboard  
    const { data: desktopQuery, error: desktopError } = await supabase
      .from('properties')
      .select(`
        *,
        profiles!inner(first_name, last_name, user_type)
      `)
      .in('status', ['pending', 'draft'])
      .order('created_at', { ascending: true });

    console.log('Desktop dashboard query results:', {
      count: desktopQuery?.length || 0,
      error: desktopError,
      properties: desktopQuery
    });

    // Test simple query without profiles join
    const { data: simpleQuery, error: simpleError } = await supabase
      .from('properties')
      .select('*')
      .in('status', ['pending', 'draft']);

    console.log('Simple query (no profiles join):', {
      count: simpleQuery?.length || 0,
      error: simpleError,
      properties: simpleQuery
    });

    return NextResponse.json({
      success: true,
      message: "Dashboard query debug results",
      queries: {
        mobile: {
          data: mobileQuery,
          error: mobileError,
          count: mobileQuery?.length || 0
        },
        desktop: {
          data: desktopQuery, 
          error: desktopError,
          count: desktopQuery?.length || 0
        },
        simple: {
          data: simpleQuery,
          error: simpleError,
          count: simpleQuery?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('💥 Debug query error:', error);
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}