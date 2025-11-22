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

    // Load the specific draft from property_drafts table
    const { data: draft, error: draftError } = await supabase
      .from('property_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', user.id)
      .single();

    if (draftError) {
      console.error('❌ Error loading draft:', draftError);
      return NextResponse.json({ 
        error: 'Draft not found' 
      }, { status: 404 });
    }

    // Check if draft has expired
    if (new Date(draft.expires_at) < new Date()) {
      return NextResponse.json({ 
        error: 'Draft has expired' 
      }, { status: 410 });
    }

    // Format draft for form consumption - extract data from draft_data JSONB
    const formattedDraft = {
      id: draft.id,
      title: draft.title,
      draft_type: draft.draft_type,
      created_at: draft.created_at,
      updated_at: draft.updated_at,
      expires_at: draft.expires_at,
      save_count: draft.save_count,
      ...draft.draft_data // Spread the JSONB data
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

// PUT /api/properties/drafts/[id] - Update specific draft (for autosave)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const draftId = params.id;
    console.log('💾 Auto-saving draft:', draftId);
    
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

    const body = await req.json();
    const { title, draft_type, ...draftData } = body;

    // Sanitize draft data
    const sanitizedData = JSON.parse(JSON.stringify(draftData));

    // Update the draft (this will trigger the auto-update function)
    const { data: updatedDraft, error: updateError } = await supabase
      .from('property_drafts')
      .update({
        title: title || null,
        draft_type: draft_type || 'sale',
        draft_data: sanitizedData,
        device_info: req.headers.get('user-agent') || null
      })
      .eq('id', draftId)
      .eq('user_id', user.id)
      .select('id, updated_at, save_count')
      .single();

    if (updateError) {
      console.error('❌ Error updating draft:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update draft' 
      }, { status: 500 });
    }

    console.log('✅ Draft auto-saved successfully');

    return NextResponse.json({ 
      success: true, 
      draft_id: updatedDraft.id,
      updated_at: updatedDraft.updated_at,
      save_count: updatedDraft.save_count,
      message: 'Draft auto-saved'
    });
    
  } catch (err: any) {
    console.error('💥 Draft auto-save error:', err);
    return NextResponse.json({ 
      error: `Failed to auto-save draft: ${err?.message || 'Unknown error'}` 
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

    // Delete the draft from property_drafts table
    // Note: No need to delete media as drafts store media URLs in JSONB, not separate table
    const { error: draftDeleteError } = await supabase
      .from('property_drafts')
      .delete()
      .eq('id', draftId)
      .eq('user_id', user.id);

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