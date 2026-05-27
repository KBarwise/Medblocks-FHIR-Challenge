'use server';

import { fhir } from '@/lib/fhir/client';
import { assertIncretinPrescribingAllowed } from '@/lib/clinical/incretin-prescribing-guards';
import { buildMedicationRequest } from '@/lib/fhir/builders';
import type { Bundle, MedicationRequest, Observation } from '@/lib/fhir/resources';

export async function submitPrescription(args: {
  patientId: string;
  agentCode: string;
  agentDisplay: string;
  doseValue: number;
  doseUnit: string;
}): Promise<MedicationRequest> {
  const obsBundle = await fhir.search<Bundle<Observation>>('Observation', {
    patient: args.patientId,
    _count: 200,
    _sort: '-date',
  }).catch(() => ({ resourceType: 'Bundle' as const, type: 'searchset' as const, entry: [] }));
  const observations = (obsBundle.entry ?? [])
    .map(e => e.resource)
    .filter((r): r is Observation => r?.resourceType === 'Observation');

  assertIncretinPrescribingAllowed({ observations });

  const resource = buildMedicationRequest({
    patientId: args.patientId,
    medicationCode: { code: args.agentCode, display: args.agentDisplay },
    reasonCode: { code: '414916001', display: 'Obesity' },
    doseText: `${args.doseValue} ${args.doseUnit} subcutaneously once weekly`,
    doseValue: args.doseValue,
    doseUnit: args.doseUnit,
    frequencyPeriodDays: 7,
  });
  const created = await fhir.create<MedicationRequest>('MedicationRequest', resource);
  return created;
}
