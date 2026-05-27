/** Semantic HSL tokens for Recharts — see app/globals.css */
export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
] as const;

/** OpenCare-style series accents */
export const VITAL_COLOR = {
  systolic: 'hsl(var(--chart-1))',
  diastolic: 'hsl(var(--chart-1))',
  pulse: 'hsl(var(--chart-5))',
  spo2: 'hsl(var(--chart-1))',
  resp: 'hsl(var(--chart-2))',
  temp: 'hsl(var(--chart-3))',
} as const;

export const COLOR_PRIMARY = 'hsl(var(--primary))';
export const COLOR_DESTRUCTIVE = 'hsl(var(--destructive))';
export const COLOR_MUTED = 'hsl(var(--muted-foreground))';
