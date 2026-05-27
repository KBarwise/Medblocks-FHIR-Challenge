import type { Observation } from '@/lib/fhir/resources';
import { codedObservationValue, observationsWithLoinc } from './observations';
import type { ChartMetric } from './chart-metrics';

export type QuantityChartPoint = {
  date: string;
  value: number;
};

export type CodedChartPoint = {
  date: string;
  value: string;
};

export function buildQuantitySeries(
  observations: Observation[],
  loinc: string,
): QuantityChartPoint[] {
  return observationsWithLoinc(observations, loinc)
    .filter(o => o.valueQuantity?.value !== undefined)
    .map(o => ({
      date: (o.effectiveDateTime ?? '').slice(0, 10),
      value: o.valueQuantity!.value!,
    }))
    .filter(p => p.date)
    .reverse();
}

export function buildCodedSeries(observations: Observation[], loinc: string): CodedChartPoint[] {
  return observationsWithLoinc(observations, loinc)
    .map(o => {
      const value = codedObservationValue(o);
      if (!value) return null;
      const date = (o.effectiveDateTime ?? '').slice(0, 10);
      if (!date) return null;
      return { date, value };
    })
    .filter((p): p is CodedChartPoint => p !== null)
    .reverse();
}

export function seriesForMetric(
  observations: Observation[],
  metric: ChartMetric,
): QuantityChartPoint[] | CodedChartPoint[] {
  if (metric.kind === 'coded') {
    return buildCodedSeries(observations, metric.loinc);
  }
  return buildQuantitySeries(observations, metric.loinc);
}
