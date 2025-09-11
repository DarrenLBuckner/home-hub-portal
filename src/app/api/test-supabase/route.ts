import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('Supabase connection error:', error);
      return NextResponse.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Supabase connection working',
      env_check: {
        supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
  } catch (error: any) {
    console.error('Test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}