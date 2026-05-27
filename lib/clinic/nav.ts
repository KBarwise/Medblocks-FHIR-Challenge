import type { ActingRole } from './roles';

export type NavItem = {
  href: string;
  label: string;
};

export const NAV_BY_ROLE: Record<ActingRole, NavItem[]> = {
  admin: [
    { href: '/admin/settings', label: 'Clinic Settings' },
    { href: '/admin/providers', label: 'Provider Registry' },
    { href: '/patients', label: 'Find Patient' },
    { href: '/register', label: 'Register Patients' },
    { href: '/reception/book', label: 'Book Appointment' },
    { href: '/mdm', label: 'Patient Merge' },
  ],
  reception: [
    { href: '/reception', label: 'Reception desk' },
    { href: '/patients', label: 'Find patient' },
    { href: '/register', label: 'Register' },
    { href: '/reception/book', label: 'Book appointment' },
    { href: '/mdm', label: 'Patient Merge' },
  ],
  nurse: [
    { href: '/clinic/nurse', label: 'Nurse Queue' },
  ],
  doctor: [
    { href: '/clinic/doctor', label: "Doctor's Queue" },
  ],
  patient: [
    { href: '/kiosk', label: 'Pre-screening Kiosk' },
  ],
};

export function homePathForRole(role: ActingRole): string {
  switch (role) {
    case 'admin': return '/admin/settings';
    case 'reception': return '/reception';
    case 'nurse': return '/clinic/nurse';
    case 'doctor': return '/clinic/doctor';
    case 'patient': return '/kiosk';
  }
}
