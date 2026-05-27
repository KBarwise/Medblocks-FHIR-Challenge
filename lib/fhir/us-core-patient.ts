import type { CodeableConcept, Coding, Patient } from './resources';
import { validateEmail, validatePhone } from '@/lib/validation/contact';

/** US Core Patient profile and identity extension URLs (STU6). */
export const US_CORE_PATIENT_PROFILE =
  'http://hl7.org/fhir/us/core/StructureDefinition/us-core-patient';
export const US_CORE_RACE =
  'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race';
export const US_CORE_ETHNICITY =
  'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity';
export const US_CORE_BIRTHSEX =
  'http://hl7.org/fhir/us/core/StructureDefinition/us-core-birthsex';
export const US_CORE_GENDER_IDENTITY =
  'http://hl7.org/fhir/us/core/StructureDefinition/us-core-genderIdentity';

export const CDC_RACE_ETHNICITY_SYSTEM = 'urn:oid:2.16.840.1.113883.6.238';
export const GENDER_IDENTITY_SYSTEM = 'http://terminology.hl7.org/CodeSystem/gender-identity';
export const DEFAULT_MRN_SYSTEM = 'http://hospital.smarthealthit.org';

export const OMB_RACE_OPTIONS = [
  { code: '1002-5', display: 'American Indian or Alaska Native' },
  { code: '2028-9', display: 'Asian' },
  { code: '2054-5', display: 'Black or African American' },
  { code: '2076-8', display: 'Native Hawaiian or Other Pacific Islander' },
  { code: '2106-3', display: 'White' },
] as const;

export const OMB_ETHNICITY_OPTIONS = [
  { code: '2135-2', display: 'Hispanic or Latino' },
  { code: '2186-5', display: 'Not Hispanic or Latino' },
] as const;

export const BIRTH_SEX_OPTIONS = [
  { code: 'M', display: 'Male' },
  { code: 'F', display: 'Female' },
  { code: 'UNK', display: 'Unknown' },
] as const;

export const GENDER_IDENTITY_OPTIONS = [
  { code: 'male', display: 'Male' },
  { code: 'female', display: 'Female' },
  { code: 'non-binary', display: 'Non-binary' },
  { code: 'transgender-male', display: 'Transgender male' },
  { code: 'transgender-female', display: 'Transgender female' },
  { code: 'other', display: 'Other' },
  { code: 'unknown', display: 'Unknown' },
] as const;

type FhirExtension = {
  url: string;
  valueCode?: string;
  valueString?: string;
  valueCodeableConcept?: CodeableConcept;
  valueCoding?: Coding;
  extension?: FhirExtension[];
};

export type PatientFormData = {
  active: boolean;
  mrnSystem: string;
  mrnValue: string;
  family: string;
  given: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthDate: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  raceOmbCodes: string[];
  raceText: string;
  ethnicityOmbCode: string;
  ethnicityText: string;
  birthSex: '' | 'M' | 'F' | 'UNK';
  genderIdentityCode: string;
};

