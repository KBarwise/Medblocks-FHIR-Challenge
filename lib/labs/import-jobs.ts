import type { ParsedLabRow } from '@/lib/clinical/parse-lab-report';

export type LabImportJob = {
  id: string;
  patientId: string;
  fileName: string;
  createdAt: string;
  status: 'parsed' | 'committed' | 'failed';
  extractionMethod: 'pdf-text' | 'paste';
  rawTextPreview: string;
  rows: ParsedLabRow[];
  error?: string;
};

const jobs = new Map<string, LabImportJob>();

export function createLabImportJob(job: LabImportJob): void {
  jobs.set(job.id, job);
}

export function getLabImportJob(jobId: string): LabImportJob | undefined {
  return jobs.get(jobId);
}

export function updateLabImportJob(jobId: string, patch: Partial<LabImportJob>): LabImportJob | undefined {
  const existing = jobs.get(jobId);
  if (!existing) return undefined;
  const next = { ...existing, ...patch };
  jobs.set(jobId, next);
  return next;
}
