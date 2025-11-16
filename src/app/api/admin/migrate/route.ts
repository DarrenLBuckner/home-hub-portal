import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
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
            cookieStore.set({ name, value: "", ...options }); 
          },
        },
      }
    );
    
    // Check if user is authenticated and has admin privileges
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For security, only allow specific admin emails to run migrations
    const allowedAdmins = [
      'darren@portalhomehub.com',
      'darren@lebuckner.com', 
      'admin@portalhomehub.com'
    ];
    
    if (!allowedAdmins.includes(user.email || '')) {
      return NextResponse.json({ 
        error: 'Insufficient privileges', 
        userEmail: user.email,
        message: 'Only specific admin emails can run migrations'
      }, { status: 403 });
    }

    const results = [];

    // Simple approach: Just update the existing user to be a super admin
    results.push({ step: 'Updating user to super admin', status: 'running' });
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        user_type: 'admin',
        admin_level: 'super',
        display_name: 'Super Admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      results.push({ step: 'Updating user to super admin', status: 'error', error: updateError.message });
    } else {
      results.push({ step: 'Updating user to super admin', status: 'completed' });
    }

    // Check current profile structure
    results.push({ step: 'Checking current profile', status: 'running' });
    
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      results.push({ step: 'Checking current profile', status: 'error', error: profileError.message });
    } else {
      results.push({ 
        step: 'Checking current profile', 
        status: 'completed', 
        data: currentProfile 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Migration completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}