import { NextResponse } from 'next/server';
import { dedupePatientRecords } from '@/lib/fhir/patient-dedupe';
import { listAllPatients } from '@/lib/fhir/patients';
import { fullName, ageFromBirthDate } from '@/lib/utils';

/** Explicit opt-in to load full patient directory (privacy). */
export async function GET() {
  try {
    const { patients, total, truncated, error } = await listAllPatients({ max: 500 });
    if (error) {
      return NextResponse.json({ patients: [], error }, { status: 502 });
    }
    return NextResponse.json({
      patients: dedupePatientRecords(patients).map(p => ({
        id: p.id ?? '',
        name: fullName(p),
        birthDate: p.birthDate,
        age: ageFromBirthDate(p.birthDate),
        gender: p.gender,
        active: p.active !== false,
        mrn:
          p.identifier?.find(i => i.type?.coding?.some(c => c.code === 'MR'))?.value
          ?? p.identifier?.[0]?.value,
      })),
      total,
      truncated,
    });
  } catch (e) {
    return NextResponse.json({ patients: [], error: (e as Error).message }, { status: 502 });
  }
}
