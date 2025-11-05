// API endpoints for managing property drafts
// GET /api/properties/drafts - Load user's drafts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    console.log('📂 Loading user drafts...');
    
    // Create supabase server client
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
    
    // Authenticate the user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error('Auth error:', userErr?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load user's draft properties
    const { data: drafts, error: draftsError } = await supabase
      .from('properties')
      .select('id, title, description, created_at, updated_at, location, price, property_type, status')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('updated_at', { ascending: false });

    if (draftsError) {
      console.error('❌ Error loading drafts:', draftsError);
      return NextResponse.json({ 
        error: 'Failed to load drafts' 
      }, { status: 500 });
    }

    console.log('✅ Loaded drafts:', { count: drafts?.length || 0 });

    // Format drafts for frontend
    const formattedDrafts = (drafts || []).map(draft => ({
      id: draft.id,
      title: draft.title || 'Untitled Draft',
      summary: [
        draft.property_type,
        draft.location,
        draft.price ? `$${draft.price}` : null
      ].filter(Boolean).join(' • ') || 'Incomplete Draft',
      last_saved: draft.updated_at,
      created_at: draft.created_at
    }));

    return NextResponse.json({ 
      success: true, 
      drafts: formattedDrafts 
    });
    
  } catch (err: any) {
    console.error('💥 Draft loading error:', err);
    return NextResponse.json({ 
      error: `Failed to load drafts: ${err?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}