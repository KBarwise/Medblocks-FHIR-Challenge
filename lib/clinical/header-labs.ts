import type { Observation } from '@/lib/fhir/resources';
import { HEADER_LABS } from './lab-catalog';
import { metricDelta, latestObservation } from './observations';

export type HeaderLabAlert = {
  label: string;
  value: string;
  tone: 'warning' | 'danger';
  detail?: string;
};

export type HeaderCholesterol = {
  current: number;
  unit: string;
  delta?: number;
  pctChange?: number;
};

export function getHeaderCholesterol(observations: Observation[]): HeaderCholesterol | null {
  const m = metricDelta(observations, HEADER_LABS.totalCholesterol.code);
  if (m.current === undefined || m.delta === undefined) return null;
  return {
    current: m.current,
    unit: m.unit ?? HEADER_LABS.totalCholesterol.unit,
    delta: m.delta,
    pctChange: m.pctChange,
  };
}

export function getHeaderConcerningLabs(observations: Observation[]): HeaderLabAlert[] {
  const alerts: HeaderLabAlert[] = [];
  const entries = [
    HEADER_LABS.lipase,
    HEADER_LABS.alt,
    HEADER_LABS.ast,
    HEADER_LABS.creatinine,
  ] as const;

  for (const ref of entries) {
    const obs = latestObservation(observations, ref.code);
    const v = obs?.valueQuantity?.value;
    if (v === undefined) continue;
    const elevated =
      (ref.refHigh !== undefined && v > ref.refHigh)
      || (ref.critical !== undefined && v >= ref.critical);
    if (!elevated) continue;
    const tone = ref.critical !== undefined && v! >= ref.critical ? 'danger' as const : 'warning' as const;
    alerts.push({
      label: ref.display,
      value: `${v} ${ref.unit}`,
      tone,
      detail:
        ref.refHigh !== undefined
          ? `Ref ≤${ref.refHigh}${ref.critical ? ` · critical ≥${ref.critical}` : ''}`
          : undefined,
    });
  }

  return alerts;
}
