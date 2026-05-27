import { NextRequest, NextResponse } from 'next/server';
import { fhir, FhirError } from '@/lib/fhir/client';

export const runtime = 'nodejs';

/**
 * Generic FHIR proxy. Forwards GET, POST, PUT, DELETE under /api/fhir/*
 * to the configured FHIR_BASE_URL with bearer auth attached server-side.
 *
 * The browser never sees the FHIR base URL or the bearer token.
 *
 * In production, gate this by clinician session and enforce SMART scopes
 * before allowing the forward. Also emit an AuditEvent on every write.
 */

function path(req: NextRequest, params: { path?: string[] }) {
  const p = (params.path ?? []).join('/');
  const qs = req.nextUrl.search;
  return `/${p}${qs}`;
}

async function forward(req: NextRequest, method: 'GET' | 'POST' | 'PUT' | 'DELETE', params: { path?: string[] }) {
  try {
    const body = method === 'GET' || method === 'DELETE' ? undefined : await req.json();
    const data = await fhir.raw(path(req, params), { method, body, revalidate: false });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof FhirError) {
      return NextResponse.json(err.outcome ?? { error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function GET(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return forward(req, 'GET', ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return forward(req, 'POST', ctx.params);
}
export async function PUT(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return forward(req, 'PUT', ctx.params);
}
export async function DELETE(req: NextRequest, ctx: { params: { path?: string[] } }) {
  return forward(req, 'DELETE', ctx.params);
}
