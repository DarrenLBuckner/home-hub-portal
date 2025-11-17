// Admin API endpoint for managing all property drafts
// GET /api/admin/drafts - Load all drafts (admin access)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// GET /api/admin/drafts - Load all drafts for admin dashboard
export async function GET(req: NextRequest) {
  try {
    console.log('📂 Loading all drafts for admin...');
    
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

    // Get URL search params for filtering
    const url = new URL(req.url);
    const countryFilter = url.searchParams.get('country');

    // Get only the current user's personal drafts (not all drafts)
    // Drafts are private to the individual creator, not visible to other admins
    let draftsQuery = supabase
      .from('property_drafts')
      .select(`
        *,
        owner:profiles!user_id (
          id,
          email,
          first_name,
          last_name,
          user_type
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    // Apply country filter for non-super admins (additional safety)
    if (countryFilter) {
      draftsQuery = draftsQuery.eq('country_id', countryFilter);
    }

    const { data: drafts, error: draftsError } = await draftsQuery;

    if (draftsError) {
      console.error('❌ Error loading admin drafts:', draftsError);
      return NextResponse.json({ 
        error: 'Failed to load drafts' 
      }, { status: 500 });
    }

    console.log('✅ Loaded admin drafts:', { count: drafts?.length || 0 });

    return NextResponse.json({ 
      success: true, 
      drafts: drafts || []
    });
    
  } catch (err: any) {
    console.error('💥 Admin draft loading error:', err);
    return NextResponse.json({ 
      error: `Failed to load admin drafts: ${err?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}

// DELETE /api/admin/drafts - Delete draft by ID (admin access)
export async function DELETE(req: NextRequest) {
  try {
    console.log('🗑️ Admin deleting draft...');
    
    const { draftId } = await req.json();
    
    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
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
    
    // Authenticate the user first
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await anonSupabase
      .from('profiles')
      .select('admin_level')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile?.admin_level) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Use service role to delete the draft
    const { error: deleteError } = await supabase
      .from('property_drafts')
      .delete()
      .eq('id', draftId);

    if (deleteError) {
      console.error('❌ Error deleting draft:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete draft' 
      }, { status: 500 });
    }

    console.log('✅ Draft deleted successfully');
    return NextResponse.json({ 
      success: true, 
      message: 'Draft deleted successfully'
    });
    
  } catch (err: any) {
    console.error('💥 Admin draft deletion error:', err);
    return NextResponse.json({ 
      error: `Failed to delete draft: ${err?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}