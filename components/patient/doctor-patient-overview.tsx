import { EditableProblemList } from '@/components/patient/editable-problem-list';
import { PatientProblemList } from '@/components/patient/patient-problem-list';
import { PatientMedicationsList } from '@/components/patient/patient-medications-list';
import { PatientClinicalSummary } from '@/components/patient/patient-clinical-summary';
import type { loadPatientContext } from '@/lib/patient/load-patient-context';

/** Clinical banner, problem list, and safety signals for doctor workflows. */
export function DoctorPatientOverview({
  patientId,
  ctx,
  editableProblemList = true,
}: {
  patientId: string;
  ctx: NonNullable<Awaited<ReturnType<typeof loadPatientContext>>>;
  /** When true, problem list can be edited (doctor/nurse). */
  editableProblemList?: boolean;
}) {
  if (!ctx.patient) return null;

  return (
    <>
      <PatientMedicationsList medications={ctx.medications} />
      {editableProblemList ? (
        <EditableProblemList patientId={patientId} problems={ctx.problemList} />
      ) : (
        <PatientProblemList disorders={ctx.disorders} />
      )}
      <PatientClinicalSummary signals={ctx.signals} />
    </>
  );
}
