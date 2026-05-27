import { NextRequest, NextResponse } from 'next/server';
import { expandValueSet } from '@/lib/terminology/snowstorm';
import { VALUE_SETS } from '@/lib/valuesets';

export const runtime = 'nodejs';

/**
 * GET /api/terminology/expand?id=glp1-cautions
 * GET /api/terminology/expand?ecl=<<255032005&filter=men
 *
 * Returns a flat list of { code, system, display } concepts.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get('id');
  const ecl = sp.get('ecl') ?? undefined;
  const filter = sp.get('filter') ?? undefined;
  const count = sp.get('count') ? Number(sp.get('count')) : 100;

  try {
    let concepts;
    if (id && id in VALUE_SETS) {
      const vs = VALUE_SETS[id as keyof typeof VALUE_SETS];
      concepts = await expandValueSet('', { ecl: vs.ecl, filter, count });
    } else if (ecl) {
      concepts = await expandValueSet('', { ecl, filter, count });
    } else if (id) {
      concepts = await expandValueSet(id, { filter, count });
    } else {
      return NextResponse.json({ error: 'id or ecl is required' }, { status: 400 });
    }
    return NextResponse.json({ concepts });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
