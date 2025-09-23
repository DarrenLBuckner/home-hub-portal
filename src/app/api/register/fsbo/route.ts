import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { sendWelcomeEmail } from '@/lib/email.js';
import { FEATURE_FLAGS, isPaymentRequired, getBetaExpiryDate } from '@/lib/config/featureFlags';

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
        user_type: 'owner',
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
    
    const userId = data.user.id;
    
    if (!isPaymentRequired()) {
      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_plan: 'beta_free',
        subscription_expires: getBetaExpiryDate('fsbo'),
        beta_user: true
      }).eq('id', userId);
      
      return NextResponse.json({ 
        success: true, 
        userId,
        redirectTo: '/dashboard/fsbo',
        skipPayment: true,
        message: 'Welcome to Portal Home Hub Beta! Free access until February 28, 2025'
      });
    }
    
    // Original return for when payment is required
    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
