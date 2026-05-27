import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { canViewClinicalData, patientDestination } from '@/lib/clinic/access';
import { loadPatientContext } from '@/lib/patient/load-patient-context';
import { PatientClinicalChart } from '@/components/patient/patient-clinical-chart';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PatientChartPage({ params }: { params: { id: string } }) {
  const ctx = await loadPatientContext(params.id);
  if (!ctx.patient) notFound();

  const role = getActingRoleFromCookie();
  if (!canViewClinicalData(role)) {
    redirect(patientDestination(role, params.id));
  }

  return (
    <>
      <PatientClinicalChart
        patientId={params.id}
        ctx={ctx}
        layout={role === 'doctor' ? 'doctor' : 'default'}
      />

      <div className="flex justify-end mt-4">
        {role === 'doctor' && (
          <Link
            href={`/patient/${params.id}/consult/document`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink-900 text-white text-[13px] rounded-md hover:bg-ink-700"
          >
            Document consultation
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        {role === 'nurse' && (
          <Link
            href={`/patient/${params.id}/nurse`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink-900 text-white text-[13px] rounded-md hover:bg-ink-700"
          >
            Nurse documentation
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </>
  );
}
