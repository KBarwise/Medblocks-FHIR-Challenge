'use client';

import type { QuantityChartPoint } from '@/lib/clinical/chart-series';

const W = 320;
const H = 120;
const PAD = { t: 8, r: 8, b: 22, l: 36 };

export function ClinicalLineChart({
  points,
  unit,
  refLow,
  refHigh,
}: {
  points: QuantityChartPoint[];
  unit: string;
  refLow?: number;
  refHigh?: number;
}) {
  if (points.length === 0) {
    return (
      <p className="text-[12px] text-ink-500 py-6 text-center border border-dashed border-ink-100 rounded-md">
        No numeric results yet
      </p>
    );
  }

  const values = points.map(p => p.value);
  let yMin = Math.min(...values);
  let yMax = Math.max(...values);
  if (refLow !== undefined) yMin = Math.min(yMin, refLow);
  if (refHigh !== undefined) yMax = Math.max(yMax, refHigh);
  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const yPad = (yMax - yMin) * 0.1 || 1;
  yMin -= yPad;
  yMax += yPad;

  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const xAt = (i: number) =>
    PAD.l + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const yAt = (v: number) => PAD.t + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p.value).toFixed(1)}`)
    .join(' ');

  const refBand =
    refLow !== undefined && refHigh !== undefined
      ? {
          y1: yAt(refHigh),
          y2: yAt(refLow),
        }
      : null;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-full h-auto" role="img">
        {refBand && (
          <rect
            x={PAD.l}
            y={Math.min(refBand.y1, refBand.y2)}
            width={innerW}
            height={Math.abs(refBand.y2 - refBand.y1)}
            fill="var(--accent-soft, #e8f5f0)"
            opacity={0.6}
          />
        )}
        <line
          x1={PAD.l}
          y1={PAD.t + innerH}
          x2={PAD.l + innerW}
          y2={PAD.t + innerH}
          stroke="#e5e5e5"
        />
        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinejoin="round" />
        {points.map((p, i) => (
          <g key={`${p.date}-${i}`}>
            <circle cx={xAt(i)} cy={yAt(p.value)} r={3.5} fill="#2563eb" />
            <text
              x={xAt(i)}
              y={PAD.t + innerH + 14}
              textAnchor="middle"
              fontSize={9}
              fill="#737373"
            >
              {p.date.slice(5)}
            </text>
          </g>
        ))}
        <text x={4} y={PAD.t + 8} fontSize={9} fill="#737373">
          {yMax.toFixed(1)}
        </text>
        <text x={4} y={PAD.t + innerH} fontSize={9} fill="#737373">
          {yMin.toFixed(1)}
        </text>
      </svg>
      <p className="text-[10px] text-ink-500 mt-1 text-right">{unit}</p>
    </div>
  );
}
