import type { Patient } from '@/lib/fhir/resources';
import { fullName, ageFromBirthDate, initials } from '@/lib/utils';

/** Read-only demographic banner — no labs, risk, or clinical links. */
export function PatientDemographicsHeader({ patient }: { patient: Patient }) {
  const name = fullName(patient);
  const age = ageFromBirthDate(patient.birthDate);
  const sex = patient.gender ? patient.gender[0].toUpperCase() + patient.gender.slice(1) : '?';
  const mrn =
    patient.identifier?.find(i => i.use === 'official' || i.type?.coding?.some(c => c.code === 'MR'))?.value
    ?? patient.identifier?.[0]?.value;

  return (
    <header className="p-4 bg-white border border-ink-100 rounded-lg mb-3">
      <div className="flex items-center gap-3.5">
        <div className="h-12 w-12 rounded-full bg-info-soft text-info flex items-center justify-center text-sm font-medium shrink-0">
          {initials(name)}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[15px] font-medium">{name}</div>
            <div className="text-xs text-ink-500">· {sex} · {age ?? '?'}y</div>
          </div>
          <div className="text-xs text-ink-500 mt-0.5">
            {mrn && <>MRN {mrn}</>}
            {patient.birthDate && <>{mrn ? ' · ' : ''}DOB {patient.birthDate}</>}
          </div>
          <p className="text-[11px] text-ink-500 mt-2">Demographics only — editing is done at reception.</p>
        </div>
      </div>
    </header>
  );
}
