import { redirect, notFound } from 'next/navigation';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { canViewClinicalData, patientDestination } from '@/lib/clinic/access';
import { loadPatientContext } from '@/lib/patient/load-patient-context';

export const dynamic = 'force-dynamic';

export default async function PatientChartPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { appointment?: string };
}) {
  const ctx = await loadPatientContext(params.id);
  if (!ctx.patient) notFound();

  const role = getActingRoleFromCookie();
  if (!canViewClinicalData(role)) {
    redirect(patientDestination(role, params.id));
  }

  const appt = searchParams.appointment?.trim();
  const apptQuery = appt ? `?appointment=${encodeURIComponent(appt)}` : '';

  if (role === 'doctor') {
    redirect(`/patient/${params.id}/consult/document${apptQuery}`);
  }

  redirect(`/patient/${params.id}/nurse${apptQuery}`);
}
