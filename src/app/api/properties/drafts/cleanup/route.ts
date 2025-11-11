// API endpoint for draft cleanup operations
// POST /api/properties/drafts/cleanup - Clean expired drafts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('🧹 Starting draft cleanup...');
    
    // Create supabase server client with service role for cleanup
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined; },
          set() {},
          remove() {},
        },
      }
    );

    // Call the cleanup function we created in the database
    const { data, error } = await supabase.rpc('cleanup_expired_drafts');

    if (error) {
      console.error('❌ Cleanup error:', error);
      return NextResponse.json({ 
        error: 'Failed to clean up expired drafts' 
      }, { status: 500 });
    }

    const deletedCount = data || 0;
    console.log(`✅ Cleanup completed: ${deletedCount} expired drafts removed`);

    return NextResponse.json({ 
      success: true, 
      deleted_count: deletedCount,
      message: `Cleaned up ${deletedCount} expired drafts`
    });
    
  } catch (err: any) {
    console.error('💥 Cleanup error:', err);
    return NextResponse.json({ 
      error: `Cleanup failed: ${err?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}

// GET /api/properties/drafts/cleanup - Get cleanup statistics
export async function GET(req: NextRequest) {
  try {
    console.log('📊 Getting draft statistics...');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined; },
          set() {},
          remove() {},
        },
      }
    );

    // Get statistics about drafts
    const { data: stats, error: statsError } = await supabase
      .from('property_drafts')
      .select('expires_at, created_at, save_count');

    if (statsError) {
      console.error('❌ Stats error:', statsError);
      return NextResponse.json({ 
        error: 'Failed to get draft statistics' 
      }, { status: 500 });
    }

    const now = new Date();
    const totalDrafts = stats?.length || 0;
    const expiredDrafts = stats?.filter(draft => new Date(draft.expires_at) < now).length || 0;
    const activeDrafts = totalDrafts - expiredDrafts;

    // Calculate average save count
    const avgSaveCount = totalDrafts > 0 
      ? (stats?.reduce((sum, draft) => sum + (draft.save_count || 0), 0) || 0) / totalDrafts 
      : 0;

    const statistics = {
      total_drafts: totalDrafts,
      active_drafts: activeDrafts,
      expired_drafts: expiredDrafts,
      average_save_count: Math.round(avgSaveCount * 100) / 100
    };

    console.log('✅ Statistics retrieved:', statistics);

    return NextResponse.json({ 
      success: true, 
      statistics
    });
    
  } catch (err: any) {
    console.error('💥 Statistics error:', err);
    return NextResponse.json({ 
      error: `Failed to get statistics: ${err?.message || 'Unknown error'}` 
    }, { status: 500 });
  }
}