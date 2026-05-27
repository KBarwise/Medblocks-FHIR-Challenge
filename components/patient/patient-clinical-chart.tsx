import { NurseIntakeSummary } from '@/components/patient/nurse-intake-summary';
import { DoctorPatientOverview } from '@/components/patient/doctor-patient-overview';
import { DoctorChartLayout } from '@/components/patient/doctor-chart-layout';
import type { loadPatientContext } from '@/lib/patient/load-patient-context';

/** Clinical chart: nurse intake + medications, problems, and safety signals. */
export function PatientClinicalChart({
  patientId,
  ctx,
  layout = 'default',
}: {
  patientId: string;
  ctx: NonNullable<Awaited<ReturnType<typeof loadPatientContext>>>;
  /** Doctor view — nurse intake sidebar on the left. */
  layout?: 'default' | 'doctor';
}) {
  const main = <DoctorPatientOverview patientId={patientId} ctx={ctx} />;

  if (layout === 'doctor') {
    return (
      <DoctorChartLayout patientId={patientId} observations={ctx.observations}>
        {main}
      </DoctorChartLayout>
    );
  }

  return (
    <>
      <NurseIntakeSummary observations={ctx.observations} />
      {main}
    </>
  );
}
