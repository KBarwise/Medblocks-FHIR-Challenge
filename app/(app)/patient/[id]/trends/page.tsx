import { notFound, redirect } from 'next/navigation';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { canViewClinicalData, patientDestination } from '@/lib/clinic/access';
import { loadPatientContext } from '@/lib/patient/load-patient-context';
import { ClinicalTrendsPanel } from '@/components/patient/clinical-trends-panel';

export const dynamic = 'force-dynamic';

export default async function PatientTrendsPage({ params }: { params: { id: string } }) {
  const ctx = await loadPatientContext(params.id);
  if (!ctx.patient) notFound();

  const role = getActingRoleFromCookie();
  if (!canViewClinicalData(role)) {
    redirect(patientDestination(role, params.id));
  }

  return (
    <>
      <h1 className="text-lg font-medium mb-1">Trends</h1>
      <p className="text-sm text-ink-500 mb-4">
        Vital signs, anthropometrics, and laboratory results over time.
      </p>
      <ClinicalTrendsPanel patientId={params.id} />
    </>
  );
}
