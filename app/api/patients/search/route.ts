import { NextResponse } from 'next/server';
import { searchPatients } from '@/lib/fhir/patient-search';
import { fullName, ageFromBirthDate } from '@/lib/utils';

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ patients: [] });
  }

  try {
    const rows = await searchPatients(q, 25);
    return NextResponse.json({
      patients: rows.map(p => ({
        id: p.id ?? '',
        name: fullName(p),
        birthDate: p.birthDate,
        age: ageFromBirthDate(p.birthDate),
        gender: p.gender,
        mrn:
          p.identifier?.find(i => i.type?.coding?.some(c => c.code === 'MR'))?.value
          ?? p.identifier?.[0]?.value,
      })),
    });
  } catch (e) {
    return NextResponse.json({ patients: [], error: (e as Error).message }, { status: 502 });
  }
}
