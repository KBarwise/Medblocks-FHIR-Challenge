import { notFound, redirect } from 'next/navigation';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { canViewClinicalData, patientDestination } from '@/lib/clinic/access';
import { loadPatientContext } from '@/lib/patient/load-patient-context';
import { tabFromTrendsParam } from '@/lib/clinical/trends-navigation';

export const dynamic = 'force-dynamic';

export default async function PatientTrendsPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { tab?: string };
}) {
  const ctx = await loadPatientContext(params.id);
  if (!ctx.patient) notFound();

  const role = getActingRoleFromCookie();
  if (!canViewClinicalData(role)) {
    redirect(patientDestination(role, params.id));
  }

  const tab = tabFromTrendsParam(searchParams?.tab ?? null);
  const base =
    role === 'doctor'
      ? `/patient/${params.id}/consult/document`
      : `/patient/${params.id}`;
  redirect(`${base}?trends=1&tab=${tab}`);
}
