import { STORAGE_KEYS, type ActingRole } from './roles';

const ROLES: ActingRole[] = ['admin', 'reception', 'nurse', 'doctor', 'patient'];

export function readActingRoleFromDocumentCookie(): ActingRole | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${STORAGE_KEYS.role.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`),
  );
  const value = match?.[1] ? decodeURIComponent(match[1]) : null;
  if (value && ROLES.includes(value as ActingRole)) return value as ActingRole;
  return null;
}

export function readActingRoleFromStorage(): ActingRole | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = localStorage.getItem(STORAGE_KEYS.role);
    if (value && ROLES.includes(value as ActingRole)) return value as ActingRole;
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveClientActingRole(fallback: ActingRole = 'reception'): ActingRole {
  return readActingRoleFromDocumentCookie() ?? readActingRoleFromStorage() ?? fallback;
}
