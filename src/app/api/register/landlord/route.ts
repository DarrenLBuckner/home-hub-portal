import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received landlord registration data:', { ...body, password: '[REDACTED]' });
    const { first_name, last_name, email, phone, password, plan, promo_code, promo_benefits, promo_spot_number, is_founding_member } = body;
    
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

    // Handle promo code redemption if provided
    if (promo_code && data.user) {
      try {
        // Use 127.0.0.1 instead of localhost for server-to-server calls on Windows
        // localhost can have IPv6 resolution issues causing ECONNREFUSED
        const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL?.startsWith('http')
          ? process.env.NEXT_PUBLIC_FRONTEND_URL
          : 'http://127.0.0.1:3000';
        const redeemResponse = await fetch(`${baseUrl}/api/promo-codes/redeem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: promo_code,
            userId: data.user.id
          })
        });

        const redeemResult = await redeemResponse.json();
        if (!redeemResult.success) {
          console.warn('Promo code redemption failed:', redeemResult.error);
        } else {
          console.log('Promo code redeemed successfully:', redeemResult.message);
        }
      } catch (redeemError) {
        console.error('Error redeeming promo code:', redeemError);
        // Don't fail registration if promo code redemption fails
      }
    }

    // Send welcome email to new landlord
    try {
      const { sendWelcomeEmail } = await import('@/lib/email.js');
      await sendWelcomeEmail(email);
      console.log('✅ Landlord welcome email sent successfully');
    } catch (emailError) {
      console.warn('⚠️ Failed to send welcome email:', emailError);
      // Continue registration even if email fails
    }
    
    return NextResponse.json({ 
      user: data.user,
      message: 'Registration successful! Welcome email sent. You can now login to access your dashboard.' 
    });
  } catch (error: any) {
    console.error('Landlord registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}