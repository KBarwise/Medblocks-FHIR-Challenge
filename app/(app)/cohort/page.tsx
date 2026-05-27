import Link from 'next/link';
import { fhir } from '@/lib/fhir/client';
import { Card, CardTitle, Metric } from '@/components/ui/primitives';
import { fullName, ageFromBirthDate, initials } from '@/lib/utils';
import type { Bundle, MedicationRequest, Patient } from '@/lib/fhir/resources';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function loadCohort() {
  // Look for any active MedicationRequest with an SCT code in the incretin set
  // (414438008 GLP-1 receptor agonist hierarchy or tirzepatide)
  try {
    const meds = await fhir.search<Bundle>('MedicationRequest', {
      status: 'active',
      _include: 'MedicationRequest:patient',
      _count: 200,
    });
    const entries = meds.entry ?? [];
    const patients = entries
      .map(e => e.resource as { resourceType?: string } | undefined)
      .filter((r): r is Patient => r?.resourceType === 'Patient');
    const requests = entries
      .map(e => e.resource as { resourceType?: string } | undefined)
      .filter((r): r is MedicationRequest => r?.resourceType === 'MedicationRequest');
    return { patients, requests };
  } catch {
    return { patients: [] as Patient[], requests: [] as MedicationRequest[] };
  }
}

export default async function CohortPage() {
  const { patients, requests } = await loadCohort();
  const reqByPatient = new Map<string, MedicationRequest>();
  for (const r of requests) {
    const id = r.subject?.reference?.split('/').pop();
    if (id && !reqByPatient.has(id)) reqByPatient.set(id, r);
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium">Cohort</h1>
          <p className="text-sm text-ink-500 mt-0.5">Patients on active incretin therapy</p>
        </div>
        <Link
          href="/register"
          className="shrink-0 px-3 py-1.5 text-[12px] bg-ink-900 text-white rounded-md hover:bg-ink-700"
        >
          Register patient
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-4">
        <Metric label="Active patients" value={patients.length} />
        <Metric label="Red alerts" value="–" tone="danger" sub="run signal sweep" />
        <Metric label="Amber alerts" value="–" tone="warning" sub="run signal sweep" />
        <Metric label="Mean %TBW loss" value="–" sub="6 months" />
      </div>

      <Card>
        <CardTitle icon={<Users className="h-4 w-4" />}>Patient list</CardTitle>
        {patients.length === 0 ? (
          <div className="text-[13px] text-ink-500 py-6 text-center">
            No active prescriptions found. Connect a FHIR server with sample data, or seed via the API.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-xs text-ink-500 border-b border-ink-100">
                <th className="py-2 font-medium">Patient</th>
                <th className="py-2 font-medium">Agent</th>
                <th className="py-2 font-medium">Authored</th>
                <th className="py-2 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => {
                const name = fullName(p);
                const med = reqByPatient.get(p.id ?? '');
                return (
                  <tr key={p.id} className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50">
                    <td className="py-2.5">
                      <Link href={`/patient/${p.id}`} className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-info-soft text-info flex items-center justify-center text-[11px] font-medium">
                          {initials(name)}
                        </div>
                        <div>
                          <div className="font-medium">{name}</div>
                          <div className="text-[11px] text-ink-500">{p.gender ?? '?'} · {ageFromBirthDate(p.birthDate) ?? '?'}y</div>
                        </div>
                      </Link>
                    </td>
                    <td className="py-2.5">{med?.medicationCodeableConcept?.text ?? '–'}</td>
                    <td className="py-2.5 text-ink-500">{med?.authoredOn?.slice(0, 10) ?? '–'}</td>
                    <td className="py-2.5 text-right space-x-2 whitespace-nowrap">
                      <Link href={`/screening/${p.id}`} className="text-ink-500 text-[12px] hover:text-ink-900">Screen</Link>
                      <Link href={`/register/${p.id}`} className="text-ink-500 text-[12px] hover:text-ink-900">Edit</Link>
                      <Link href={`/patient/${p.id}`} className="text-info text-[12px]">View →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
