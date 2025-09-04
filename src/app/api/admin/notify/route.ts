import { NextRequest, NextResponse } from "next/server";
import { sendPropertyApprovalEmail, sendPropertyRejectionEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const { to, propertyTitle, action } = await req.json();
  try {
    if (action === "approve") {
      await sendPropertyApprovalEmail({ to, propertyTitle });
    } else {
      await sendPropertyRejectionEmail({ to, propertyTitle });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to send email" }, { status: 500 });
  }
}
