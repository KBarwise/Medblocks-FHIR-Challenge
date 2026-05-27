import { notFound } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/primitives';
import { Pill } from 'lucide-react';
import { getIncretinPrescribingBlocks } from '@/lib/clinical/incretin-prescribing-guards';
import { loadPatientContext } from '@/lib/patient/load-patient-context';
import { PrescribeForm } from './prescribe-form';

export const dynamic = 'force-dynamic';

export default async function PrescribePage({ params }: { params: { patientId: string } }) {
  const ctx = await loadPatientContext(params.patientId);
  if (!ctx.patient) notFound();

  const incretinBlock = getIncretinPrescribingBlocks({
    observations: ctx.observations,
    signals: ctx.signals,
  });

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-xl font-medium mb-1">Prescribe incretin therapy</h1>
      <p className="text-sm text-ink-500 mb-4">Create a new prescription with terminology-validated coding</p>
      <Card>
        <CardTitle icon={<Pill className="h-4 w-4" />}>New prescription</CardTitle>
        <PrescribeForm patientId={params.patientId} incretinBlock={incretinBlock} />
      </Card>
    </div>
  );
}
