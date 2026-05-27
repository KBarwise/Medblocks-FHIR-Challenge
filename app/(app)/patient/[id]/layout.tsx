import { notFound } from 'next/navigation';
import { PatientHeader } from '@/components/patient/patient-header';
import { PatientNav } from '@/components/patient/patient-nav';
import { canViewClinicalData } from '@/lib/clinic/access';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { loadPatientContext } from '@/lib/patient/load-patient-context';

export const dynamic = 'force-dynamic';

export default async function PatientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const ctx = await loadPatientContext(params.id);
  if (!ctx.patient) notFound();

  const role = getActingRoleFromCookie();
  const showClinicalHeader = canViewClinicalData(role);

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-ink-100 shadow-sm">
        <div className="h-1 bg-accent" aria-hidden />
        <div
          className={`mx-auto px-6 pt-4 pb-3 space-y-0 ${
            showClinicalHeader ? 'max-w-7xl' : 'max-w-5xl'
          }`}
        >
          {showClinicalHeader && (
            <PatientHeader
              patient={ctx.patient}
              patientId={params.id}
              observations={ctx.observations}
              medications={ctx.medications}
              riskScore={ctx.riskScore}
              riskTone={ctx.riskTone}
              showScreeningLink={role !== 'doctor'}
            />
          )}
          <PatientNav patientId={params.id} embedded />
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-6 py-4">{children}</div>
    </div>
  );
}
