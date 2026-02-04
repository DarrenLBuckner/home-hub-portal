import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// POST endpoint to add the is_premium_agent column
export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check admin auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is super admin
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('admin_level')
      .eq('id', session.user.id)
      .single();

    if (profileError || !adminProfile || adminProfile.admin_level !== 'super') {
      return NextResponse.json({ error: 'Super admin access required' }, { status: 403 });
    }

    // Check if column already exists by trying to select it
    const { error: checkError } = await supabase
      .from('profiles')
      .select('is_premium_agent')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'Column already exists'
      });
    }

    // Column doesn't exist - need manual creation
    // Return SQL for the admin to run in Supabase dashboard
    return NextResponse.json({
      success: false,
      message: 'Column does not exist. Please run this SQL in your Supabase SQL Editor:',
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_premium_agent BOOLEAN DEFAULT false;',
      instructions: [
        '1. Go to Supabase Dashboard → SQL Editor',
        '2. Paste and run the SQL above',
        '3. Refresh the Agent Management page'
      ]
    }, { status: 200 });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if column exists
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check admin auth
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if column exists
    const { error: checkError } = await supabase
      .from('profiles')
      .select('is_premium_agent')
      .limit(1);

    return NextResponse.json({
      column_exists: !checkError,
      error: checkError?.message
    });

  } catch (error) {
    console.error('Check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
