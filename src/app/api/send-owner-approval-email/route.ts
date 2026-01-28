import { NextResponse } from 'next/server';
import { sendOwnerApprovalEmail } from '@/lib/email.js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, userType, isFoundingMember, countryId } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Map country ID to country name
    const countryName = countryId === 'JM' ? 'Jamaica' : 'Guyana';

    console.log('📧 Sending owner approval email to:', email);

    await sendOwnerApprovalEmail({
      to: email,
      firstName: firstName || 'User',
      userType: userType || 'owner',
      isFoundingMember: isFoundingMember || false,
      trialDays: isFoundingMember ? 60 : null,
      propertyLimit: isFoundingMember ? 1 : null,
      countryName
    });

    console.log('✅ Owner approval email sent successfully');

    return NextResponse.json({ success: true, message: 'Approval email sent' });
  } catch (error: any) {
    console.error('❌ Error sending owner approval email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
