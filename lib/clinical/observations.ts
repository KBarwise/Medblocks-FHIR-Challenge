import type { Observation } from '@/lib/fhir/resources';

export const LOINC = {
  bodyWeight: '29463-7',
  bmi: '39156-5',
  hba1c: '4548-4',
  pregnancyTest: '81025-3',
  bloodGlucosePoc: '2345-7',
  urinalysis: '24356-8',
  nursingNote: '34746-8',
} as const;

export function observationLoincCode(observation: Observation): string | undefined {
  return observation.code?.coding?.find(c => c.system?.includes('loinc.org'))?.code
    ?? observation.code?.coding?.[0]?.code;
}

export function observationsWithLoinc(observations: Observation[], loinc: string): Observation[] {
  return observations
    .filter(o => observationLoincCode(o) === loinc)
    .sort((a, b) => (b.effectiveDateTime ?? '').localeCompare(a.effectiveDateTime ?? ''));
}

export function latestObservationValue(observations: Observation[], loinc: string): Observation | undefined {
  return observationsWithLoinc(observations, loinc)[0];
}

export function codedObservationValue(observation: Observation): string | undefined {
  return (
    observation.valueCodeableConcept?.text
    ?? observation.valueCodeableConcept?.coding?.[0]?.display
    ?? observation.valueString
  );
}

export function observationsByLoinc(observations: Observation[], loinc: string): Observation[] {
  return observations
    .filter(o => observationLoincCode(o) === loinc)
    .filter(o => o.valueQuantity?.value !== undefined)
    .sort((a, b) => (b.effectiveDateTime ?? '').localeCompare(a.effectiveDateTime ?? ''));
}

export function latestObservation(observations: Observation[], loinc: string): Observation | undefined {
  return observationsByLoinc(observations, loinc)[0];
}

export type MetricDelta = {
  current?: number;
  previous?: number;
  delta?: number;
  pctChange?: number;
  unit?: string;
  date?: string;
};

export function metricDelta(observations: Observation[], loinc: string): MetricDelta {
  const sorted = observationsByLoinc(observations, loinc);
  const currentObs = sorted[0];
  const previousObs = sorted[1];
  const current = currentObs?.valueQuantity?.value;
  const previous = previousObs?.valueQuantity?.value;
  if (current === undefined) {
    return { unit: currentObs?.valueQuantity?.unit };
  }
  const delta = previous !== undefined ? current - previous : undefined;
  const pctChange =
    previous !== undefined && previous !== 0
      ? ((current - previous) / Math.abs(previous)) * 100
      : undefined;
  return {
    current,
    previous,
    delta,
    pctChange,
    unit: currentObs?.valueQuantity?.unit,
    date: currentObs?.effectiveDateTime?.slice(0, 10),
  };
}
