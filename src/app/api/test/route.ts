import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: "Portal Home Hub is working!",
    timestamp: new Date().toISOString(),
    status: "ok"
  });
}