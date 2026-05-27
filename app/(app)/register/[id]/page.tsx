import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/primitives';
import { UserPen } from 'lucide-react';
import { fhir } from '@/lib/fhir/client';
import type { Patient } from '@/lib/fhir/resources';
import { parseUsCorePatient } from '@/lib/fhir/us-core-patient';
import { fullName } from '@/lib/utils';
import { PatientForm } from '../patient-form';

export const dynamic = 'force-dynamic';

export default async function EditPatientPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { intake?: string };
}) {
  let patient: Patient | null = null;
  try {
    patient = await fhir.read<Patient>('Patient', params.id);
  } catch {
    notFound();
  }

  const initial = parseUsCorePatient(patient);
  const name = fullName(patient);

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-4">
        <h1 className="text-xl font-medium">Edit patient</h1>
        <p className="text-sm text-ink-500 mt-0.5">
          {name} · <span className="font-mono text-[12px]">Patient/{params.id}</span>
        </p>
      </div>
      <Card>
        <CardTitle icon={<UserPen className="h-4 w-4" />}>Demographics & US Core identity</CardTitle>
        <PatientForm
          patientId={params.id}
          initial={initial}
          intakeId={searchParams.intake}
        />
      </Card>
      <p className="text-[12px] text-ink-500 mt-3">
        <Link href="/register" className="text-info hover:underline">
          ← Register another patient
        </Link>
      </p>
    </div>
  );
}
