import { notFound } from 'next/navigation';
import { adminFhir, clinicalFhir } from '@/lib/fhir/client';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { splitBundle } from '@/lib/signals/rules';
import { evaluatePrescriptionScreening } from '@/lib/screening/evaluate-prescription';
import type { Bundle, Condition, Patient } from '@/lib/fhir/resources';
import { Card, CardTitle, Badge } from '@/components/ui/primitives';
import { fullName } from '@/lib/utils';
import { ClipboardCheck, AlertOctagon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ScreeningFooter } from './screening-footer';

export const dynamic = 'force-dynamic';

async function loadScreening(patientId: string) {
  const emptyBundle: Bundle = { resourceType: 'Bundle', type: 'searchset', entry: [] };
  const [patient, condBundle] = await Promise.all([
    adminFhir.read<Patient>('Patient', patientId).catch(() => null),
    clinicalFhir.search<Bundle<Condition>>('Condition', {
      patient: patientId,
      'clinical-status': 'active',
      _count: 100,
    }).catch(() => emptyBundle as Bundle<Condition>),
  ]);
  const conditions = splitBundle<Condition>(condBundle, 'Condition');
  const screening = await evaluatePrescriptionScreening(conditions);
  return { patient, conditions, screening };
}

export default async function ScreeningPage({ params }: { params: { patientId: string } }) {
  const { patient, screening } = await loadScreening(params.patientId);
  if (!patient) notFound();

  const role = getActingRoleFromCookie();
  const isKiosk = role === 'patient';
  const name = fullName(patient);
  const overallTone =
    screening.overall === 'red' ? 'danger' : screening.overall === 'amber' ? 'warning' : 'success';
  const OverallIcon =
    screening.overall === 'red'
      ? AlertOctagon
      : screening.overall === 'amber'
        ? AlertTriangle
        : CheckCircle2;

  return (
    <div className={`p-6 mx-auto ${isKiosk ? 'max-w-2xl' : 'max-w-4xl'}`}>
      <div className="mb-4">
        <h1 className={`font-medium ${isKiosk ? 'text-2xl text-center' : 'text-xl'}`}>
          {isKiosk ? 'Your pre-screening results' : 'Pre-prescription screening'}
        </h1>
        <p className={`text-ink-500 mt-1 ${isKiosk ? 'text-[15px] text-center' : 'text-sm mt-0.5'}`}>
          {name}
          {!isKiosk && (
            <>
              {' '}
              · active conditions validated against Snowstorm{' '}
              <code className="font-mono text-[11px]">$validate-code</code>
            </>
          )}
        </p>
      </div>

      <Card className="mb-3">
        <CardTitle icon={<OverallIcon className="h-4 w-4" />}>Overall eligibility</CardTitle>
        <div className="flex items-center gap-3">
          <Badge tone={overallTone}>
            {screening.overall === 'red'
              ? 'Do not prescribe'
              : screening.overall === 'amber'
                ? 'Prescribe with caution'
                : 'No contraindications detected'}
          </Badge>
          <span className="text-[12px] text-ink-500">
            {screening.items.filter(i => i.level === 'red').length} absolute ·{' '}
            {screening.items.filter(i => i.level === 'amber').length} caution ·{' '}
            {screening.items.filter(i => i.level === 'clear').length} clear
          </span>
        </div>
      </Card>

      <Card>
        <CardTitle icon={<ClipboardCheck className="h-4 w-4" />}>Condition review</CardTitle>
        {screening.items.length === 0 ? (
          <p className="text-[13px] text-ink-500 py-4">No active conditions on record.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-xs text-ink-500 border-b border-ink-100">
                <th className="py-2 font-medium">Condition</th>
                <th className="py-2 font-medium">Result</th>
                <th className="py-2 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody>
              {screening.items.map(item => (
                <tr key={item.condition.id ?? item.label} className="border-b border-ink-100 last:border-b-0">
                  <td className="py-2.5 font-medium">{item.label}</td>
                  <td className="py-2.5">
                    <Badge
                      tone={
                        item.level === 'red' ? 'danger' : item.level === 'amber' ? 'warning' : 'success'
                      }
                    >
                      {item.level}
                    </Badge>
                  </td>
                  <td className="py-2.5 text-ink-500 text-[12px]">{item.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <ScreeningFooter patientId={params.patientId} />
    </div>
  );
}
