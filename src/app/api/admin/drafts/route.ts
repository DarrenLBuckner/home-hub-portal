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

    // Fetch TWO types of drafts for the current user:
    // 1. Incomplete drafts from property_drafts table (personal work-in-progress)
    // 2. Submitted drafts from properties table with status='draft' (awaiting completion/submission)
    
    // Get incomplete drafts from property_drafts table
    let incompleteDraftsQuery = supabase
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

    if (countryFilter) {
      incompleteDraftsQuery = incompleteDraftsQuery.eq('country_id', countryFilter);
    }

    // Get submitted drafts from properties table with status='draft'
    let submittedDraftsQuery = supabase
      .from('properties')
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
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });

    if (countryFilter) {
      submittedDraftsQuery = submittedDraftsQuery.eq('country_id', countryFilter);
    }

    const [incompleteDraftsResult, submittedDraftsResult] = await Promise.all([
      incompleteDraftsQuery,
      submittedDraftsQuery
    ]);

    if (incompleteDraftsResult.error) {
      console.error('❌ Error loading incomplete drafts:', incompleteDraftsResult.error);
      return NextResponse.json({ 
        error: 'Failed to load incomplete drafts' 
      }, { status: 500 });
    }

    if (submittedDraftsResult.error) {
      console.error('❌ Error loading submitted drafts:', submittedDraftsResult.error);
      return NextResponse.json({ 
        error: 'Failed to load submitted drafts' 
      }, { status: 500 });
    }

    // Transform submitted drafts to match property_drafts format
    const transformedSubmittedDrafts = (submittedDraftsResult.data || []).map((prop: any) => ({
      id: prop.id,
      user_id: prop.user_id,
      draft_data: {
        title: prop.title,
        description: prop.description,
        price: prop.price,
        property_type: prop.property_type,
        listing_type: prop.listing_type,
        ...prop
      },
      created_at: prop.created_at,
      updated_at: prop.updated_at,
      country_id: prop.country_id,
      owner: prop.owner,
      _isSubmittedDraft: true // Flag to distinguish from incomplete drafts
    }));

    // Combine both types of drafts
    const allDrafts = [
      ...(incompleteDraftsResult.data || []),
      ...transformedSubmittedDrafts
    ];

    console.log('✅ Loaded drafts:', { 
      incomplete: incompleteDraftsResult.data?.length || 0,
      submitted: submittedDraftsResult.data?.length || 0,
      total: allDrafts.length
    });

    return NextResponse.json({ 
      success: true, 
      drafts: allDrafts
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