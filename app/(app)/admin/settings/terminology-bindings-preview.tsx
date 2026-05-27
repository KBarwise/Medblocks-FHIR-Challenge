import { Card, CardTitle, Chip } from '@/components/ui/primitives';
import { getFhirServerConfig } from '@/lib/fhir/config';
import { expandValueSet, terminologyEndpoints } from '@/lib/terminology/snowstorm';
import { VALUE_SETS, SAFETY_LAB_PANEL } from '@/lib/valuesets';
import { Database, PlugZap } from 'lucide-react';

async function loadExpansions() {
  const entries = Object.entries(VALUE_SETS);
  const results = await Promise.all(
    entries.map(async ([key, vs]) => {
      try {
        const concepts = await expandValueSet('', { ecl: vs.ecl, count: 30 });
        return { key, vs, concepts, error: null as string | null };
      } catch (e) {
        return { key, vs, concepts: [], error: (e as Error).message };
      }
    }),
  );
  return results;
}

export async function TerminologyBindingsPreview() {
  const expansions = await loadExpansions();
  const { ecl, ops } = terminologyEndpoints();
  const fhir = getFhirServerConfig();

  return (
    <div className="space-y-3">
      <Card>
        <CardTitle icon={<PlugZap className="h-4 w-4" />}>Active connections</CardTitle>
        <div className="text-[13px] space-y-1.5">
          <div className="flex justify-between border-b border-ink-100 pb-2 gap-4">
            <span className="text-ink-500 shrink-0">FHIR endpoint</span>
            <div className="text-right min-w-0">
              <div className="text-[12px] text-ink-700">{fhir.label}</div>
              <code className="text-xs font-mono block truncate max-w-[14rem]">
                {fhir.baseUrl || 'not configured'}
              </code>
            </div>
          </div>
          <div className="flex justify-between border-b border-ink-100 pb-2 gap-4">
            <span className="text-ink-500 shrink-0">ECL expand</span>
            <code className="text-xs font-mono text-right max-w-[14rem] truncate">{ecl}</code>
          </div>
          <div className="flex justify-between border-b border-ink-100 pb-2 gap-4">
            <span className="text-ink-500 shrink-0">Validate / lookup</span>
            <code className="text-xs font-mono text-right max-w-[14rem] truncate">{ops}</code>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-500">LOINC laboratory panel</span>
            <span>{SAFETY_LAB_PANEL.length} analytes</span>
          </div>
        </div>
      </Card>

      {expansions.map(({ key, vs, concepts, error }) => (
        <Card key={key}>
          <CardTitle icon={<Database className="h-4 w-4" />}>{vs.title}</CardTitle>
          <div className="font-mono text-[11px] bg-ink-50 text-ink-700 p-2.5 rounded mb-3 break-all">
            {vs.ecl}
          </div>
          {error ? (
            <div className="text-[12px] text-warning">Could not expand: {error}</div>
          ) : (
            <div>
              <div className="text-[11px] text-ink-500 mb-2">{concepts.length} concepts (preview)</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[12px]">
                {concepts.slice(0, 14).map(c => (
                  <div key={c.code} className="flex items-center gap-2 py-1">
                    <Chip>{c.code}</Chip>
                    <span className="truncate">{c.display}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
