// API endpoints for individual draft operations
// GET /api/properties/drafts/[id] - Load specific draft
// DELETE /api/properties/drafts/[id] - Delete draft
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const draftId = params.id;
    console.log('📄 Loading draft:', draftId);
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Load the specific draft
    const { data: draft, error: draftError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .single();

    if (draftError) {
      console.error('❌ Error loading draft:', draftError);
      return NextResponse.json({ 
        error: 'Draft not found' 
      }, { status: 404 });
    }

    // Also load property media
    const { data: media, error: mediaError } = await supabase
      .from('property_media')
      .select('url, alt_text, is_primary')
      .eq('property_id', draftId)
      .order('is_primary', { ascending: false });

    if (mediaError) {
      console.warn('⚠️ Error loading draft media:', mediaError);
    }

    // Format draft for form consumption
    const formattedDraft = {
      ...draft,
      images: media?.map(m => ({ url: m.url, alt: m.alt_text, isPrimary: m.is_primary })) || []
    };

    console.log('✅ Draft loaded successfully');

    return NextResponse.json({ 
      success: true, 
      draft: formattedDraft 
    });
    
  } catch (err: any) {
    console.error('💥 Draft loading error:', err);
    return NextResponse.json({ 
      error: `Failed to load draft: ${err?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const draftId = params.id;
    console.log('🗑️ Deleting draft:', draftId);
    
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete property media first
    const { error: mediaDeleteError } = await supabase
      .from('property_media')
      .delete()
      .eq('property_id', draftId);

    if (mediaDeleteError) {
      console.warn('⚠️ Error deleting draft media:', mediaDeleteError);
    }

    // Delete the draft property
    const { error: draftDeleteError } = await supabase
      .from('properties')
      .delete()
      .eq('id', draftId)
      .eq('user_id', user.id)
      .eq('status', 'draft');

    if (draftDeleteError) {
      console.error('❌ Error deleting draft:', draftDeleteError);
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
    console.error('💥 Draft deletion error:', err);
    return NextResponse.json({ 
      error: `Failed to delete draft: ${err?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}