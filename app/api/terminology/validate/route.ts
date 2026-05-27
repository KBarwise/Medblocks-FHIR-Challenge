import { NextRequest, NextResponse } from 'next/server';
import { validateCode } from '@/lib/terminology/snowstorm';

export const runtime = 'nodejs';

/** POST /api/terminology/validate { system, code, display?, url? } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await validateCode(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
