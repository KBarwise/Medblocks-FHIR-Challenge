import { ClinicalTrendsPanel } from '@/components/patient/clinical-trends-panel';
import { NurseIntakeSummary } from '@/components/patient/nurse-intake-summary';
import { DoctorPatientOverview } from '@/components/patient/doctor-patient-overview';
import type { loadPatientContext } from '@/lib/patient/load-patient-context';

/** Nurse intake, trends, medications, problem list, and safety signals. */
export function PatientClinicalChart({
  patientId,
  ctx,
  showTrends = false,
}: {
  patientId: string;
  ctx: NonNullable<Awaited<ReturnType<typeof loadPatientContext>>>;
  /** Doctor chart — selectable vitals, labs, and POC graphs. */
  showTrends?: boolean;
}) {
  return (
    <>
      <NurseIntakeSummary observations={ctx.observations} />
      {showTrends && <ClinicalTrendsPanel patientId={patientId} />}
      <DoctorPatientOverview patientId={patientId} ctx={ctx} />
    </>
  );
}
