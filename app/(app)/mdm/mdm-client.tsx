'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/primitives';
import { useClinic } from '@/components/clinic/clinic-context';
import { patientDestination } from '@/lib/clinic/access';
import {
  runDuplicateScan,
  mergePatientRecords,
  mergeAllDuplicateGroupRecords,
} from './actions';
import type { DuplicateGroup } from '@/lib/fhir/mdm-types';
import { isActivePatient } from '@/lib/fhir/patient-dedupe';
import { patientSummary } from '@/lib/fhir/mdm-types';
import { GitMerge, RefreshCw } from 'lucide-react';

export function MdmClient() {
  const { role } = useClinic();
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null);
  const [scanned, setScanned] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const scan = useCallback(() => {
    startTransition(async () => {
      setMessage(null);
      const result = await runDuplicateScan();
      if (result.error) {
        setMessage(result.error);
        setGroups([]);
        return;
      }
      setGroups(result.groups);
      setScanned(result.scanned);
      setTruncated(result.truncated);
      if (result.groups.length === 0) {
        setMessage(`Scanned ${result.scanned} patients — no duplicate groups found.`);
      }
    });
  }, []);

  useEffect(() => {
    scan();
  }, [scan]);

  function merge(masterId: string, sourceId: string) {
    if (!confirm(`Merge Patient/${sourceId} into Patient/${masterId}? This cannot be undone on all servers.`)) return;
    startTransition(async () => {
      const result = await mergePatientRecords(masterId, sourceId);
      setMessage(result.message);
      if (result.ok) scan();
    });
  }

  function mergeAllGroups() {
    if (!groups || groups.length === 0) return;
    const payload = groups
      .map(g => ({
        masterId: g.patients[0].id!,
        sourceIds: g.patients.slice(1).map(p => p.id!).filter(Boolean),
      }))
      .filter(g => g.sourceIds.length > 0);
    const totalRecords = payload.reduce((n, g) => n + g.sourceIds.length, 0);
    if (totalRecords === 0) return;
    if (
      !confirm(
        `Merge all ${totalRecords} duplicate record${totalRecords === 1 ? '' : 's'} across ${payload.length} group${payload.length === 1 ? '' : 's'}? Each group keeps its first patient as primary. This cannot be undone on all servers.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await mergeAllDuplicateGroupRecords(payload);
      setMessage(result.message);
      if (result.recordsMerged > 0) scan();
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle icon={<GitMerge className="h-4 w-4" />}>Duplicate scan</CardTitle>
        <p className="text-[12px] text-ink-500 mb-3">
          Automatically scans the patient database for matching name + date of birth or shared MRN.
        </p>
        <div className="flex items-center gap-3 mb-2">
          <button
            type="button"
            onClick={scan}
            disabled={pending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[12px] bg-ink-900 text-white rounded-md hover:bg-ink-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${pending ? 'animate-spin' : ''}`} />
            {pending && groups === null ? 'Scanning…' : 'Rescan database'}
          </button>
          {scanned > 0 && (
            <span className="text-[12px] text-ink-500">
              {scanned} patient{scanned === 1 ? '' : 's'} scanned
              {truncated && ' (list truncated — increase server limit for full scan)'}
            </span>
          )}
        </div>
        {message && (
          <p className={`text-[12px] ${message.includes('Merged') || message.includes('Linked') ? 'text-accent' : 'text-ink-500'}`}>
            {message}
          </p>
        )}
      </Card>

      {groups === null && pending && (
        <p className="text-[13px] text-ink-500">Loading and comparing patient records…</p>
      )}

      {groups && groups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13px] font-medium">
              {groups.length} duplicate group{groups.length === 1 ? '' : 's'}
            </p>
            <button
              type="button"
              disabled={pending}
              onClick={mergeAllGroups}
              className="text-[12px] px-3 py-1.5 bg-ink-900 text-white rounded-md hover:bg-ink-700 disabled:opacity-50"
            >
              Merge all groups
            </button>
          </div>
          {groups.map(g => (
            <Card key={g.key}>
              <div className="text-xs text-ink-500 mb-2">{g.reason}</div>
              <ul className="space-y-2">
                {g.patients.map(p => (
                  <li key={p.id} className="flex items-center justify-between gap-2 text-[13px]">
                    <div>
                      <Link href={patientDestination(role, p.id!)} className="font-medium hover:text-info">
                        {patientSummary(p)}
                        {!isActivePatient(p) && (
                          <span className="ml-2 text-[10px] font-normal text-ink-500 uppercase tracking-wide">
                            inactive
                          </span>
                        )}
                      </Link>
                      <div className="text-[11px] text-ink-500 font-mono">Patient/{p.id}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {g.patients.length >= 2 && p.id !== g.patients[0].id && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => merge(g.patients[0].id!, p.id!)}
                          className="text-[11px] px-2 py-1 border border-ink-100 rounded hover:bg-ink-50 disabled:opacity-50"
                        >
                          Merge into primary
                        </button>
                      )}
                      {p.id === g.patients[0].id && (
                        <span className="text-[11px] text-ink-500 px-2 py-1">Primary</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
