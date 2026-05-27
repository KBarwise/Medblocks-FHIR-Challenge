import { EditableProblemList } from '@/components/patient/editable-problem-list';
import { PatientMedicationsList } from '@/components/patient/patient-medications-list';
import type { loadPatientContext } from '@/lib/patient/load-patient-context';

/** Medications and problem list shown above consultation documentation. */
export function DoctorConsultContext({
  patientId,
  ctx,
}: {
  patientId: string;
  ctx: NonNullable<Awaited<ReturnType<typeof loadPatientContext>>>;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <PatientMedicationsList medications={ctx.medications} />
      <EditableProblemList patientId={patientId} problems={ctx.problemList} />
    </div>
  );
}
