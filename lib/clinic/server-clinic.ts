import { cookies } from 'next/headers';
import { DEFAULT_CLINIC_NAME, STORAGE_KEYS } from './roles';

export function getClinicNameFromCookie(): string {
  const raw = cookies().get(STORAGE_KEYS.clinicName)?.value;
  if (!raw) return DEFAULT_CLINIC_NAME;
  try {
    const decoded = decodeURIComponent(raw);
    return decoded.trim() || DEFAULT_CLINIC_NAME;
  } catch {
    return raw.trim() || DEFAULT_CLINIC_NAME;
  }
}
