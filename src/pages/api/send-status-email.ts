import { NextApiRequest, NextApiResponse } from "next";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, name, status, note, paymentLink } = req.body;

  if (!email || !name || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let subject = "Welcome to Portal Home Hub – Your Application Update";
  let body = `
    <div style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px; border-radius: 12px; color: #222;">
  <h2 style="color: #14b8a6; margin-bottom: 8px;">Welcome to Portal Home Hub!</h2>
      <p style="font-size: 18px; margin-bottom: 16px;">Hi ${name},</p>
      <p style="font-size: 16px; margin-bottom: 16px;">
        We're excited to have you join our vibrant Caribbean property community.<br />
        <strong>Your application status:</strong> <span style="color: #f59e42; font-weight: bold;">${status.replace('_', ' ').toUpperCase()}</span>
      </p>
      ${note ? `<div style="background: #fffbe6; border-left: 4px solid #f59e42; padding: 12px; margin-bottom: 16px;"><strong>Admin Note:</strong> ${note}</div>` : ''}
      ${status === "approved" && paymentLink ? `
        <div style="margin-bottom: 24px;">
          <a href="${paymentLink}" style="display: inline-block; background: linear-gradient(90deg, #14b8a6, #f59e42); color: #fff; font-weight: bold; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 18px; box-shadow: 0 2px 8px rgba(20,184,166,0.12);">Complete Your Free Trial & Get Started</a>
        </div>
        <p style="font-size: 16px; margin-bottom: 16px;">Your free trial is active. Explore listings, connect, and grow your business!</p>
      ` : ''}
      <p style="font-size: 16px; margin-bottom: 16px;">If you have any questions, reply to this email or contact our support team. We're here to help you succeed!</p>
      <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
  <p style="font-size: 14px; color: #888;">Thank you for choosing Portal Home Hub.<br />
      <span style="color: #14b8a6; font-weight: bold;">Your Caribbean Real Estate Partner</span></p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "no-reply@guyanahomehub.com",
      to: email,
      subject,
      text: body,
    });
    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to send email" });
  }
}
