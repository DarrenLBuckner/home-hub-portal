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
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Check if email already exists in auth system before proceeding
    const supabase = createAdminClient();
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers.users?.some(user => user.email === email);
    
    if (emailExists) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 400 });
    }
    
    // Validate password requirements
    if (password.length < 8 || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return NextResponse.json({ error: 'Password must be at least 8 characters with at least one special character' }, { status: 400 });
    }

    // DO NOT create user yet - just validate and prepare data
    // User will only be created after application is successfully processed

    // Generate temporary application ID for tracking
    const tempApplicationId = `agent_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store agent application data WITHOUT creating user account yet
    const agentVettingData = {
      temp_application_id: tempApplicationId,
      email: email,
      first_name: first_name,
      last_name: last_name,
      phone: phone,
      temp_password: password, // Store temporarily - will be used when approved
      ...agentData,
      user_type: "agent",
      status: "pending_review",
      submitted_at: new Date().toISOString(),
      promo_code: promo_code,
      promo_benefits: promo_benefits ? JSON.stringify(promo_benefits) : null,
      promo_spot_number: promo_spot_number,
      is_founding_member: !!promo_code,
      user_created: false // Flag to track if user account exists yet
    };

    const { error: vettingError } = await supabase
      .from("agent_vetting")
      .insert(agentVettingData);

    if (vettingError) {
      console.error('Agent vetting insert error:', vettingError);
      return NextResponse.json({ error: 'Failed to save agent application: ' + vettingError.message }, { status: 500 });
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
      tempApplicationId,
      message: 'Agent application submitted successfully! Your application is under review. You will receive an email confirmation shortly.',
      note: 'Your user account will be created when your application is approved.'
    });
  } catch (error: any) {
    console.error('Agent registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}