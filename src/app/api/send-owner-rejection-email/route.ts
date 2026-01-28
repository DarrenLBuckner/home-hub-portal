import { NextResponse } from 'next/server';
import { sendOwnerRejectionEmail, sendOwnerCorrectionEmail } from '@/lib/email.js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, userType, rejectionType, reason, countryId } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!rejectionType) {
      return NextResponse.json({ error: 'Rejection type is required' }, { status: 400 });
    }

    // Map country ID to country name
    const countryName = countryId === 'JM' ? 'Jamaica' : 'Guyana';

    console.log(`📧 Sending owner ${rejectionType} email to:`, email);

    if (rejectionType === 'permanent') {
      // Send permanent rejection email
      await sendOwnerRejectionEmail({
        to: email,
        firstName: firstName || 'User',
        userType: userType || 'owner',
        reason: reason || 'Your application did not meet our platform requirements.',
        countryName
      });
    } else {
      // Send needs correction email
      await sendOwnerCorrectionEmail({
        to: email,
        firstName: firstName || 'User',
        userType: userType || 'owner',
        reason: reason || 'Please update the required information.',
        countryName
      });
    }

    console.log(`✅ Owner ${rejectionType} email sent successfully`);

    return NextResponse.json({
      success: true,
      message: `${rejectionType === 'permanent' ? 'Rejection' : 'Correction'} email sent`
    });
  } catch (error: any) {
    console.error('❌ Error sending owner rejection email:', error);
    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
