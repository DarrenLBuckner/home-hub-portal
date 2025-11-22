import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Get the site parameter from the request URL
  const { searchParams } = new URL(request.url);
  const site = searchParams.get('site');
  
  // Determine the portal URL - use environment variable or default
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || "https://www.portalhomehub.com";
  
  // Create the redirect URL with the site parameter
  let redirectUrl = `${portalUrl}/login`;
  
  // Only append site parameter for valid live markets (Jamaica & Guyana)
  if (site && ['jamaica', 'guyana'].includes(site.toLowerCase())) {
    redirectUrl += `?site=${site.toLowerCase()}`;
  }
  
  return NextResponse.redirect(redirectUrl, { status: 302 });
}