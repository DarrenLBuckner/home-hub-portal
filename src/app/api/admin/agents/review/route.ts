import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createAdminClient } from '@/supabase-admin';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'Portal Home Hub <agents@portalhomehub.com>';

// POST: Approve or reject an agent from the agents table
export async function POST(request: NextRequest) {
  try {
    const { agentId, action, rejectionReason } = await request.json();

    if (!agentId || !action) {
      return NextResponse.json({ error: 'Missing agentId or action' }, { status: 400 });
    }

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Action must be approve or reject' }, { status: 400 });
    }

    if (action === 'reject' && !rejectionReason?.trim()) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch the agent record
    const { data: agent, error: fetchErr } = await supabase
      .from('agents')
      .select('id, email, full_name, display_name, is_published')
      .eq('id', agentId)
      .single();

    if (fetchErr || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const agentName = agent.display_name || agent.full_name || 'Agent';

    if (action === 'approve') {
      // Set is_published = true
      const { error: updateErr } = await supabase
        .from('agents')
        .update({ is_published: true })
        .eq('id', agentId);

      if (updateErr) throw updateErr;

      // Send approval email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">&#x2705; Your Agent Profile is Live!</h2>

          <p>Hello ${agentName},</p>

          <p>Great news! Your agent profile on Guyana Home Hub has been reviewed and approved. Your profile is now visible to diaspora buyers in New York, Toronto, London, and around the world.</p>

          <div style="background: #f0fdf4; border-left: 4px solid #059669; padding: 20px; margin: 20px 0;">
            <h3 style="color: #047857; margin-top: 0;">What This Means:</h3>
            <ul style="margin: 10px 0;">
              <li>Your profile is now <strong>live and searchable</strong> by buyers</li>
              <li>Buyers can view your specializations, track record, and contact details</li>
              <li>You may start receiving inquiries directly</li>
            </ul>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1d4ed8; margin-top: 0;">Next Steps:</h3>
            <ul>
              <li>Review your published profile to make sure everything looks right</li>
              <li>Keep your contact information up to date</li>
              <li>Respond promptly to buyer inquiries</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://portalhomehub.com/agents/join"
               style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Update Your Profile
            </a>
          </div>

          <p>Thank you for being part of the Guyana Home Hub agent network!</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Portal Home Hub Agent Review Team</strong><br>
            Email: agents@portalhomehub.com<br>
            Website: <a href="https://portalhomehub.com">portalhomehub.com</a><br>
            Guyana Office: +592-762-9797
          </p>
        </div>
      `;

      try {
        const result = await resend.emails.send({
          from: FROM_EMAIL,
          to: [agent.email],
          subject: `Your agent profile is live on Guyana Home Hub`,
          html: emailHtml,
        });

        if (result.error) {
          console.error('Approval email error:', result.error);
        }
      } catch (emailErr) {
        console.error('Failed to send approval email:', emailErr);
        // Don't fail the approval if email fails
      }

      return NextResponse.json({ success: true, action: 'approved' });
    }

    // Reject: save reason to differentiation_flags, keep is_published = false
    if (action === 'reject') {
      const { error: updateErr } = await supabase
        .from('agents')
        .update({
          is_published: false,
          differentiation_flags: rejectionReason.trim(),
        })
        .eq('id', agentId);

      if (updateErr) throw updateErr;

      // Send rejection/needs-info email
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">&#x1F4DD; Agent Profile — Action Required</h2>

          <p>Hello ${agentName},</p>

          <p>Thank you for submitting your agent profile to Guyana Home Hub.</p>

          <p>After reviewing your profile, our team has identified a few items that need attention before we can publish it:</p>

          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Review Feedback:</h3>
            <div style="white-space: pre-line; line-height: 1.6; background: white; padding: 15px; border-radius: 6px;">
${rejectionReason.trim()}
            </div>
          </div>

          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #0ea5e9; margin-top: 0;">How to Update:</h3>
            <ol>
              <li>Visit the agent profile page and enter your email</li>
              <li>Your existing draft will be restored</li>
              <li>Make the requested changes</li>
              <li>Re-submit your profile</li>
            </ol>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://portalhomehub.com/agents/join"
               style="background: #0ea5e9; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
              Update Your Profile
            </a>
          </div>

          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <p style="margin: 0;"><strong>This is not a rejection.</strong> We simply need a few updates to ensure your profile meets our standards and makes the best impression on potential clients.</p>
          </div>

          <p>If you have any questions, contact us at agents@portalhomehub.com.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            <strong>Portal Home Hub Agent Review Team</strong><br>
            Email: agents@portalhomehub.com<br>
            Website: <a href="https://portalhomehub.com">portalhomehub.com</a><br>
            Guyana Office: +592-762-9797
          </p>
        </div>
      `;

      try {
        const result = await resend.emails.send({
          from: FROM_EMAIL,
          to: [agent.email],
          subject: `Agent Profile — Action Required`,
          html: emailHtml,
        });

        if (result.error) {
          console.error('Rejection email error:', result.error);
        }
      } catch (emailErr) {
        console.error('Failed to send rejection email:', emailErr);
      }

      return NextResponse.json({ success: true, action: 'rejected' });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Agent review error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
