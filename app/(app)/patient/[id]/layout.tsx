import { notFound } from 'next/navigation';
import { PatientHeader } from '@/components/patient/patient-header';
import { PatientChromeToolbar } from '@/components/patient/patient-chrome-toolbar';
import { PatientHeaderActions } from '@/components/patient/patient-header-actions';
import { canViewClinicalData } from '@/lib/clinic/access';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { loadPatientContext } from '@/lib/patient/load-patient-context';
import { PatientChartShell } from '@/components/patient/patient-chart-shell';

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
    <div className="min-h-full flex flex-col">
      <div className="sticky top-0 z-30 bg-[var(--bg)]/95 backdrop-blur-sm border-b border-ink-100 shadow-sm shrink-0">
        <div className="h-1 bg-accent" aria-hidden />
        <div className="w-full px-4 lg:px-5 pt-2 pb-2">
          {showClinicalHeader && (
            <>
              <PatientHeader
                patient={ctx.patient}
                patientId={params.id}
                observations={ctx.observations}
                medications={ctx.medications}
                riskScore={ctx.riskScore}
                riskTone={ctx.riskTone}
                showScreeningLink={role !== 'doctor'}
                actions={<PatientHeaderActions />}
              />
              <PatientChromeToolbar patientId={params.id} />
            </>
          )}
        </div>
      </div>
      <div className="flex-1 w-full px-4 lg:px-5 py-3 min-h-0">
        <PatientChartShell patientId={params.id}>{children}</PatientChartShell>
      </div>
    </div>
  );
}
