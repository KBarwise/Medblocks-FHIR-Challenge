/**
 * Safety signal rule engine for GLP-1 / GIP monitoring.
 *
 * Evaluates a patient bundle of Observations and Conditions and emits
 * structured signals. The route handler converts these into FHIR Flag
 * resources persisted back to HAPI.
 */

import type { Bundle, Condition, Observation } from '../fhir/resources';
import { PHQ9_LOINC } from '../valuesets';

export type Severity = 'red' | 'amber' | 'blue';

export type SafetySignal = {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  code: { system: string; code: string; display: string };
  evidence: string[];
  action: string;
};

type Inputs = {
  observations: Observation[];
  conditions: Condition[];
};

function latestNumeric(obs: Observation[], loinc: string): Observation | undefined {
  return obs
    .filter(o => o.code?.coding?.some(c => c.code === loinc))
    .sort((a, b) => (b.effectiveDateTime ?? '').localeCompare(a.effectiveDateTime ?? ''))[0];
}

function value(o?: Observation): number | undefined {
  return o?.valueQuantity?.value;
}

function deltaSince(obs: Observation[], loinc: string, daysAgo: number): { from?: number; to?: number; days?: number } {
  const series = obs
    .filter(o => o.code?.coding?.some(c => c.code === loinc) && o.valueQuantity?.value !== undefined && o.effectiveDateTime)
    .sort((a, b) => (a.effectiveDateTime ?? '').localeCompare(b.effectiveDateTime ?? ''));
  if (series.length < 2) return {};
  const cutoff = Date.now() - daysAgo * 86400_000;
  const baseline = series.find(o => new Date(o.effectiveDateTime!).getTime() >= cutoff) ?? series[0];
  const latest = series[series.length - 1];
  return {
    from: baseline.valueQuantity!.value,
    to: latest.valueQuantity!.value,
    days: Math.round((new Date(latest.effectiveDateTime!).getTime() - new Date(baseline.effectiveDateTime!).getTime()) / 86400_000),
  };
}

export function evaluateSignals({ observations, conditions }: Inputs): SafetySignal[] {
  const signals: SafetySignal[] = [];

  // Rule 1 — suspected acute pancreatitis: lipase >= 3x ULN of 60
  const lipase = latestNumeric(observations, '3040-3');
  const lipaseValue = value(lipase);
  if (lipaseValue !== undefined && lipaseValue >= 180) {
    signals.push({
      id: 'acute-pancreatitis-suspected',
      severity: 'red',
      title: 'Suspected acute pancreatitis',
      detail: `Lipase ${lipaseValue} U/L (>=3x ULN)`,
      code: { system: 'http://snomed.info/sct', code: '75694006', display: 'Acute pancreatitis' },
      evidence: [`Observation/${lipase?.id ?? 'unknown'} lipase ${lipaseValue} U/L`],
      action: 'Hold therapy. Urgent clinical review. Repeat lipase plus abdominal imaging.',
    });
  }

  // Rule 2 — rapid HbA1c reduction risk of retinopathy progression
  const a1cDelta = deltaSince(observations, '4548-4', 180);
  if (a1cDelta.from !== undefined && a1cDelta.to !== undefined && a1cDelta.from - a1cDelta.to >= 2.5) {
    signals.push({
      id: 'rapid-hba1c-reduction',
      severity: 'amber',
      title: 'Rapid HbA1c reduction',
      detail: `HbA1c ${a1cDelta.from}% to ${a1cDelta.to}% over ~${a1cDelta.days} d`,
      code: { system: 'http://snomed.info/sct', code: '4855003', display: 'Diabetic retinopathy' },
      evidence: [`HbA1c trend, drop >= 2.5% in 6 months`],
      action: 'Order ophthalmology review. Counsel on retinopathy progression risk.',
    });
  }

  // Rule 3 — calcitonin elevation (MTC surveillance)
  const calcitonin = latestNumeric(observations, '1989-3');
  const calcitoninValue = value(calcitonin);
  if (calcitoninValue !== undefined && calcitoninValue > 100) {
    signals.push({
      id: 'calcitonin-elevation',
      severity: 'red',
      title: 'Calcitonin elevation',
      detail: `Calcitonin ${calcitoninValue} pg/mL`,
      code: { system: 'http://snomed.info/sct', code: '255075006', display: 'Medullary thyroid carcinoma' },
      evidence: [`Observation/${calcitonin?.id ?? 'unknown'}`],
      action: 'Stop therapy. Urgent endocrinology referral.',
    });
  }

  // Rule 4 — eGFR drop (creatinine surrogate, expects an eGFR observation if available)
  // Using creatinine rise as a proxy when eGFR is not present
  const crDelta = deltaSince(observations, '2160-0', 90);
  if (crDelta.from !== undefined && crDelta.to !== undefined && crDelta.to > crDelta.from * 1.5) {
    signals.push({
      id: 'creatinine-rise',
      severity: 'amber',
      title: 'Significant creatinine rise',
      detail: `Creatinine ${crDelta.from} to ${crDelta.to} umol/L`,
      code: { system: 'http://snomed.info/sct', code: '236423003', display: 'Acute kidney injury' },
      evidence: ['Creatinine increased > 50 percent in 90 d'],
      action: 'Assess hydration and renal function. Consider holding therapy.',
    });
  }

  // Rule 5 — PHQ-9 moderate or higher
  const phq9 = latestNumeric(observations, PHQ9_LOINC);
  const phq9Value = value(phq9);
  if (phq9Value !== undefined && phq9Value >= 10) {
    signals.push({
      id: 'phq9-elevated',
      severity: phq9Value >= 20 ? 'red' : 'amber',
      title: `PHQ-9 ${phq9Value} (${phq9Value >= 20 ? 'severe' : phq9Value >= 15 ? 'mod-severe' : 'moderate'})`,
      detail: 'Depressive symptoms screen positive',
      code: { system: 'http://snomed.info/sct', code: '35489007', display: 'Depressive disorder' },
      evidence: [`Observation/${phq9?.id ?? 'unknown'}`],
      action: 'Assess for suicidal ideation. Mental health referral per protocol.',
    });
  }

  // Rule 6 — gallstone history with rapid weight loss
  const hasCholelithiasis = conditions.some(c =>
    c.code?.coding?.some(cc => ['235919008', '266474003'].includes(cc.code ?? '')),
  );
  const weightDelta = deltaSince(observations, '29463-7', 90);
  if (hasCholelithiasis && weightDelta.from && weightDelta.to && (weightDelta.from - weightDelta.to) / weightDelta.from > 0.07) {
    signals.push({
      id: 'biliary-risk',
      severity: 'amber',
      title: 'Biliary event risk',
      detail: 'History of cholelithiasis with rapid weight loss',
      code: { system: 'http://snomed.info/sct', code: '235919008', display: 'Cholelithiasis' },
      evidence: ['Cholelithiasis on problem list', `Weight dropped > 7 percent in 90 d`],
      action: 'Counsel patient on biliary symptoms. Low threshold for ultrasound.',
    });
  }

  return signals;
}

/** Convenience: pull resources of a given type out of a Bundle. */
export function splitBundle<T extends { resourceType: string }>(b: Bundle, type: T['resourceType']): T[] {
  return (b.entry ?? [])
    .map(e => e.resource as T | undefined)
    .filter((r): r is T => r?.resourceType === type);
}
