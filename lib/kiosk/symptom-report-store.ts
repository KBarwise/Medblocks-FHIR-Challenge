import {
  fhirAcknowledgeReturningSymptomReport,
  fhirListNewReturningSymptomReports,
  fhirSaveReturningSymptomReport,
} from './fhir-kiosk-store';

export type ReturningSymptomReport = {
  id: string;
  createdAt: string;
  patientId: string;
  patientName: string;
  birthDate: string;
  symptoms: { code: string; display: string }[];
  urgent: boolean;
  status: 'new' | 'acknowledged';
};

export async function saveReturningSymptomReport(report: ReturningSymptomReport): Promise<void> {
  await fhirSaveReturningSymptomReport(report);
}

export async function listNewReturningSymptomReports(): Promise<ReturningSymptomReport[]> {
  return fhirListNewReturningSymptomReports();
}

export async function acknowledgeReturningSymptomReport(id: string): Promise<void> {
  await fhirAcknowledgeReturningSymptomReport(id);
}
