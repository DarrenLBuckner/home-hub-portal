import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { supabase } from '@/supabase';

// Bank details configuration for Guyana
const BANK_DETAILS = {
  bank_name: "Republic Bank (Guyana) Limited",
  account_name: "Portal Home Hub Ltd",
  account_number: "123-456-789", // TODO: Replace with actual account
  branch: "Main Branch Georgetown",
  routing_number: "123456", // TODO: Replace with actual routing number
  swift_code: "RBGYGYGE", // Example SWIFT code for Republic Bank Guyana
  bank_address: "Main & Water Streets, Georgetown, Guyana",
  payment_instructions: [
    "Include your reference code in the transfer description/memo field",
    "Transfer the exact amount shown",
    "Payment expires in 24 hours",
    "Contact support if you need assistance"
  ]
};

interface CreateBankTransferRequest {
  amount_gyd: number;
  plan_type: string;
  plan_id?: string;
  property_id?: string;
  user_notes?: string;
}

export async function POST(request: Request) {
  try {
    const body: CreateBankTransferRequest = await request.json();
    const { amount_gyd, plan_type, plan_id, property_id, user_notes } = body;

    // Validate required fields
    if (!amount_gyd || !plan_type) {
      return NextResponse.json(
        { error: 'Missing required fields: amount_gyd, plan_type' }, 
        { status: 400 }
      );
    }

    // Validate amount
    if (amount_gyd <= 0 || amount_gyd > 50000000) { // Max 500,000 GYD
      return NextResponse.json(
        { error: 'Invalid amount. Must be between G$1 and G$500,000' }, 
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user profile to validate user exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, user_type')
      .eq('id', authUser.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const adminSupabase = createAdminClient();

    // Generate unique payment reference code
    const { data: referenceResult, error: referenceError } = await adminSupabase
      .rpc('generate_payment_reference_code');

    if (referenceError || !referenceResult) {
      console.error('Failed to generate reference code:', referenceError);
      return NextResponse.json(
        { error: 'Failed to generate payment reference' }, 
        { status: 500 }
      );
    }

    const referenceCode = referenceResult;
    const expiryTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    const amountUsd = Math.round(amount_gyd / 210 * 100); // Convert to USD cents

    // Insert payment reference record
    const { data: paymentRef, error: paymentRefError } = await adminSupabase
      .from('payment_references')
      .insert({
        reference_code: referenceCode,
        user_id: authUser.id,
        amount_gyd: amount_gyd,
        amount_usd: amountUsd,
        plan_type: plan_type,
        status: 'pending',
        expires_at: expiryTime.toISOString(),
        notes: user_notes || null
      })
      .select()
      .single();

    if (paymentRefError) {
      console.error('Failed to create payment reference:', paymentRefError);
      return NextResponse.json(
        { error: 'Failed to create payment reference' }, 
        { status: 500 }
      );
    }

    // Create payment history record
    const { error: historyError } = await adminSupabase
      .from('payment_history')
      .insert({
        user_id: authUser.id,
        payment_method: 'bank_transfer',
        external_transaction_id: referenceCode,
        internal_reference_code: referenceCode,
        amount_gyd: amount_gyd,
        amount_usd: amountUsd,
        exchange_rate: 210, // TODO: Use dynamic exchange rate
        net_amount_gyd: amount_gyd,
        payment_type: getPaymentType(plan_type),
        plan_id: plan_id || null,
        property_id: property_id || null,
        status: 'pending',
        description: `Bank transfer payment for ${plan_type} plan`,
        customer_notes: user_notes || null,
        bank_reference_code: referenceCode,
        bank_name: BANK_DETAILS.bank_name
      });

    if (historyError) {
      console.error('Failed to create payment history:', historyError);
      // Don't fail the request if history logging fails
    }

    // Return payment details
    const response = {
      reference_code: referenceCode,
      amount_gyd: amount_gyd,
      amount_display: formatGYD(amount_gyd),
      plan_type: plan_type,
      expires_at: expiryTime.toISOString(),
      expires_in_hours: 24,
      bank_details: {
        ...BANK_DETAILS,
        reference_code: referenceCode
      },
      payment_instructions: [
        `Transfer exactly ${formatGYD(amount_gyd)} to the account below`,
        `Use reference code: ${referenceCode}`,
        ...BANK_DETAILS.payment_instructions
      ],
      user_info: {
        name: `${profile.first_name} ${profile.last_name}`,
        user_type: profile.user_type
      }
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Bank transfer payment creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve existing payment reference
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const referenceCode = url.searchParams.get('reference_code');

    if (!referenceCode) {
      return NextResponse.json(
        { error: 'Missing reference_code parameter' }, 
        { status: 400 }
      );
    }

    // Get authenticated user
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Get payment reference
    const { data: paymentRef, error: paymentRefError } = await adminSupabase
      .from('payment_references')
      .select(`
        *,
        profiles:user_id (
          first_name,
          last_name,
          user_type
        )
      `)
      .eq('reference_code', referenceCode)
      .eq('user_id', authUser.id) // Ensure user owns this reference
      .single();

    if (paymentRefError || !paymentRef) {
      return NextResponse.json(
        { error: 'Payment reference not found' }, 
        { status: 404 }
      );
    }

    // Check if expired
    const isExpired = new Date() > new Date(paymentRef.expires_at);
    const status = isExpired ? 'expired' : paymentRef.status;

    // Update status if expired
    if (isExpired && paymentRef.status === 'pending') {
      await adminSupabase
        .from('payment_references')
        .update({ status: 'expired' })
        .eq('id', paymentRef.id);
    }

    const response = {
      reference_code: paymentRef.reference_code,
      amount_gyd: paymentRef.amount_gyd,
      amount_display: formatGYD(paymentRef.amount_gyd),
      plan_type: paymentRef.plan_type,
      status: status,
      expires_at: paymentRef.expires_at,
      is_expired: isExpired,
      bank_details: {
        ...BANK_DETAILS,
        reference_code: paymentRef.reference_code
      },
      payment_instructions: [
        `Transfer exactly ${formatGYD(paymentRef.amount_gyd)} to the account below`,
        `Use reference code: ${paymentRef.reference_code}`,
        ...BANK_DETAILS.payment_instructions
      ],
      user_info: {
        name: `${paymentRef.profiles.first_name} ${paymentRef.profiles.last_name}`,
        user_type: paymentRef.profiles.user_type
      },
      created_at: paymentRef.created_at,
      verified_at: paymentRef.verified_at
    };

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Bank transfer payment retrieval error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Helper functions
function getPaymentType(planType: string): string {
  if (planType.includes('subscription') || planType.includes('monthly') || planType.includes('yearly')) {
    return 'subscription';
  }
  if (planType.includes('property') || planType.includes('listing')) {
    return 'property_listing';
  }
  if (planType.includes('featured')) {
    return 'featured_upgrade';
  }
  return 'subscription'; // Default
}

function formatGYD(amount: number): string {
  return `G$${amount.toLocaleString()}`;
}