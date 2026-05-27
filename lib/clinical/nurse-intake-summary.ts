import {
  ANTHROPOMETRICS,
  POC_TESTS,
  VITAL_SIGNS,
  analyteStatus,
  type LabAnalyte,
} from './lab-catalog';
import { URINALYSIS_POC } from './urinalysis-poc';
import { codedObservationValue, LOINC, latestObservationValue } from './observations';
import type { Observation } from '@/lib/fhir/resources';

export type NurseIntakeRow = {
  label: string;
  code?: string;
  value: string;
  unit?: string;
  date?: string;
  status?: 'normal' | 'warning' | 'critical';
};

/** Anthropometrics already shown in the patient header (doctor sidebar). */
const DOCTOR_SIDEBAR_ANTHROPOMETRIC_OMIT = new Set<string>([
  LOINC.bodyWeight,
  LOINC.bmi,
]);

export function anthropometricsForDoctorSidebar(rows: NurseIntakeRow[]): NurseIntakeRow[] {
  return rows.filter(row => !row.code || !DOCTOR_SIDEBAR_ANTHROPOMETRIC_OMIT.has(row.code));
}

export type NurseIntakeSummary = {
  vitals: NurseIntakeRow[];
  anthropometrics: NurseIntakeRow[];
  poc: NurseIntakeRow[];
  nursingNote?: NurseIntakeRow;
};

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  return iso.slice(0, 16).replace('T', ' ');
}

function quantityRow(def: LabAnalyte, obs: Observation): NurseIntakeRow {
  const value = obs.valueQuantity?.value;
  const unit = obs.valueQuantity?.unit ?? def.unit;
  const status =
    value !== undefined && (def.refLow !== undefined || def.refHigh !== undefined)
      ? analyteStatus(value, def)
      : undefined;
  return {
    label: def.display,
    value: value !== undefined ? String(value) : '—',
    unit,
    date: formatDate(obs.effectiveDateTime),
    status: status === 'normal' ? 'normal' : status,
  };
}

export function buildNurseIntakeSummary(observations: Observation[]): NurseIntakeSummary {
  const vitals: NurseIntakeRow[] = [];
  for (const def of VITAL_SIGNS) {
    const obs = latestObservationValue(observations, def.code);
    if (!obs || obs.valueQuantity?.value === undefined) continue;
    vitals.push(quantityRow(def, obs));
  }

  const anthropometrics: NurseIntakeRow[] = [];
  for (const def of ANTHROPOMETRICS) {
    const obs = latestObservationValue(observations, def.code);
    if (!obs || obs.valueQuantity?.value === undefined) continue;
    anthropometrics.push(quantityRow(def, obs));
  }

  const poc: NurseIntakeRow[] = [];
  for (const test of POC_TESTS) {
    const obs = latestObservationValue(observations, test.code);
    if (!obs) continue;
    if (test.type === 'coded') {
      const value = codedObservationValue(obs);
      if (!value) continue;
      poc.push({
        label: test.display,
        value,
        date: formatDate(obs.effectiveDateTime),
        status: value === 'Normal' || value === 'Negative' ? 'normal' : undefined,
      });
    } else {
      const value = obs.valueQuantity?.value;
      if (value === undefined) continue;
      const status = analyteStatus(value, test);
      poc.push({
        label: test.display,
        value: String(value),
        unit: 'mg/dL',
        date: formatDate(obs.effectiveDateTime),
        status: status === 'normal' ? 'normal' : status,
      });
    }
  }

  for (const field of URINALYSIS_POC) {
    const obs = latestObservationValue(observations, field.loinc);
    if (!obs) continue;
    const value = codedObservationValue(obs) ?? obs.valueString;
    if (!value) continue;
    const isNormal =
      value === field.normal
      || value === 'Negative'
      || value === 'Clear'
      || value === 'Yellow';
    poc.push({
      label: field.display,
      value,
      date: formatDate(obs.effectiveDateTime),
      status: isNormal ? 'normal' : 'warning',
    });
  }

  const noteObs = latestObservationValue(observations, '34746-8');
  const nursingNote = noteObs?.valueString
    ? {
        label: 'Nursing note',
        value: noteObs.valueString,
        date: formatDate(noteObs.effectiveDateTime),
      }
    : undefined;

  return { vitals, anthropometrics, poc, nursingNote };
}

export function nurseIntakeHasData(summary: NurseIntakeSummary): boolean {
  return (
    summary.vitals.length > 0
    || summary.anthropometrics.length > 0
    || summary.poc.length > 0
    || Boolean(summary.nursingNote?.value)
  );
}
