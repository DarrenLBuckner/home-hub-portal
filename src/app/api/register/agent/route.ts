import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { normalizePhoneNumber } from '@/lib/phoneUtils';
import { getTerritorySignupFlags } from '@/lib/territory-signup-flags';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received agent registration data:', { ...body, password: '[REDACTED]' });

    // ALLOW-LIST: name every field we accept from the client. Anything not
    // named here (tier, price, status, temp_password, country_id, etc.) is
    // dropped on the floor — the server decides what gets stored, not the
    // browser. This is exactly the set the form submits today; when the form
    // grows a field, the form-fields PR adds it here in the same commit.
    // Do NOT reintroduce `...rest` / `...agentData`.
    const {
      // identity / contact
      first_name,
      last_name,
      email,
      phone,
      // credentials — password becomes temp_password; confirm_password is stripped
      password,
      confirm_password, // strip: never persist the confirm value into agent_vetting
      // territory — client-picked and correct; gated below against signup flags.
      // Only `country` is accepted; `country_id` is server-only (see note below).
      country,
      // plan — validated against pricing_plans below before it is stored
      selected_plan,
      // professional details (exactly what the form collects)
      company_name,
      license_number,
      license_type,
      specialties,
      target_region,
      years_experience,
      current_listings,
      // references
      reference1_name,
      reference1_phone,
      reference1_email,
      reference2_name,
      reference2_phone,
      reference2_email,
      // promo — kept exactly as-is: named + defaulted where used below
      promo_code,
      promo_benefits,
      promo_spot_number,
      // stripped: the server forces is_founding_member = false regardless
      is_founding_member,
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

    // Territory gate: block agent signups where the territory disables them.
    // Runs before the agent_vetting row is written. Fails closed.
    const flags = await getTerritorySignupFlags(country);
    if (!flags.agentSignupEnabled) {
      return NextResponse.json(
        { error: 'Agent registration is not available in this territory.' },
        { status: 403 },
      );
    }

    // Plan gate: `selected_plan` is client-supplied and downstream approval
    // provisions tier/max_properties straight from it. The anon key can read
    // every active pricing_plans UUID (RLS: "Anyone can view active pricing
    // plans"), so a crafted POST can point at any active plan — including ones
    // the UI hides. Only accept a plan that is active, for agents, and in the
    // registrant's own territory. Absent → stored NULL (handled at approval).
    if (selected_plan) {
      const { data: plan, error: planLookupError } = await supabase
        .from('pricing_plans')
        .select('id')
        .eq('id', selected_plan)
        .eq('is_active', true)
        .eq('user_type', 'agent')
        .eq('country_id', country)
        .maybeSingle();

      if (planLookupError) {
        console.error('selected_plan validation error:', planLookupError);
        return NextResponse.json(
          { error: 'The selected plan is not available for agent registration in your territory.' },
          { status: 400 },
        );
      }
      if (!plan) {
        return NextResponse.json(
          { error: 'The selected plan is not available for agent registration in your territory.' },
          { status: 400 },
        );
      }
    }

    // DO NOT create user yet - just validate and prepare data
    // User will only be created after application is successfully processed

    // Generate temporary application ID for tracking
    const tempApplicationId = `agent_app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Normalize phone numbers
    const normalizedPhone = normalizePhoneNumber(phone);
    const normalizedRef1 = normalizePhoneNumber(reference1_phone);
    const normalizedRef2 = normalizePhoneNumber(reference2_phone);

    // Store agent application data WITHOUT creating user account yet.
    // Built field-by-field from the allow-list above — no client spread.
    const agentVettingData = {
      // server-controlled identifiers / state — the server always wins on these
      temp_application_id: tempApplicationId,
      user_type: "agent",
      status: "pending_review",
      submitted_at: new Date().toISOString(),
      is_founding_member: false,
      user_created: false, // Flag to track if user account exists yet

      // credentials — sourced ONLY from the named `password` field
      temp_password: password, // Store temporarily - will be used when approved

      // identity / contact
      first_name: first_name,
      last_name: last_name,
      email: email,
      phone: normalizedPhone,

      // territory — client-picked, gated above. `country` only; never country_id.
      country: country,

      // plan — validated above; store NULL when the client sent nothing
      selected_plan: selected_plan ?? null,

      // professional details
      company_name: company_name,
      license_number: license_number,
      license_type: license_type,
      specialties: specialties,
      target_region: target_region,
      years_experience: years_experience,
      current_listings: current_listings,

      // references — store all individual reference data for admin review
      reference1_name: reference1_name,
      reference1_phone: normalizedRef1,
      reference1_email: reference1_email,
      reference2_name: reference2_name,
      reference2_phone: normalizedRef2,
      reference2_email: reference2_email,

      // promo — unchanged handling
      promo_code: promo_code || null,
      promo_benefits: promo_benefits ? JSON.stringify(promo_benefits) : null,
      promo_spot_number: promo_spot_number || null,
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
          country: country || 'GY',
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
      console.log('📧 Sending notification to Owner Admin for territory:', country || 'GY');

      const notificationResponse = await fetch(`${baseUrl}/api/send-agent-application-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          phone: normalizedPhone,
          company_name: company_name,
          years_experience: years_experience,
          specialties: specialties,
          target_region: target_region,
          selected_plan: selected_plan,
          is_founding_member: false,
          reference1_name: reference1_name,
          reference1_phone: normalizedRef1,
          reference1_email: reference1_email,
          reference2_name: reference2_name,
          reference2_phone: normalizedRef2,
          reference2_email: reference2_email,
          submitted_at: new Date().toISOString(),
          country: country || 'GY'
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
