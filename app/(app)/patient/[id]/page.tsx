import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { canViewClinicalData, patientDestination } from '@/lib/clinic/access';
import { loadPatientContext } from '@/lib/patient/load-patient-context';
import { PatientClinicalChart } from '@/components/patient/patient-clinical-chart';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

function buildRedirectQuery(searchParams: Record<string, string | string[] | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else {
      params.set(key, value);
    }
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

export default async function PatientChartPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const ctx = await loadPatientContext(params.id);
  if (!ctx.patient) notFound();

  const role = getActingRoleFromCookie();
  if (!canViewClinicalData(role)) {
    redirect(patientDestination(role, params.id));
  }

  if (role === 'doctor') {
    const query = buildRedirectQuery(searchParams ?? {});
    redirect(`/patient/${params.id}/consult/document${query}`);
  }

  return (
    <>
      <PatientClinicalChart patientId={params.id} ctx={ctx} />

      <div className="flex justify-end mt-4">
        <Link
          href={`/patient/${params.id}/nurse`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-ink-900 text-white text-[13px] rounded-md hover:bg-ink-700"
        >
          Nurse documentation
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
