import { STORAGE_KEYS } from './roles';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function readClinicNameFromDocumentCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${STORAGE_KEYS.clinicName}=`;
  const entry = document.cookie.split('; ').find(c => c.startsWith(prefix));
  if (!entry) return null;
  const raw = entry.slice(prefix.length);
  try {
    const decoded = decodeURIComponent(raw);
    return decoded.trim() || null;
  } catch {
    return raw.trim() || null;
  }
}

export function writeClinicNameDocumentCookie(name: string): void {
  document.cookie = `${STORAGE_KEYS.clinicName}=${encodeURIComponent(name)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}
