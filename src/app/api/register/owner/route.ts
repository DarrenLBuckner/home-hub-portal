import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { FEATURE_FLAGS, isPaymentRequired, getBetaExpiryDate } from '@/lib/config/featureFlags';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone, password } = body;
    if (!first_name || !last_name || !email || !phone || !password) {
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
    if (authError || !data?.user?.id) {
      return NextResponse.json({ error: authError?.message || 'Auth user creation failed' }, { status: 400 });
    }
    // Insert into owners table
    const { error: dbError } = await supabase.from('owners').insert({
      auth_user_id: data.user.id,
      first_name,
      last_name,
      email,
      phone,
      plan: body.plan || null,
    });
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }
    
    const userId = data.user.id;
    
    if (!isPaymentRequired()) {
      await supabase.from('profiles').update({
        subscription_status: 'active',
        subscription_plan: 'beta_free',
        subscription_expires: getBetaExpiryDate('owner'),
        beta_user: true
      }).eq('id', userId);
      
      return NextResponse.json({ 
        success: true, 
        userId,
        redirectTo: '/dashboard/owner',
        skipPayment: true,
        message: 'Welcome to Portal Home Hub Beta! Free access until February 28, 2025'
      });
    }
    
    // Original return for when payment is required
    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
