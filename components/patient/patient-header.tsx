import Link from 'next/link';
import type { MedicationRequest, Observation, Patient } from '@/lib/fhir/resources';
import { Badge } from '@/components/ui/primitives';
import { MetabolicStat } from '@/components/ui/metabolic-stat';
import { getHeaderCholesterol, getHeaderConcerningLabs } from '@/lib/clinical/header-labs';
import { LOINC, metricDelta } from '@/lib/clinical/observations';
import { fullName, ageFromBirthDate, initials } from '@/lib/utils';
import { ArrowDown, ArrowUp } from 'lucide-react';

export function PatientHeader({
  patient,
  patientId,
  observations,
  riskScore,
  riskTone,
  showScreeningLink = true,
  actions,
}: {
  patient: Patient;
  patientId: string;
  observations: Observation[];
  medications?: MedicationRequest[];
  riskScore: number;
  riskTone: 'danger' | 'warning' | 'success';
  /** Hidden for doctors — screening lives in the consultation note. */
  showScreeningLink?: boolean;
  /** Toolbar actions (e.g. Trends) rendered beside the risk badge. */
  actions?: React.ReactNode;
}) {
  const name = fullName(patient);
  const age = ageFromBirthDate(patient.birthDate);
  const sex = patient.gender ? patient.gender[0].toUpperCase() + patient.gender.slice(1) : '?';
  const mrn =
    patient.identifier?.find(i => i.use === 'official' || i.type?.coding?.some(c => c.code === 'MR'))?.value
    ?? patient.identifier?.[0]?.value;

  const weightMetric = metricDelta(observations, LOINC.bodyWeight);
  const hba1cMetric = metricDelta(observations, LOINC.hba1c);
  const bmiMetric = metricDelta(observations, LOINC.bmi);
  const cholesterol = getHeaderCholesterol(observations);
  const labAlerts = getHeaderConcerningLabs(observations);

  return (
    <header className="p-3 bg-white border border-ink-100 rounded-lg shadow-sm ring-1 ring-ink-100/80">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-11 w-11 rounded-full bg-info-soft text-info flex items-center justify-center text-sm font-medium shrink-0">
            {initials(name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[15px] font-medium leading-tight">{name}</h1>
              <span className="text-xs text-ink-500">
                {sex} · {age ?? '?'}y
              </span>
            </div>
            {mrn && <div className="text-xs text-ink-500 mt-0.5">MRN {mrn}</div>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <Badge tone={riskTone}>
            Risk {riskScore} / {riskTone === 'danger' ? 'high' : riskTone === 'warning' ? 'moderate' : 'low'}
          </Badge>
          {actions}
          {showScreeningLink && (
            <div className="text-[11px] text-ink-500">
              <Link href={`/screening/${patientId}`} className="text-info hover:underline">
                Screening →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 w-full">
        <MetabolicStat
          label="Weight change"
          metric={weightMetric}
          formatValue={v => v.toFixed(1)}
          invertDelta
          className="w-full"
        />
        <MetabolicStat label="HbA1c" metric={hba1cMetric} formatValue={v => v.toFixed(1)} invertDelta className="w-full" />
        <MetabolicStat label="BMI" metric={bmiMetric} formatValue={v => v.toFixed(1)} invertDelta className="w-full" />
        {cholesterol && (
          <div className="w-full min-w-0">
            <CholesterolStat cholesterol={cholesterol} />
          </div>
        )}
        {labAlerts.map(a => (
          <div
            key={a.label}
            className={`rounded-md px-3 py-2 min-w-0 w-full ${
              a.tone === 'danger' ? 'bg-danger-soft' : 'bg-warning-soft'
            }`}
          >
            <div className="text-[10px] uppercase tracking-wide text-ink-500 mb-1">{a.label}</div>
            <div className={`text-lg font-medium tnum ${a.tone === 'danger' ? 'text-danger' : 'text-warning'}`}>
              {a.value}
            </div>
            {a.detail && <div className="text-[10px] text-ink-500 mt-0.5">{a.detail}</div>}
          </div>
        ))}
      </div>
    </header>
  );
}

function CholesterolStat({
  cholesterol,
}: {
  cholesterol: { current: number; unit: string; delta?: number; pctChange?: number };
}) {
  const favourable = cholesterol.delta !== undefined && cholesterol.delta <= 0;
  const Arrow = cholesterol.delta !== undefined && cholesterol.delta > 0 ? ArrowUp : ArrowDown;
  return (
    <div className="bg-ink-50 rounded-md px-3 py-2 h-full min-w-0 w-full">
      <div className="text-[10px] uppercase tracking-wide text-ink-500 mb-1">Cholesterol Δ</div>
      <div className="flex items-end gap-1.5">
        <span className="text-lg font-medium tnum">{cholesterol.current.toFixed(0)}</span>
        <span className="text-[11px] text-ink-500 pb-0.5">{cholesterol.unit}</span>
      </div>
      {cholesterol.delta !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-[11px] tnum ${favourable ? 'text-accent' : 'text-danger'}`}>
          <Arrow className="h-3 w-3" />
          <span>
            {cholesterol.delta > 0 ? '+' : ''}{cholesterol.delta.toFixed(0)}
            {cholesterol.pctChange !== undefined && (
              <span className="text-ink-500 ml-1">
                ({cholesterol.pctChange > 0 ? '+' : ''}{cholesterol.pctChange.toFixed(1)}%)
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
