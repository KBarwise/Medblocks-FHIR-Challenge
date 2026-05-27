import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export function fullName(p: { name?: Array<{ family?: string; given?: string[]; use?: string }> } | undefined): string {
  if (!p?.name?.length) return 'Unknown';
  const n =
    p.name.find(x => x.use === 'official') ??
    p.name.find(x => (x.given?.length ?? 0) > 0 || x.family) ??
    p.name[0];
  const parts = [(n.given ?? []).join(' '), n.family].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Unknown';
}

export function ageFromBirthDate(birthDate?: string): number | undefined {
  if (!birthDate) return undefined;
  const b = new Date(birthDate);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return a;
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('');
}
