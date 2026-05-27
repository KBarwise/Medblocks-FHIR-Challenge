'use client';

import type { DotProps } from 'recharts';
import { COLOR_DESTRUCTIVE } from '@/lib/clinical/trend-chart-tokens';
import type { TrendPoint } from '@/lib/clinical/observationToPoints';

export function CustomDot({
  cx,
  cy,
  stroke,
  payload,
  dataKey,
}: DotProps & { payload?: Record<string, unknown>; dataKey?: string | number }) {
  if (cx === undefined || cy === undefined || !dataKey) return null;
  const key = String(dataKey);
  const meta = payload?.[`__meta_${key}`] as TrendPoint | undefined;
  const out = meta?.outOfRange;
  const fill = out ? COLOR_DESTRUCTIVE : (stroke as string);
  return <circle cx={cx} cy={cy} r={out ? 5 : 3} fill={fill} stroke={fill} strokeWidth={0} />;
}
