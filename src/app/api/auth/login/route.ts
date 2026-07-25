import { NextResponse } from 'next/server';
export async function POST() {
  return NextResponse.json({ error: 'Use /api/auth/supabase-login.' }, { status: 410 });
}
