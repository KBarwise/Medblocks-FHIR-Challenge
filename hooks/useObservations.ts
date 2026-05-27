'use client';

import { useQuery } from '@tanstack/react-query';
import {
  ANTHROPOMETRIC_TREND_CODES,
  PRIORITY_LAB_CODES,
} from '@/lib/clinical/trend-metrics';
import {
  isAnthropometricLoinc,
  isLaboratoryLoinc,
} from '@/lib/clinical/trend-code-sets';
import { observationLoincCode } from '@/lib/clinical/observations';
import {
  fetchObservations,
  type FetchObservationsOpts,
  type LoincFilter,
} from '@/lib/fhir/fhirObservations';
import type { Observation } from '@/lib/fhir/resources';

export type UseObservationsOpts = FetchObservationsOpts & {
  enabled?: boolean;
};

function observationCategory(obs: Observation): string | undefined {
  return obs.category?.[0]?.coding?.[0]?.code ?? obs.category?.[0]?.text;
}

export function observationsQueryKey(opts: UseObservationsOpts) {
  return [
    'obs',
    opts.patientId,
    opts.category ?? '',
    opts.codes?.map(c => c.code).join(',') ?? '',
    opts.dateFrom ?? '',
    opts.dateTo ?? '',
  ] as const;
}

export function useObservations(opts: UseObservationsOpts) {
  return useQuery<Observation[], Error>({
    queryKey: observationsQueryKey(opts),
    queryFn: () => fetchObservations(opts),
    staleTime: 60_000,
    enabled: opts.enabled !== false && Boolean(opts.patientId),
  });
}

export function useLabCodeCatalog(patientId: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['obs-lab-codes', patientId, dateFrom ?? '', dateTo ?? ''],
    queryFn: async () => {
      const obs = await fetchObservations({
        patientId,
        category: 'laboratory',
        dateFrom,
        dateTo,
        pageSize: 500,
      });
      const map = new Map<string, string>();
      for (const o of obs) {
        const code = observationLoincCode(o);
        if (!code || o.valueQuantity?.value === undefined) continue;
        if (!isLaboratoryLoinc(code, observationCategory(o))) continue;
        const display =
          o.code?.coding?.find(c => c.code === code)?.display
          ?? o.code?.text
          ?? code;
        map.set(code, display);
      }
      if (map.size === 0) {
        return PRIORITY_LAB_CODES.map(l => ({ code: l.code, display: l.display }));
      }
      return [...map.entries()]
        .map(([code, display]) => ({ code, display }))
        .sort((a, b) => a.display.localeCompare(b.display));
    },
    staleTime: 60_000,
    enabled: Boolean(patientId),
  });
}

export function useAnthropometricCodeCatalog(patientId: string, dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['obs-anthro-codes', patientId, dateFrom ?? '', dateTo ?? ''],
    queryFn: async () => {
      const obs = await fetchObservations({
        patientId,
        category: 'vital-signs',
        dateFrom,
        dateTo,
        pageSize: 500,
      });
      const map = new Map<string, string>();
      for (const o of obs) {
        const code = observationLoincCode(o);
        if (!code || o.valueQuantity?.value === undefined) continue;
        if (!isAnthropometricLoinc(code)) continue;
        const display =
          o.code?.coding?.find(c => c.code === code)?.display
          ?? o.code?.text
          ?? code;
        map.set(code, display);
      }
      if (map.size === 0) {
        return ANTHROPOMETRIC_TREND_CODES.map(a => ({ code: a.code, display: a.display }));
      }
      return [...map.entries()]
        .map(([code, display]) => ({ code, display }))
        .sort((a, b) => a.display.localeCompare(b.display));
    },
    staleTime: 60_000,
    enabled: Boolean(patientId),
  });
}

export type { LoincFilter };