export function generateMrn(): string {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${t}${r}`.slice(-10);
}

export const emptyPatientForm = (): PatientFormData => ({
  active: true,
  mrnSystem: DEFAULT_MRN_SYSTEM,
  mrnValue: generateMrn(),
  family: '',
  given: '',
  gender: 'unknown',
  birthDate: '',
  phone: '',
  email: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  raceOmbCodes: [],
  raceText: '',
  ethnicityOmbCode: '',
  ethnicityText: '',
  birthSex: '',
  genderIdentityCode: '',
});

function extByUrl(extensions: FhirExtension[] | undefined, url: string): FhirExtension | undefined {
  return extensions?.find(e => e.url === url);
}

function nestedExts(ext: FhirExtension | undefined): FhirExtension[] {
  return ext?.extension ?? [];
}

function nestedByUrl(ext: FhirExtension | undefined, partUrl: string): FhirExtension[] {
  return nestedExts(ext).filter(e => e.url === partUrl);
}

function codingFromExt(ext: FhirExtension): Coding | undefined {
  return ext.valueCoding;
}

export function parseUsCorePatient(patient: Patient): PatientFormData {
  const exts = (patient.extension ?? []) as FhirExtension[];
  const raceExt = extByUrl(exts, US_CORE_RACE);
  const ethnicityExt = extByUrl(exts, US_CORE_ETHNICITY);
  const birthSexExt = extByUrl(exts, US_CORE_BIRTHSEX);
  const genderIdExt = extByUrl(exts, US_CORE_GENDER_IDENTITY);

  const raceOmbCodes = nestedByUrl(raceExt, 'ombCategory')
    .map(codingFromExt)
    .map(c => c?.code)
    .filter((c): c is string => Boolean(c));

  const raceText =
    nestedByUrl(raceExt, 'text')[0]?.valueString ?? '';

  const ethnicityOmb = nestedByUrl(ethnicityExt, 'ombCategory')[0];
  const ethnicityOmbCode = codingFromExt(ethnicityOmb ?? {})?.code ?? '';
  const ethnicityText =
    nestedByUrl(ethnicityExt, 'text')[0]?.valueString ??
    ethnicityOmb?.valueCoding?.display ??
    '';

  const birthSex = (birthSexExt?.valueCode ?? '') as PatientFormData['birthSex'];

  const giCoding = genderIdExt?.valueCodeableConcept?.coding?.[0];
  const genderIdentityCode = giCoding?.code ?? '';

  const id = patient.identifier?.[0];
  const name = patient.name?.[0];
  const phone = patient.telecom?.find(t => t.system === 'phone');
  const email = patient.telecom?.find(t => t.system === 'email');
  const addr = patient.address?.[0];

  return {
    active: patient.active ?? true,
    mrnSystem: id?.system ?? DEFAULT_MRN_SYSTEM,
    mrnValue: id?.value ?? '',
    family: name?.family ?? '',
    given: (name?.given ?? []).join(' '),
    gender: patient.gender ?? 'unknown',
    birthDate: patient.birthDate ?? '',
    phone: phone?.value ?? '',
    email: email?.value ?? '',
    addressLine: (addr?.line ?? []).join(', '),
    city: addr?.city ?? '',
    state: addr?.state ?? '',
    postalCode: addr?.postalCode ?? '',
    raceOmbCodes,
    raceText,
    ethnicityOmbCode,
    ethnicityText,
    birthSex,
    genderIdentityCode,
  };
}

function buildRaceExtension(form: PatientFormData): FhirExtension | null {
  if (form.raceOmbCodes.length === 0 && !form.raceText.trim()) return null;

  const inner: FhirExtension[] = [];
  for (const code of form.raceOmbCodes) {
    const opt = OMB_RACE_OPTIONS.find(o => o.code === code);
    if (!opt) continue;
    inner.push({
      url: 'ombCategory',
      valueCoding: {
        system: CDC_RACE_ETHNICITY_SYSTEM,
        code: opt.code,
        display: opt.display,
      },
    });
  }
  const text =
    form.raceText.trim() ||
    form.raceOmbCodes
      .map(c => OMB_RACE_OPTIONS.find(o => o.code === c)?.display)
      .filter(Boolean)
      .join(', ');
  if (text) {
    inner.push({ url: 'text', valueString: text });
  }
  if (inner.length === 0) return null;

  return { url: US_CORE_RACE, extension: inner };
}

function buildEthnicityExtension(form: PatientFormData): FhirExtension | null {
  if (!form.ethnicityOmbCode) return null;

  const inner: FhirExtension[] = [];
  const opt = OMB_ETHNICITY_OPTIONS.find(o => o.code === form.ethnicityOmbCode);
  if (opt) {
    inner.push({
      url: 'ombCategory',
      valueCoding: {
        system: CDC_RACE_ETHNICITY_SYSTEM,
        code: opt.code,
        display: opt.display,
      },
    });
  }
  const text = form.ethnicityText.trim() || opt?.display || '';
  if (text) {
    inner.push({ url: 'text', valueString: text });
  }
  if (inner.length === 0) return null;

  return { url: US_CORE_ETHNICITY, extension: inner };
}

function buildIdentityExtensions(form: PatientFormData): FhirExtension[] {
  const extensions: FhirExtension[] = [];

  const race = buildRaceExtension(form);
  if (race) extensions.push(race);

  const ethnicity = buildEthnicityExtension(form);
  if (ethnicity) extensions.push(ethnicity);

  if (form.birthSex) {
    extensions.push({
      url: US_CORE_BIRTHSEX,
      valueCode: form.birthSex,
    });
  }

  if (form.genderIdentityCode) {
    const opt = GENDER_IDENTITY_OPTIONS.find(o => o.code === form.genderIdentityCode);
    extensions.push({
      url: US_CORE_GENDER_IDENTITY,
      valueCodeableConcept: {
        coding: [{
          system: GENDER_IDENTITY_SYSTEM,
          code: form.genderIdentityCode,
          display: opt?.display,
        }],
        text: opt?.display,
      },
    });
  }

  return extensions;
}

export function buildUsCorePatient(
  form: PatientFormData,
  existing?: Patient,
): Patient {
  const telecom: Patient['telecom'] = [];
  if (form.phone.trim()) {
    telecom.push({ system: 'phone', value: form.phone.trim(), use: 'home' });
  }
  if (form.email.trim()) {
    telecom.push({ system: 'email', value: form.email.trim() });
  }

  const address: Patient['address'] = [];
  if (form.addressLine.trim() || form.city.trim() || form.state.trim() || form.postalCode.trim()) {
    address.push({
      use: 'home',
      line: form.addressLine.trim() ? [form.addressLine.trim()] : undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      postalCode: form.postalCode.trim() || undefined,
      country: 'US',
    });
  }

  const given = form.given.trim().split(/\s+/).filter(Boolean);

  const resource: Patient = {
    resourceType: 'Patient',
    ...(existing?.id ? { id: existing.id } : {}),
    meta: {
      profile: [US_CORE_PATIENT_PROFILE],
    },
    active: form.active,
    identifier: [{
      use: 'usual',
      type: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
          code: 'MR',
          display: 'Medical Record Number',
        }],
        text: 'Medical Record Number',
      },
      system: form.mrnSystem.trim() || DEFAULT_MRN_SYSTEM,
      value: form.mrnValue.trim(),
    }],
    name: [{
      use: 'official',
      family: form.family.trim() || undefined,
      given: given.length > 0 ? given : undefined,
    }],
    gender: form.gender,
    ...(form.birthDate ? { birthDate: form.birthDate } : {}),
    ...(telecom.length > 0 ? { telecom } : {}),
    ...(address.length > 0 ? { address } : {}),
    extension: buildIdentityExtensions(form),
  };

  return resource;
}

export type PatientFormField = keyof PatientFormData | 'name';

export type PatientFormErrors = Partial<Record<PatientFormField, string>>;

export type PatientFormTab = 'demographics' | 'identity' | 'contact';

const FIELD_TAB: Record<PatientFormField, PatientFormTab> = {
  mrnValue: 'demographics',
  mrnSystem: 'demographics',
  given: 'demographics',
  family: 'demographics',
  name: 'demographics',
  gender: 'demographics',
  birthDate: 'demographics',
  birthSex: 'demographics',
  active: 'demographics',
  raceOmbCodes: 'identity',
  raceText: 'identity',
  ethnicityOmbCode: 'identity',
  ethnicityText: 'identity',
  genderIdentityCode: 'identity',
  phone: 'contact',
  email: 'contact',
  addressLine: 'contact',
  city: 'contact',
  state: 'contact',
  postalCode: 'contact',
};

const ZIP_RE = /^\d{5}(-\d{4})?$/;

/** Field-level validation shared by the registration form and server actions. */
export function validatePatientFormFields(form: PatientFormData): PatientFormErrors {
  const errors: PatientFormErrors = {};

  if (!form.mrnValue.trim()) {
    errors.mrnValue = 'MRN is required';
  }

  if (!form.family.trim() && !form.given.trim()) {
    errors.name = 'Enter a family name, given name, or both';
  }

  if (form.birthDate) {
    const dob = new Date(`${form.birthDate}T12:00:00`);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dob > today) {
      errors.birthDate = 'Date of birth cannot be in the future';
    }
  }

  if (form.email.trim()) {
    const emailErr = validateEmail(form.email);
    if (emailErr) errors.email = emailErr;
  }

  if (form.phone.trim()) {
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errors.phone = phoneErr;
  }

  if (form.state.trim() && !/^[A-Za-z]{2}$/.test(form.state.trim())) {
    errors.state = 'Use a 2-letter state code (e.g. CA)';
  }

  if (form.postalCode.trim() && !ZIP_RE.test(form.postalCode.trim())) {
    errors.postalCode = 'Use a 5-digit ZIP or ZIP+4 (e.g. 90210 or 90210-1234)';
  }

  if (form.raceOmbCodes.length > 0 && !form.raceText.trim()) {
    const auto = form.raceOmbCodes
      .map(c => OMB_RACE_OPTIONS.find(o => o.code === c)?.display)
      .filter(Boolean)
      .join(', ');
    if (!auto) {
      errors.raceText = 'Race text is required when categories are selected';
    }
  }

  return errors;
}

export function patientFormTabHasErrors(errors: PatientFormErrors, tab: PatientFormTab): boolean {
  return Object.keys(errors).some(field => FIELD_TAB[field as PatientFormField] === tab);
}

export function firstPatientFormTabWithErrors(errors: PatientFormErrors): PatientFormTab | null {
  const order: PatientFormTab[] = ['demographics', 'identity', 'contact'];
  for (const tab of order) {
    if (Object.entries(errors).some(([field]) => FIELD_TAB[field as PatientFormField] === tab)) {
      return tab;
    }
  }
  return null;
}

/** Validation for a single registration step (Next button). */
export function validatePatientFormTab(
  form: PatientFormData,
  tab: PatientFormTab,
): PatientFormErrors {
  const all = validatePatientFormFields(form);
  const tabErrors: PatientFormErrors = {};
  for (const [field, message] of Object.entries(all)) {
    if (FIELD_TAB[field as PatientFormField] === tab) {
      tabErrors[field as PatientFormField] = message;
    }
  }
  return tabErrors;
}

export function canCreatePatientDraft(form: PatientFormData): boolean {
  return Boolean(form.mrnValue.trim() && (form.given.trim() || form.family.trim()));
}

/** Errors that block autosave (invalid filled-in values). */
export function autosaveBlockingErrors(errors: PatientFormErrors): boolean {
  const keys: PatientFormField[] = [
    'mrnValue',
    'birthDate',
    'email',
    'phone',
    'state',
    'postalCode',
    'raceText',
  ];
  return keys.some(k => errors[k]);
}

export const PATIENT_FORM_TAB_ORDER: PatientFormTab[] = ['demographics', 'identity', 'contact'];

export function clearTabErrors(errors: PatientFormErrors, tab: PatientFormTab): PatientFormErrors {
  const next = { ...errors };
  for (const field of Object.keys(next) as PatientFormField[]) {
    if (FIELD_TAB[field] === tab) delete next[field];
  }
  return next;
}

export function validatePatientForm(form: PatientFormData): string | null {
  const errors = validatePatientFormFields(form);
  return Object.values(errors)[0] ?? null;
}
