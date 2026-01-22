import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { normalizePhoneNumber } from '@/lib/phoneUtils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { first_name, last_name, email, phone, password } = body;
    if (!first_name || !last_name || !email || !phone || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(phone);

    // Create Supabase Auth user
    const supabase = createAdminClient();
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        first_name,
        last_name,
        phone: normalizedPhone,
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
      phone: normalizedPhone,
      plan: body.plan || null,
    });
    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 400 });
    }
    return NextResponse.json({ user: data.user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
