export type DiagnosisVerification =
  | 'unconfirmed'
  | 'provisional'
  | 'differential'
  | 'confirmed';
export type DiagnosisClinicalStatus =
  | 'active'
  | 'recurrence'
  | 'relapse'
  | 'inactive'
  | 'remission'
  | 'resolved';

export const VERIFICATION_OPTIONS: { value: DiagnosisVerification; label: string }[] = [
  { value: 'unconfirmed', label: 'Suspected' },
  { value: 'provisional', label: 'Provisional' },
  { value: 'differential', label: 'Differential' },
  { value: 'confirmed', label: 'Confirmed' },
];

export const CLINICAL_STATUS_OPTIONS: { value: DiagnosisClinicalStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'recurrence', label: 'Recurrence' },
  { value: 'relapse', label: 'Relapse' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'remission', label: 'In remission' },
  { value: 'resolved', label: 'Resolved' },
];

/** Subset shown when adding diagnoses during a consultation encounter. */
export const CONSULT_CLINICAL_STATUS_OPTIONS = CLINICAL_STATUS_OPTIONS.filter(o =>
  (['active', 'recurrence', 'relapse'] as const).includes(o.value as 'active' | 'recurrence' | 'relapse'),
);

export type ConsultDiagnosisClinicalStatus = 'active' | 'recurrence' | 'relapse';

export type ConsultDiagnosis = {
  code: string;
  display: string;
  verification: DiagnosisVerification;
  clinicalStatus: ConsultDiagnosisClinicalStatus;
};

export type ProblemListDiagnosis = {
  code: string;
  display: string;
  verification: DiagnosisVerification;
  clinicalStatus: DiagnosisClinicalStatus;
};

export function defaultConsultDiagnosis(code: string, display: string): ConsultDiagnosis {
  return {
    code,
    display,
    verification: 'provisional',
    clinicalStatus: 'active',
  };
}

export function defaultProblemListDiagnosis(code: string, display: string): ProblemListDiagnosis {
  return {
    code,
    display,
    verification: 'provisional',
    clinicalStatus: 'active',
  };
}

export function parseConsultClinicalStatus(code: string | undefined): ConsultDiagnosisClinicalStatus {
  if (code && CONSULT_CLINICAL_STATUS_OPTIONS.some(o => o.value === code)) {
    return code as ConsultDiagnosisClinicalStatus;
  }
  return 'active';
}

export function parseClinicalStatus(code: string | undefined): DiagnosisClinicalStatus {
  if (code && CLINICAL_STATUS_OPTIONS.some(o => o.value === code)) {
    return code as DiagnosisClinicalStatus;
  }
  return 'active';
}

export function parseVerificationStatus(code: string | undefined): DiagnosisVerification {
  if (code && VERIFICATION_OPTIONS.some(o => o.value === code)) {
    return code as DiagnosisVerification;
  }
  return 'confirmed';
}

export function formatDiagnosisQualifiers(dx: {
  clinicalStatus: DiagnosisClinicalStatus;
  verification: DiagnosisVerification;
}): string {
  const v = VERIFICATION_OPTIONS.find(o => o.value === dx.verification)?.label ?? dx.verification;
  const c = CLINICAL_STATUS_OPTIONS.find(o => o.value === dx.clinicalStatus)?.label ?? dx.clinicalStatus;
  return `${c} · ${v}`;
}
