export type ProviderFormData = {
  family: string;
  given: string;
  npi: string;
  role: 'doctor' | 'nurse';
  phone: string;
  email: string;
  active: boolean;
};

export type ProviderRow = {
  id: string;
  name: string;
  role: string;
  npi?: string;
  active: boolean;
};

export function emptyProviderForm(): ProviderFormData {
  return {
    family: '',
    given: '',
    npi: '',
    role: 'doctor',
    phone: '',
    email: '',
    active: true,
  };
}
