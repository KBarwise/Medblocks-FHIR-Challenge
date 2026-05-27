import { notFound } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/primitives';
import { conditionsForPrescriptionScreening } from '@/lib/clinical/screening-conditions';
import { activeMedicationSnomedCodes } from '@/lib/clinical/medications';
import { getIncretinPrescribingBlocks } from '@/lib/clinical/incretin-prescribing-guards';
import { loadPatientContext } from '@/lib/patient/load-patient-context';
import { evaluatePrescriptionScreening } from '@/lib/screening/evaluate-prescription';
import { ConsultChart } from '../consult-chart';
import { ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConsultDocumentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { appointment?: string };
}) {
  const ctx = await loadPatientContext(params.id);
  if (!ctx.patient) notFound();

  const screening = await evaluatePrescriptionScreening(
    conditionsForPrescriptionScreening([...ctx.problemList, ...ctx.disorders]),
  );
  const incretinBlock = getIncretinPrescribingBlocks({
    observations: ctx.observations,
    signals: ctx.signals,
    screening,
  });

  return (
    <>
      <Card>
        <CardTitle icon={<ClipboardList className="h-4 w-4" />}>Consultation documentation</CardTitle>
        <p className="text-[12px] text-ink-500 mb-4">
          Use the tabs to document the visit. Completing sends the patient to reception for checkout;
          you can return them to the nurse without finishing the note.
        </p>
        <ConsultChart
          key={params.id}
          patientId={params.id}
          appointmentId={searchParams.appointment?.trim() || undefined}
          chartBackHref={`/patient/${params.id}`}
          existingMedicationCodes={[...activeMedicationSnomedCodes(ctx.medications)]}
          activeMedications={ctx.medications}
          screening={screening}
          incretinBlock={incretinBlock}
        />
      </Card>
    </>
  );
}
