import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/primitives';
import { conditionsForPrescriptionScreening } from '@/lib/clinical/screening-conditions';
import { activeMedicationSnomedCodes } from '@/lib/clinical/medications';
import { getIncretinPrescribingBlocks } from '@/lib/clinical/incretin-prescribing-guards';
import { resolveWeightManagementPathway } from '@/lib/clinical/weight-management-pathway';
import { loadPatientContext } from '@/lib/patient/load-patient-context';
import { evaluatePrescriptionScreening } from '@/lib/screening/evaluate-prescription';
import { DoctorChartLayout } from '@/components/patient/doctor-chart-layout';
import { ConsultChart } from '../consult-chart';
import { ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ConsultDocumentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { appointment?: string; trends?: string };
}) {
  const ctx = await loadPatientContext(params.id);
  if (!ctx.patient) notFound();

  const screening = await evaluatePrescriptionScreening(
    conditionsForPrescriptionScreening([...ctx.problemList, ...ctx.disorders]),
  );
  const weightPathway = await resolveWeightManagementPathway(ctx.patient, params.id);
  const incretinBlock = getIncretinPrescribingBlocks({
    observations: ctx.observations,
    signals: ctx.signals,
    screening,
    weightPathway,
  });

  const appt = searchParams.appointment?.trim();
  const apptQuery = appt ? `?appointment=${encodeURIComponent(appt)}` : '';

  return (
    <DoctorChartLayout patientId={params.id} observations={ctx.observations}>
      <Card>
        <CardTitle icon={<ClipboardList className="h-4 w-4" />}>Consultation documentation</CardTitle>
        <p className="text-[12px] text-ink-500 mb-4">
          Document the visit and complete to send the patient to reception for checkout. Review the{' '}
          <Link href={`/patient/${params.id}${apptQuery}`} className="text-info hover:underline">
            clinical chart
          </Link>{' '}
          for intake, problem list, and medications.
        </p>
        <ConsultChart
          key={params.id}
          patientId={params.id}
          appointmentId={appt}
          chartBackHref={`/patient/${params.id}${apptQuery}`}
          existingMedicationCodes={[...activeMedicationSnomedCodes(ctx.medications)]}
          activeMedications={ctx.medications}
          screening={screening}
          incretinBlock={incretinBlock}
        />
      </Card>
    </DoctorChartLayout>
  );
}
