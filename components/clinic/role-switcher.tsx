'use client';

import { useRouter } from 'next/navigation';
import { useClinic } from './clinic-context';
import type { ActingRole } from '@/lib/clinic/roles';
import { homePathForRole } from '@/lib/clinic/nav';

const ROLE_ABBREV: Record<ActingRole, string> = {
  admin: 'Adm',
  reception: 'Rec',
  nurse: 'Nur',
  doctor: 'Doc',
  patient: 'Kio',
};

export function RoleSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const { role, setRole, roles } = useClinic();
  const current = roles.find(r => r.id === role);

  function onChange(next: ActingRole) {
    setRole(next);
    router.push(homePathForRole(next));
  }

  return (
    <div className={collapsed ? 'px-1 pb-2 flex justify-center' : 'px-3 pb-3'}>
      {collapsed ? (
        <select
          value={role}
          onChange={e => onChange(e.target.value as ActingRole)}
          title={current ? `Acting role: ${current.label}` : 'Acting role'}
          aria-label="Acting role"
          className="w-9 h-9 px-0 text-center text-[11px] border border-ink-100 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-accent/40 appearance-none cursor-pointer"
        >
          {roles.map(r => (
            <option key={r.id} value={r.id}>
              {ROLE_ABBREV[r.id]}
            </option>
          ))}
        </select>
      ) : (
        <>
          <label className="block text-[10px] uppercase tracking-wide text-ink-500 mb-1">
            Acting role
          </label>
          <select
            value={role}
            onChange={e => onChange(e.target.value as ActingRole)}
            className="w-full px-2 py-1.5 text-[12px] border border-ink-100 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-accent/40"
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-ink-500 mt-1 leading-snug">{current?.description}</p>
        </>
      )}
    </div>
  );
}
