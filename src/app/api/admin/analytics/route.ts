import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';

    if (type === 'summary') {
      // Get basic visitor stats for last 30 days
      const { data: pageViews, error: pvError } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (pvError) {
        console.error('Page views error:', pvError);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
      }

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const todayViews = pageViews?.filter(view => view.created_at?.startsWith(today)).length || 0;
      const totalViews = pageViews?.length || 0;

      // Top pages
      const pageCounts: { [key: string]: number } = {};
      pageViews?.forEach(view => {
        pageCounts[view.page_path] = (pageCounts[view.page_path] || 0) + 1;
      });
      
      const topPages = Object.entries(pageCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([path, count]) => ({ path, count }));

      return NextResponse.json({
        today_views: todayViews,
        total_views_30d: totalViews,
        top_pages: topPages
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Track a page view
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { page_path, user_agent, referrer } = await request.json();

    // Store page view
    const { error } = await supabase
      .from('page_views')
      .insert({
        page_path,
        user_agent: user_agent?.substring(0, 500), // Limit length
        referrer: referrer?.substring(0, 500),
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to store page view:', error);
      return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Page view tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}