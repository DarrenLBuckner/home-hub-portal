import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received registration data:', { ...body, password: '[REDACTED]' });
    const { first_name, last_name, email, phone, password, promo_code, promo_benefits, promo_spot_number, is_founding_member } = body;
    
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
    
    // DO NOT create user yet - just validate and return temp registration data
    // User will only be created after payment/plan confirmation is complete
    const tempRegistrationId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({ 
      success: true,
      tempRegistrationId,
      registrationData: {
        first_name,
        last_name,
        email,
        phone,
        password,
        promo_code,
        promo_benefits,
        promo_spot_number,
        is_founding_member
      },
      message: 'Registration data validated successfully. Complete your plan selection to finish registration.'
    });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
