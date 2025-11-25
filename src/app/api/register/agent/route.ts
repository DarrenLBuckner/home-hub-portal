import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received agent registration data:', { ...body, password: '[REDACTED]' });
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      password,
      promo_code, 
      promo_benefits, 
      promo_spot_number, 
      is_founding_member,
      ...agentData 
    } = body;
    
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
        user_type: 'agent',
      },
      email_confirm: true,
    });
    
    if (authError) {
      console.error('Supabase auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Create or update profile - use upsert to handle both cases
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: data.user.id,
        email: email,
        first_name: first_name,
        last_name: last_name,
        phone: phone,
        user_type: 'agent',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();

    if (profileError) {
      console.error('❌ Profile upsert failed:', profileError);
      return NextResponse.json({ 
        error: 'Failed to create user profile: ' + profileError.message 
      }, { status: 500 });
    }

    console.log('✅ Profile created/updated successfully:', profileData);

    // Handle promo code redemption if provided
    if (promo_code && data.user) {
      try {
        const redeemResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/promo-codes/redeem`, {
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

    // Insert into agent_vetting table with user_id reference
    const agentVettingData = {
      user_id: data.user.id,
      ...agentData,
      user_type: "agent",
      status: "pending_review",
      submitted_at: new Date().toISOString(),
      promo_code: promo_code,
      promo_benefits: promo_benefits ? JSON.stringify(promo_benefits) : null,
      promo_spot_number: promo_spot_number,
      is_founding_member: !!promo_code
    };

    const { error: vettingError } = await supabase
      .from("agent_vetting")
      .insert(agentVettingData);

    if (vettingError) {
      console.error('Agent vetting insert error:', vettingError);
      return NextResponse.json({ error: 'Failed to save agent application' }, { status: 500 });
    }

    // Send confirmation email
    try {
      await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/send-agent-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentEmail: email,
          agentName: `${first_name} ${last_name}`.trim(),
          country: agentData.country || 'GY',
          submittedAt: new Date().toLocaleDateString()
        })
      });
      console.log('✅ Agent confirmation email sent successfully');
    } catch (emailError) {
      console.warn('⚠️ Failed to send confirmation email:', emailError);
      // Continue registration even if email fails
    }
    
    return NextResponse.json({ 
      user: data.user,
      message: 'Agent registration successful! Your application is under review. You will receive an email confirmation shortly.' 
    });
  } catch (error: any) {
    console.error('Agent registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}