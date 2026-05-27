import { PANEL_ANALYTES, type PanelAnalyte } from './panel-analytes';

export type ParsedLabRow = {
  panelId: PanelAnalyte['panelId'];
  code: string;
  display: string;
  unit: string;
  value: number;
  confidence: 'high' | 'medium' | 'low';
  sourceLine: string;
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function lineLooksLikeAnalyte(line: string, synonyms: string[]): boolean {
  const lower = line.toLowerCase();
  return synonyms.some(s => lower.includes(s));
}

function extractValueFromLine(line: string, analyte: PanelAnalyte): number | null {
  const synonymPattern = analyte.synonyms.map(escapeRegex).join('|');
  const re = new RegExp(
    `(?:${synonymPattern})[^\\d]{0,24}([\\d]+(?:\\.[\\d]+)?)\\s*(${escapeRegex(analyte.unit)})?`,
    'i',
  );
  const m = line.match(re);
  if (!m?.[1]) return null;
  const v = parseFloat(m[1]);
  return Number.isNaN(v) ? null : v;
}

/** Rule-based parser for text extracted from lab PDFs (Phase 1). */
export function parseLabReportText(text: string): ParsedLabRow[] {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const found = new Map<string, ParsedLabRow>();

  for (const line of lines) {
    for (const analyte of PANEL_ANALYTES) {
      if (found.has(analyte.code)) continue;
      if (!lineLooksLikeAnalyte(line, analyte.synonyms)) continue;
      const value = extractValueFromLine(line, analyte);
      if (value === null) continue;
      found.set(analyte.code, {
        panelId: analyte.panelId,
        code: analyte.code,
        display: analyte.display,
        unit: analyte.unit,
        value,
        confidence: line.length < 80 ? 'high' : 'medium',
        sourceLine: line.slice(0, 120),
      });
    }
  }

  return [...found.values()].sort((a, b) => a.display.localeCompare(b.display));
}

export function parsedRowsByPanel(rows: ParsedLabRow[]): Record<string, ParsedLabRow[]> {
  const grouped: Record<string, ParsedLabRow[]> = {};
  for (const row of rows) {
    grouped[row.panelId] ??= [];
    grouped[row.panelId].push(row);
  }
  return grouped;
}
