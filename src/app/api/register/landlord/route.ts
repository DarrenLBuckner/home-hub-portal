import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { FEATURE_FLAGS, isPaymentRequired, getBetaExpiryDate } from '@/lib/config/featureFlags';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received landlord registration data:', { ...body, password: '[REDACTED]' });
    const { first_name, last_name, email, phone, password, plan } = body;
    
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
        user_type: 'landlord',
        plan: plan || 'basic',
      },
      email_confirm: true,
    });
    
    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Force update the profile to landlord type (overrides any trigger defaults)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        email: email,
        first_name: first_name,
        last_name: last_name,
        phone: phone,
        user_type: 'landlord',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      // Try creating if update failed
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          first_name: first_name,
          last_name: last_name,
          phone: phone,
          user_type: 'landlord',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (insertError) {
        console.error('Profile insert error:', insertError);
      }
    }

    // Note: Welcome email functionality can be added later
    
    const userId = data.user.id;
    
    if (!isPaymentRequired()) {
      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_plan: 'beta_free',
        subscription_expires: getBetaExpiryDate('landlord'),
        beta_user: true
      }).eq('id', userId);
      
      return NextResponse.json({ 
        success: true, 
        userId,
        redirectTo: '/dashboard/landlord',
        skipPayment: true,
        message: 'Welcome to Portal Home Hub Beta! Free access until February 28, 2025'
      });
    }
    
    // Original return for when payment is required
    return NextResponse.json({ 
      success: true, 
      userId,
      message: 'Registration successful! You can now login to access your dashboard.' 
    });
  } catch (error: any) {
    console.error('Landlord registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}