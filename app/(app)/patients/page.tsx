import { searchPatientsByName } from '@/lib/fhir/appointments';
import { PatientsView } from './patients-view';

export const dynamic = 'force-dynamic';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q?.trim() ?? '';

  let searchResults: Awaited<ReturnType<typeof searchPatientsByName>> = [];
  let searchError: string | null = null;

  if (query.length >= 2) {
    try {
      searchResults = await searchPatientsByName(query, 50);
    } catch (e) {
      searchError = (e as Error).message;
    }
  }

  return (
    <PatientsView
      query={query}
      searchResults={searchResults}
      searchError={searchError}
    />
  );
}
