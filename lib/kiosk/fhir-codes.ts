/** FHIR identifiers and codes for kiosk records stored as Basic resources. */

export const KIOSK_RECORD_TYPE_SYSTEM = 'http://glp1-monitor.local/CodeSystem/kiosk-record-type';
export const KIOSK_RECORD_ID_SYSTEM = 'http://glp1-monitor.local/kiosk-record-id';
export const KIOSK_PAYLOAD_URL = 'http://glp1-monitor.local/StructureDefinition/kiosk-payload';

export const KIOSK_RECORD_TYPE = {
  intake: 'intake',
  symptomReport: 'symptom-report',
} as const;
