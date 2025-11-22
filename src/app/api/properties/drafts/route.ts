// API endpoints for managing property drafts
// GET /api/properties/drafts - Load user's drafts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// POST /api/properties/drafts - Create or update a draft
export async function POST(req: NextRequest) {
  try {
    console.log('💾 Saving property draft...');
    
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

    // Get user profile for country_id
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('country_id')
      .eq('id', user.id)
      .single();
      
    if (profileError || !userProfile) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: "User profile not found" }, { status: 401 });
    }

    const body = await req.json();
    const { draft_id, title, draft_type, ...draftData } = body;

    // Sanitize draft data (remove file objects if any)
    const sanitizedData = JSON.parse(JSON.stringify(draftData));

    if (draft_id) {
      // Update existing draft
      const { data: updatedDraft, error: updateError } = await supabase
        .from('property_drafts')
        .update({
          title: title || null,
          draft_type: draft_type || 'sale',
          draft_data: sanitizedData,
          device_info: req.headers.get('user-agent') || null
        })
        .eq('id', draft_id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating draft:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update draft' 
        }, { status: 500 });
      }

      console.log('✅ Draft updated successfully');
      return NextResponse.json({ 
        success: true, 
        draft_id: updatedDraft.id,
        message: 'Draft updated successfully'
      });

    } else {
      // Enhanced duplicate prevention - check for recent drafts with same content
      // First check for exact title match (if title exists and isn't generic)
      const isGenericTitle = !title || title.trim() === '' || title.includes('Untitled') || title.includes('Property -');
      
      if (!isGenericTitle) {
        const { data: existingDraft } = await supabase
          .from('property_drafts')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', title.trim())
          .eq('draft_type', draft_type || 'sale')
          .single();

        if (existingDraft) {
          console.log('📝 Updating existing draft by title match instead of creating duplicate');
          const { data: updatedDraft, error: updateError } = await supabase
            .from('property_drafts')
            .update({
              draft_data: sanitizedData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingDraft.id)
            .select()
            .single();

          if (updateError) {
            console.error('❌ Error updating existing draft:', updateError);
            return NextResponse.json({ 
              error: 'Failed to update existing draft' 
            }, { status: 500 });
          }

          return NextResponse.json({ 
            success: true, 
            draft_id: updatedDraft.id,
            message: 'Draft updated successfully'
          });
        }
      }
      
      // For generic/untitled drafts, check for recent drafts with similar content to prevent auto-save spam
      if (isGenericTitle) {
        // Get drafts from last 10 minutes to check for rapid duplicates
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { data: recentDrafts } = await supabase
          .from('property_drafts')
          .select('id, draft_data')
          .eq('user_id', user.id)
          .eq('draft_type', draft_type || 'sale')
          .gte('created_at', tenMinutesAgo)
          .order('created_at', { ascending: false })
          .limit(5);

        if (recentDrafts && recentDrafts.length > 0) {
          // Check if we have a recent draft with very similar content
          for (const recentDraft of recentDrafts) {
            const recentData = recentDraft.draft_data;
            const isSimilar = (
              recentData.price === sanitizedData.price &&
              recentData.bedrooms === sanitizedData.bedrooms &&
              recentData.bathrooms === sanitizedData.bathrooms &&
              recentData.region === sanitizedData.region &&
              recentData.property_type === sanitizedData.property_type
            );
            
            if (isSimilar) {
              console.log('📝 Updating recent similar draft instead of creating duplicate');
              const { data: updatedDraft, error: updateError } = await supabase
                .from('property_drafts')
                .update({
                  draft_data: sanitizedData,
                  updated_at: new Date().toISOString()
                })
                .eq('id', recentDraft.id)
                .select()
                .single();

              if (updateError) {
                console.error('❌ Error updating recent draft:', updateError);
                // Don't fail - fall through to create new draft
                break;
              }

              return NextResponse.json({ 
                success: true, 
                draft_id: updatedDraft.id,
                message: 'Draft updated successfully'
              });
            }
          }
        }
      }

      // Create new draft (only if no existing draft found)
      const { data: newDraft, error: createError } = await supabase
        .from('property_drafts')
        .insert({
          user_id: user.id,
          country_id: userProfile.country_id,
          title: title || null,
          draft_type: draft_type || 'sale',
          draft_data: sanitizedData,
          device_info: req.headers.get('user-agent') || null
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating draft:', createError);
        return NextResponse.json({ 
          error: 'Failed to create draft' 
        }, { status: 500 });
      }

      console.log('✅ Draft created successfully');
      return NextResponse.json({ 
        success: true, 
        draft_id: newDraft.id,
        message: 'Draft created successfully'
      });
    }
    
  } catch (err: any) {
    console.error('💥 Draft save error:', err);
    return NextResponse.json({ 
      error: `Failed to save draft: ${err?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}

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

    // Load user's draft properties from the new property_drafts table
    const { data: drafts, error: draftsError } = await supabase
      .from('property_drafts')
      .select('id, title, draft_data, created_at, updated_at, expires_at, save_count, draft_type')
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString()) // Only get non-expired drafts
      .order('updated_at', { ascending: false });

    if (draftsError) {
      console.error('❌ Error loading drafts:', draftsError);
      return NextResponse.json({ 
        error: 'Failed to load drafts' 
      }, { status: 500 });
    }

    console.log('✅ Loaded drafts:', { count: drafts?.length || 0 });

    // Format drafts for frontend
    const formattedDrafts = (drafts || []).map(draft => {
      const draftData = draft.draft_data || {};
      return {
        id: draft.id,
        title: draft.title || 'Untitled Draft',
        summary: [
          draftData.property_type || draft.draft_type,
          draftData.location || draftData.city,
          draftData.price ? `$${draftData.price}` : null
        ].filter(Boolean).join(' • ') || 'Incomplete Draft',
        last_saved: draft.updated_at,
        created_at: draft.created_at,
        expires_at: draft.expires_at,
        save_count: draft.save_count,
        draft_type: draft.draft_type
      };
    });

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