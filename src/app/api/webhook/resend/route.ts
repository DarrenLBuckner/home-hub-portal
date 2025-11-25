import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    
    // Verify webhook signature if secret is configured
    const signature = request.headers.get('resend-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    
    let webhook;
    
    if (webhookSecret && signature) {
      const body = await request.text();
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');
      
      if (signature !== expectedSignature) {
        console.error('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      
      webhook = JSON.parse(body);
    } else {
      webhook = await request.json();
    }
    
    console.log('Resend webhook received:', JSON.stringify(webhook, null, 2));

    // Handle different webhook events
    switch (webhook.type) {
      case 'email.bounced':
      case 'email.complained':
      case 'email.delivery_delayed':
        await handleEmailFailure(webhook, supabase);
        break;
      
      case 'email.delivered':
        await handleEmailSuccess(webhook, supabase);
        break;
      
      case 'email.opened':
        await handleEmailOpened(webhook, supabase);
        break;
      
      default:
        console.log('Unhandled webhook type:', webhook.type);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Resend webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleEmailFailure(webhook: any, supabase: any) {
  const { data, type } = webhook;
  
  // Store the bounce/complaint/delay in database
  const { error } = await supabase
    .from('email_events')
    .insert({
      email_id: data.email_id,
      recipient: data.to?.[0] || data.email?.to?.[0] || 'unknown',
      event_type: type,
      reason: data.reason || data.feedback?.complaintType || 'unknown',
      subject: data.subject || data.email?.subject || '',
      created_at: new Date().toISOString(),
      metadata: data
    });

  if (error) {
    console.error('Failed to store email event:', error);
  } else {
    console.log(`✅ Stored ${type} event for ${data.to?.[0] || data.email?.to?.[0]}`);
  }
}

async function handleEmailSuccess(webhook: any, supabase: any) {
  const { data } = webhook;
  
  const { error } = await supabase
    .from('email_events')
    .insert({
      email_id: data.email_id,
      recipient: data.to?.[0] || 'unknown',
      event_type: 'email.delivered',
      reason: 'delivered',
      subject: data.subject || '',
      created_at: new Date().toISOString(),
      metadata: data
    });

  if (error) {
    console.error('Failed to store delivery event:', error);
  }
}

async function handleEmailOpened(webhook: any, supabase: any) {
  const { data } = webhook;
  
  const { error } = await supabase
    .from('email_events')
    .insert({
      email_id: data.email_id,
      recipient: data.email?.to?.[0] || 'unknown',
      event_type: 'email.opened',
      reason: 'opened',
      subject: data.email?.subject || '',
      created_at: new Date().toISOString(),
      metadata: data
    });

  if (error) {
    console.error('Failed to store open event:', error);
  }
}