import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

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

    // Normalize phone numbers
    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedRef1 = normalizePhoneNumber(agentData.reference1_phone || agentData.reference1_contact);
    const normalizedRef2 = normalizePhoneNumber(agentData.reference2_phone || agentData.reference2_contact);

    // Store agent application data WITHOUT creating user account yet
    const agentVettingData = {
      temp_application_id: tempApplicationId,
      email: email,
      first_name: first_name,
      last_name: last_name,
      phone: normalizedPhone,
      temp_password: password, // Store temporarily - will be used when approved
      ...agentData,
      user_type: "agent",
      status: "pending_review",
      submitted_at: new Date().toISOString(),
      promo_code: promo_code,
      promo_benefits: promo_benefits ? JSON.stringify(promo_benefits) : null,
      promo_spot_number: promo_spot_number,
      is_founding_member: !!promo_code,
      user_created: false, // Flag to track if user account exists yet

      // Reference fields - normalized phone numbers
      reference1_contact: normalizedRef1 || agentData.reference1_name,
      reference2_contact: normalizedRef2 || agentData.reference2_name,
    };

    const { error: vettingError } = await supabase
      .from("agent_vetting")
      .insert(agentVettingData);

    if (vettingError) {
      console.error('Agent vetting insert error:', vettingError);
      return NextResponse.json({ error: 'Failed to save agent application: ' + vettingError.message }, { status: 500 });
    }

    // Send confirmation email to applicant AND notification to Owner Admin
    // Use 127.0.0.1 instead of localhost for server-to-server calls on Windows
    // localhost can have IPv6 resolution issues causing ECONNREFUSED
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL?.startsWith('http')
      ? process.env.NEXT_PUBLIC_FRONTEND_URL
      : 'http://127.0.0.1:3000';

    // Send confirmation email to the applicant
    try {
      console.log('📧 Sending confirmation email to:', email, 'via:', `${baseUrl}/api/send-agent-confirmation-email`);

      const emailResponse = await fetch(`${baseUrl}/api/send-agent-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentEmail: email,
          agentName: `${first_name} ${last_name}`.trim(),
          country: agentData.country || 'GY',
          submittedAt: new Date().toLocaleDateString()
        })
      });

      const emailResult = await emailResponse.json();

      if (emailResponse.ok && emailResult.success) {
        console.log('✅ Agent confirmation email sent successfully');
      } else {
        console.warn('⚠️ Email API returned error:', emailResult.error || emailResult.message);
      }
    } catch (emailError) {
      console.error('❌ Failed to send confirmation email:', emailError);
      // Continue registration even if email fails
    }

    // Send notification email to Owner Admin for the territory
    try {
      console.log('📧 Sending notification to Owner Admin for territory:', agentData.country || 'GY');

      const notificationResponse = await fetch(`${baseUrl}/api/send-agent-application-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          phone: normalizedPhone,
          company_name: agentData.company_name,
          years_experience: agentData.years_experience,
          specialties: agentData.specialties,
          target_region: agentData.target_region,
          selected_plan: agentData.selected_plan,
          is_founding_member: !!promo_code,
          reference1_name: agentData.reference1_name,
          reference1_phone: normalizedRef1,
          reference1_email: agentData.reference1_email,
          reference2_name: agentData.reference2_name,
          reference2_phone: normalizedRef2,
          reference2_email: agentData.reference2_email,
          submitted_at: new Date().toISOString(),
          country: agentData.country || 'GY'
        })
      });

      const notificationResult = await notificationResponse.json();

      if (notificationResponse.ok && notificationResult.success) {
        console.log('✅ Owner Admin notification email sent successfully');
      } else {
        console.warn('⚠️ Owner Admin notification:', notificationResult.message || 'Not sent');
      }
    } catch (notificationError) {
      console.error('❌ Failed to send Owner Admin notification:', notificationError);
      // Continue registration even if notification fails
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