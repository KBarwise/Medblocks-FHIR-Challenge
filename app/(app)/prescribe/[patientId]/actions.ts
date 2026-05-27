'use server';

import { fhir } from '@/lib/fhir/client';
import { buildMedicationRequest } from '@/lib/fhir/builders';
import type { MedicationRequest } from '@/lib/fhir/resources';

export async function submitPrescription(args: {
  patientId: string;
  agentCode: string;
  agentDisplay: string;
  doseValue: number;
  doseUnit: string;
}): Promise<MedicationRequest> {
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
