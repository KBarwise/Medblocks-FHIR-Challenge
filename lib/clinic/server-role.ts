import { cookies } from 'next/headers';
import { STORAGE_KEYS, type ActingRole } from './roles';

const ROLES: ActingRole[] = ['admin', 'reception', 'nurse', 'doctor', 'patient'];

export function getActingRoleFromCookie(): ActingRole {
  const value = cookies().get(STORAGE_KEYS.role)?.value;
  if (value && ROLES.includes(value as ActingRole)) return value as ActingRole;
  return 'reception';
}
