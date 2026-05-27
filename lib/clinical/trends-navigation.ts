export type TrendsTabId = 'vitals' | 'poc' | 'laboratory';

export function tabFromTrendsParam(value: string | null): TrendsTabId {
  if (value === 'poc' || value === 'laboratory' || value === 'vitals') return value;
  return 'vitals';
}

/** Maps legacy hash section ids from intake sidebar links to overlay tabs. */
export function trendsSectionToTab(section: string): TrendsTabId {
  if (section === 'laboratory-trends') return 'laboratory';
  if (section.includes('poc')) return 'poc';
  return 'vitals';
}
