export type KioskDemographics = {
  given: string;
  family: string;
  age: number;
  gender: 'male' | 'female' | 'other' | 'unknown';
  phone: string;
  email: string;
};

export type KioskConditionSelection = {
  code: string;
  display: string;
};

export type KioskIntakePathway = 'glp1' | 'diet-exercise';

export type KioskIntakeLead = {
  id: string;
  createdAt: string;
  status: 'pending-registration' | 'registered';
  demographics: KioskDemographics;
  screeningOverall: 'clear' | 'amber' | 'red';
  screeningSummary: string;
  /** GLP-1 eligible vs diet-and-exercise pathway after failed GLP-1 screen */
  pathway: KioskIntakePathway;
  registeredPatientId?: string;
};

/** Approximate birth date from age for registration pre-fill (1 Jan of birth year). */
export function birthDateFromAge(age: number): string {
  const year = new Date().getFullYear() - Math.max(0, Math.min(age, 120));
  return `${year}-01-01`;
}

export function kioskLeadDisplayName(d: KioskDemographics): string {
  return [d.given, d.family].filter(Boolean).join(' ') || 'Unknown';
}

/** Map kiosk intake to registration form defaults. */
export function intakeToRegistrationDefaults(
  lead: KioskIntakeLead,
): {
  given: string;
  family: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  phone: string;
  email: string;
} {
  const g = lead.demographics.gender;
  return {
    given: lead.demographics.given,
    family: lead.demographics.family,
    birthDate: birthDateFromAge(lead.demographics.age),
    gender: g === 'male' || g === 'female' || g === 'other' ? g : 'unknown',
    phone: lead.demographics.phone,
    email: lead.demographics.email,
  };
}
