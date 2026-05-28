import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { canViewClinicalData, patientDestination } from '@/lib/clinic/access';
import { loadPatientContext } from '@/lib/patient/load-patient-context';
import { DoctorChartLayout } from '@/components/patient/doctor-chart-layout';
import { PatientClinicalChart } from '@/components/patient/patient-clinical-chart';
import { ClipboardList } from 'lucide-react';

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
    return (
      <DoctorChartLayout patientId={params.id} observations={ctx.observations}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-lg font-medium">Clinical chart</h1>
            <p className="text-sm text-ink-500 mt-0.5">
              Nurse intake, problem list, medications, and safety signals
            </p>
          </div>
          <Link
            href={`/patient/${params.id}/consult/document${apptQuery}`}
            className="inline-flex items-center gap-2 px-3 py-2 text-[12px] bg-ink-900 text-white rounded-md hover:bg-ink-700"
          >
            <ClipboardList className="h-4 w-4" />
            Open consultation note
          </Link>
        </div>
        <PatientClinicalChart patientId={params.id} ctx={ctx} />
      </DoctorChartLayout>
    );
  }

  redirect(`/patient/${params.id}/nurse${apptQuery}`);
}
