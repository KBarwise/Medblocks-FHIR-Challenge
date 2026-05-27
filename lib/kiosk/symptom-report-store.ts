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

const reports = new Map<string, ReturningSymptomReport>();

export function saveReturningSymptomReport(report: ReturningSymptomReport): void {
  reports.set(report.id, report);
}

export function listNewReturningSymptomReports(): ReturningSymptomReport[] {
  return [...reports.values()]
    .filter(r => r.status === 'new')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function acknowledgeReturningSymptomReport(id: string): void {
  const r = reports.get(id);
  if (!r) return;
  reports.set(id, { ...r, status: 'acknowledged' });
}
