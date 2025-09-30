import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth check error:', error.message);
      return NextResponse.json({ 
        authenticated: false, 
        error: error.message 
      });
    }
    
    if (!session) {
      return NextResponse.json({ 
        authenticated: false, 
        message: 'No active session'
      });
    }
    
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ 
      authenticated: false, 
      error: 'Server error'
    }, { status: 500 });
  }
}