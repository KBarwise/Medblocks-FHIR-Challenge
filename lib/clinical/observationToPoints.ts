import type { Observation } from '@/lib/fhir/resources';
import { observationLoincCode } from './observations';
import { convertUcum } from './ucum';

export type TrendInterpretation = 'H' | 'L' | 'N' | 'HH' | 'LL' | 'A';

export type TrendPoint = {
  t: number;
  code: string;
  display: string;
  value: number | null;
  unit: string;
  refLow?: number;
  refHigh?: number;
  interpretation?: TrendInterpretation;
  outOfRange: boolean;
  performer?: string;
  encounterId?: string;
  observationId: string;
};

const BP_PANEL = '85354-9';
const BP_SYSTOLIC = '8480-6';
const BP_DIASTOLIC = '8462-4';
const OUT_OF_RANGE_CODES = new Set<TrendInterpretation>(['H', 'L', 'HH', 'LL', 'A']);

function loincFromComponent(
  code: NonNullable<Observation['component']>[number]['code'],
): string | undefined {
  return code?.coding?.find(c => c.system?.includes('loinc.org'))?.code ?? code?.coding?.[0]?.code;
}

function observationTimestamp(obs: Observation): number | undefined {
  const iso =
    obs.effectiveDateTime
    ?? obs.effectivePeriod?.start
    ?? obs.issued;
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : undefined;
}

function parseInterpretation(obs: Observation): TrendInterpretation | undefined {
  const code =
    obs.interpretation?.[0]?.coding?.[0]?.code
    ?? obs.component?.[0]?.interpretation?.[0]?.coding?.[0]?.code;
  if (!code) return undefined;
  if (OUT_OF_RANGE_CODES.has(code as TrendInterpretation)) return code as TrendInterpretation;
  if (code === 'N') return 'N';
  return undefined;
}

function refBounds(obs: Observation): { refLow?: number; refHigh?: number } {
  const range = obs.referenceRange?.[0] ?? obs.component?.[0]?.referenceRange?.[0];
  return {
    refLow: range?.low?.value,
    refHigh: range?.high?.value,
  };
}

function isOutOfRange(
  value: number,
  refLow: number | undefined,
  refHigh: number | undefined,
  interpretation?: TrendInterpretation,
): boolean {
  if (interpretation && OUT_OF_RANGE_CODES.has(interpretation)) return true;
  if (refLow !== undefined && value < refLow) return true;
  if (refHigh !== undefined && value > refHigh) return true;
  return false;
}

function displayFor(obs: Observation, code: string): string {
  return (
    obs.code?.coding?.find(c => c.code === code)?.display
    ?? obs.code?.text
    ?? code
  );
}

function pushQuantityPoint(
  points: TrendPoint[],
  obs: Observation,
  code: string,
  display: string,
  value: number,
  unit: string,
  t: number,
  targetUnit?: string,
) {
  const canonicalUnit = targetUnit ?? unit;
  const converted =
    targetUnit && unit && unit !== targetUnit ? convertUcum(value, unit, targetUnit) : value;
  if (converted === null) {
    console.warn('[trends] UCUM conversion failed', { code, unit, targetUnit, observationId: obs.id });
    return;
  }
  const { refLow, refHigh } = refBounds(obs);
  const interpretation = parseInterpretation(obs);
  points.push({
    t,
    code,
    display,
    value: converted,
    unit: canonicalUnit,
    refLow,
    refHigh,
    interpretation,
    outOfRange: isOutOfRange(converted, refLow, refHigh, interpretation),
    performer: obs.performer?.[0]?.display,
    encounterId: obs.encounter?.reference?.split('/').pop(),
    observationId: obs.id ?? `${code}-${t}`,
  });
}

function expandBloodPressure(obs: Observation, points: TrendPoint[], targetUnit?: string) {
  const t = observationTimestamp(obs);
  if (t === undefined || !obs.component?.length) return;

  for (const comp of obs.component) {
    const code = loincFromComponent(comp.code);
    const value = comp.valueQuantity?.value;
    const unit = comp.valueQuantity?.unit ?? comp.valueQuantity?.code ?? 'mmHg';
    if (!code || value === undefined) continue;
    if (code !== BP_SYSTOLIC && code !== BP_DIASTOLIC) continue;

    const display =
      code === BP_SYSTOLIC ? 'Systolic BP' : 'Diastolic BP';
    const compObs: Observation = {
      ...obs,
      referenceRange: comp.referenceRange ?? obs.referenceRange,
      interpretation: comp.interpretation ?? obs.interpretation,
    };
    pushQuantityPoint(points, compObs, code, display, value, unit, t, targetUnit);
  }
}

export function toPoints(observations: Observation[], targetUnit?: string): TrendPoint[] {
  const points: TrendPoint[] = [];

  for (const obs of observations) {
    if (obs.dataAbsentReason) {
      console.info('[trends] skipped absent value', obs.id, observationLoincCode(obs));
      continue;
    }

    const code = observationLoincCode(obs);
    if (!code) continue;

    const t = observationTimestamp(obs);
    if (t === undefined) continue;

    if (code === BP_PANEL) {
      expandBloodPressure(obs, points, targetUnit);
      continue;
    }

    const value = obs.valueQuantity?.value;
    if (value === undefined) {
      if (!obs.valueCodeableConcept && !obs.valueString) {
        console.info('[trends] skipped non-numeric', obs.id, code);
      }
      continue;
    }

    const unit = obs.valueQuantity?.unit ?? obs.valueQuantity?.code ?? '';
    pushQuantityPoint(points, obs, code, displayFor(obs, code), value, unit, t, targetUnit);
  }

  return points.sort((a, b) => a.t - b.t);
}

export function pointsForCodes(points: TrendPoint[], codes: string[]): TrendPoint[] {
  const set = new Set(codes);
  return points.filter(p => set.has(p.code));
}
