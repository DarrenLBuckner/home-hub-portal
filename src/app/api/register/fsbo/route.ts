import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendWelcomeEmail } from '@/lib/email.js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received registration data:', { ...body, password: '[REDACTED]' });
    const { first_name, last_name, email, phone, password } = body;
    if (!first_name || !last_name || !email || !phone || !password) {
      console.log('Missing fields:', { first_name: !!first_name, last_name: !!last_name, email: !!email, phone: !!phone, password: !!password });
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create Supabase Auth user
    const supabase = createAdminClient();
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name,
        last_name,
        phone,
        user_type: 'fsbo',
      },
      email_confirm: true,
    });
    
    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Send welcome email (async, don't wait for it)
    try {
      await sendWelcomeEmail(email);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }
    
    return NextResponse.json({ user: data.user });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
