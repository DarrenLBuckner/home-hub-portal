import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'failed';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (type === 'failed') {
      // Get failed emails (bounces, complaints, delays)
      const { data, error } = await supabase
        .from('failed_emails')
        .select('*')
        .limit(limit);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        failed_emails: data,
        count: data?.length || 0 
      });

    } else if (type === 'stats') {
      // Get email statistics
      const { data, error } = await supabase
        .from('email_stats')
        .select('*')
        .limit(30); // Last 30 days

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        stats: data 
      });

    } else if (type === 'recent') {
      // Get recent email events
      const { data, error } = await supabase
        .from('email_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        recent_events: data,
        count: data?.length || 0 
      });
    }

    return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

  } catch (error: any) {
    console.error('Email events API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}