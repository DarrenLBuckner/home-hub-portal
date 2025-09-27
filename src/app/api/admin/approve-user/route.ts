import { NextResponse } from 'next/server';
import { createAdminClient } from '@/supabase-admin';
import { checkAdminAccess } from '@/lib/auth/adminCheck';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, reason, notes } = body;

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and action' }, 
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' }, 
        { status: 400 }
      );
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' }, 
        { status: 400 }
      );
    }

    // Verify admin access
    const supabase = createAdminClient();
    const { data: { user: adminUser } } = await supabase.auth.getUser();

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await checkAdminAccess(adminUser.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get user details for email
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('first_name, last_name, user_type')
      .eq('id', userId)
      .single();

    if (userError || !userProfile) {
      return NextResponse.json(
        { error: 'User not found' }, 
        { status: 404 }
      );
    }

    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' }, 
        { status: 404 }
      );
    }

    // Update user approval status
    if (action === 'approve') {
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({
          approval_status: 'approved',
          approval_date: new Date().toISOString(),
          approved_by: adminUser.id,
          approval_notes: notes || null,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user approval status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update approval status' }, 
          { status: 500 }
        );
      }
    } else {
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({
          approval_status: 'rejected',
          approval_date: new Date().toISOString(),
          approved_by: adminUser.id,
          approval_notes: notes || null,
          rejection_reason: reason,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user approval status:', updateError);
        return NextResponse.json(
          { error: 'Failed to update approval status' }, 
          { status: 500 }
        );
      }
    }

    // Send email notification
    try {
      await sendApprovalEmail({
        email: userEmail,
        firstName: (userProfile as any).first_name || '',
        lastName: (userProfile as any).last_name || '',
        action,
        reason: reason || undefined,
        notes: notes || undefined,
      });
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the approval if email fails, just log it
    }

    return NextResponse.json({ 
      success: true, 
      message: `User ${action}d successfully` 
    });

  } catch (error) {
    console.error('Error processing user approval:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

async function sendApprovalEmail({
  email,
  firstName,
  lastName,
  action,
  reason,
  notes,
}: {
  email: string;
  firstName: string;
  lastName: string;
  action: 'approve' | 'reject';
  reason?: string;
  notes?: string;
}) {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject = action === 'approve' 
    ? 'Welcome to Portal Home Hub - Account Approved!'
    : 'Portal Home Hub Registration Update';

  const htmlContent = action === 'approve' ? `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Account Approved!</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Dear ${firstName} ${lastName},</p>
        
        <p>Great news! Your Portal Home Hub account has been approved and is now active.</p>
        
        <p><strong>What you can do now:</strong></p>
        <ul>
          <li>Log in to your dashboard</li>
          <li>Create and manage property listings</li>
          <li>Access all portal features</li>
        </ul>
        
        ${notes ? `<p><strong>Note from our team:</strong> ${notes}</p>` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Login to Your Dashboard
          </a>
        </div>
        
        <p>Welcome to Portal Home Hub!</p>
        
        <p>Best regards,<br>
        The Portal Home Hub Team</p>
      </div>
    </div>
  ` : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Registration Update</h1>
      </div>
      
      <div style="padding: 20px;">
        <p>Dear ${firstName} ${lastName},</p>
        
        <p>Thank you for your interest in Portal Home Hub. After reviewing your application, we are unable to approve your account at this time.</p>
        
        <p><strong>Reason:</strong> ${reason}</p>
        
        ${notes ? `<p><strong>Additional notes:</strong> ${notes}</p>` : ''}
        
        <p>If you have any questions or would like to reapply in the future, please feel free to contact our support team.</p>
        
        <p>Thank you for your understanding.</p>
        
        <p>Best regards,<br>
        The Portal Home Hub Team</p>
      </div>
    </div>
  `;

  await resend.emails.send({
    from: 'Portal Home Hub <noreply@portalhomehub.com>',
    to: email,
    subject,
    html: htmlContent,
  });
}