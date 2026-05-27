import { NextRequest, NextResponse } from 'next/server';
import { fhir } from '@/lib/fhir/client';
import { evaluateSignals, splitBundle } from '@/lib/signals/rules';
import type { Bundle, Condition, Observation } from '@/lib/fhir/resources';

export const runtime = 'nodejs';

/**
 * GET /api/signals/[patientId]
 *
 * Pulls Observations and Conditions for the patient and runs the rule
 * engine. Returns structured signals. Persisting signals as Flag
 * resources can be enabled by setting persist=1.
 */
export async function GET(_req: NextRequest, ctx: { params: { patientId: string } }) {
  const { patientId } = ctx.params;
  try {
    const [obsBundle, condBundle] = await Promise.all([
      fhir.search<Bundle<Observation>>('Observation', {
        patient: patientId,
        _count: 200,
        _sort: '-date',
      }),
      fhir.search<Bundle<Condition>>('Condition', {
        patient: patientId,
        _count: 100,
      }),
    ]);
    const observations = splitBundle<Observation>(obsBundle as Bundle, 'Observation');
    const conditions = splitBundle<Condition>(condBundle as Bundle, 'Condition');
    const signals = evaluateSignals({ observations, conditions });
    return NextResponse.json({ signals, evaluatedAt: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
