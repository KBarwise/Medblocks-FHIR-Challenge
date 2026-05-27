'use client';

import { useState, useTransition } from 'react';
import { commitLabImport } from '../actions';
import { panelLabel } from '@/lib/clinical/panel-analytes';
import type { ParsedLabRow } from '@/lib/clinical/parse-lab-report';
import { parsedRowsByPanel } from '@/lib/clinical/parse-lab-report';
import { inputClass, labelClass } from '@/components/clinical/form-styles';

type ImportRow = ParsedLabRow & { selected: boolean; editedValue: string };

export function LabImportPanel({ patientId }: { patientId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function runImport() {
    setError(null);
    setStatus(null);
    const form = new FormData();
    if (file) form.append('file', file);
    else if (pasteText.trim()) form.append('text', pasteText.trim());
    else {
      setError('Choose a PDF or paste lab report text.');
      return;
    }

    const res = await fetch(`/api/patients/${patientId}/labs/import`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Import failed');
      return;
    }

    setPreview(data.rawTextPreview ?? '');
    setRows(
      (data.rows as ParsedLabRow[]).map(r => ({
        ...r,
        selected: true,
        editedValue: String(r.value),
      })),
    );
    setStatus(
      data.rowCount > 0
        ? `Parsed ${data.rowCount} result(s) from ${data.fileName}`
        : 'No analytes matched — add rows manually or paste clearer text.',
    );
  }

  function toggleRow(code: string) {
    setRows(prev => prev.map(r => (r.code === code ? { ...r, selected: !r.selected } : r)));
  }

  function updateValue(code: string, value: string) {
    setRows(prev => prev.map(r => (r.code === code ? { ...r, editedValue: value } : r)));
  }

  function onCommit() {
    const selected = rows.filter(r => r.selected && r.editedValue.trim());
    if (selected.length === 0) {
      setError('Select at least one result to save.');
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const r = await commitLabImport(
          patientId,
          selected.map(row => ({
            code: row.code,
            display: row.display,
            unit: row.unit,
            value: parseFloat(row.editedValue),
          })),
        );
        setStatus(`Saved ${r.created} lab observation(s) to FHIR`);
        setRows([]);
        setFile(null);
        setPasteText('');
      } catch (e) {
        setError((e as Error).message);
      }
    });
  }

  const grouped = parsedRowsByPanel(
    rows.map(r => ({
      ...r,
      value: parseFloat(r.editedValue) || r.value,
    })),
  );

  return (
    <div className="space-y-4">
      <p className="text-[12px] text-ink-500">
        Upload a text-based lab PDF or paste report text. Parsed values are shown for review before saving as FHIR
        Observations (CBC, U&amp;E, LFT, cholesterol, lipase).
      </p>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className={labelClass}>Lab PDF</label>
          <input
            type="file"
            accept="application/pdf,.pdf,text/plain"
            className={inputClass}
            onChange={e => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className={labelClass}>Or paste report text</label>
          <textarea
            className={`${inputClass} min-h-[100px] font-mono text-[12px]`}
            placeholder="Paste lab report text if PDF is scanned or parsing fails…"
            value={pasteText}
            onChange={e => setPasteText(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() => void runImport()}
        className="px-3 py-2 text-[12px] border border-ink-100 rounded-md bg-white hover:bg-ink-50 disabled:opacity-50"
      >
        {pending ? 'Parsing…' : 'Parse lab report'}
      </button>

      {status && <p className="text-[12px] text-accent">{status}</p>}
      {error && <p className="text-[12px] text-danger">{error}</p>}

      {preview && rows.length === 0 && (
        <pre className="text-[11px] bg-ink-50 border border-ink-100 rounded-md p-3 overflow-x-auto whitespace-pre-wrap">
          {preview}
        </pre>
      )}

      {rows.length > 0 && (
        <div className="border border-ink-100 rounded-lg overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-ink-50 text-left text-ink-500 border-b border-ink-100">
                <th className="p-2 w-8" />
                <th className="p-2">Panel</th>
                <th className="p-2">Analyte</th>
                <th className="p-2">Value</th>
                <th className="p-2">Unit</th>
                <th className="p-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([panelId, panelRows]) =>
                panelRows.map(row => (
                  <tr key={row.code} className="border-b border-ink-100 last:border-b-0">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={rows.find(r => r.code === row.code)?.selected ?? false}
                        onChange={() => toggleRow(row.code)}
                      />
                    </td>
                    <td className="p-2 text-ink-500">{panelLabel(panelId as ImportRow['panelId'])}</td>
                    <td className="p-2 font-medium">{row.display}</td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="any"
                        className={`${inputClass} !py-1`}
                        value={rows.find(r => r.code === row.code)?.editedValue ?? ''}
                        onChange={e => updateValue(row.code, e.target.value)}
                      />
                    </td>
                    <td className="p-2 text-ink-500">{row.unit}</td>
                    <td className="p-2 text-ink-500 max-w-[180px] truncate" title={row.sourceLine}>
                      {row.sourceLine}
                    </td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
          <div className="p-3 border-t border-ink-100 bg-white">
            <button
              type="button"
              disabled={pending}
              onClick={onCommit}
              className="px-4 py-2 bg-ink-900 text-white text-[12px] rounded-md hover:bg-ink-700 disabled:opacity-50"
            >
              {pending ? 'Saving…' : 'Save selected results to chart'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
