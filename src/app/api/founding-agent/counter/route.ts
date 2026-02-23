import { createServiceRoleClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Founding Agent program is closed for Guyana (26 agents enrolled).
  // Return programClosed so UI components can handle accordingly.
  return NextResponse.json({
    success: true,
    spotsRemaining: 0,
    programClosed: true
  });
}