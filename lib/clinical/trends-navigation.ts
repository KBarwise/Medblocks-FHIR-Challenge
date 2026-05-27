export type TrendsTabId = 'vitals' | 'laboratory';

export function tabFromTrendsParam(value: string | null): TrendsTabId {
  if (value === 'laboratory') return 'laboratory';
  if (value === 'vitals' || value === 'poc') return 'vitals';
  return 'vitals';
}

/** Maps legacy hash section ids from intake sidebar links to overlay tabs. */
export function trendsSectionToTab(section: string): TrendsTabId {
  if (section === 'laboratory-trends') return 'laboratory';
  return 'vitals';
}
