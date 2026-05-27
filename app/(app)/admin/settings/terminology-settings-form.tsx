'use client';

import { useState, useTransition } from 'react';
import {
  TERMINOLOGY_PRESETS,
  type TerminologyPresetId,
} from '@/lib/terminology/servers';
import { saveTerminologyConfig, testTerminologyConnection } from './actions';

const inputClass = 'w-full px-3 py-2 border border-ink-100 rounded-md text-[13px]';

export function TerminologySettingsForm({
  initial,
}: {
  initial: {
    presetId: TerminologyPresetId;
    label: string;
    eclBaseUrl: string;
    opsBaseUrl: string;
    hasAuthHeader: boolean;
    customEclUrl: string;
    customOpsUrl: string;
  };
}) {
  const [presetId, setPresetId] = useState<TerminologyPresetId>(initial.presetId);
  const [customEclUrl, setCustomEclUrl] = useState(
    initial.presetId === 'custom' ? initial.eclBaseUrl : initial.customEclUrl || '',
  );
  const [customOpsUrl, setCustomOpsUrl] = useState(
    initial.presetId === 'custom' && initial.opsBaseUrl !== initial.eclBaseUrl
      ? initial.opsBaseUrl
      : initial.customOpsUrl || '',
  );
  const [useAuth, setUseAuth] = useState(initial.hasAuthHeader);
  const [authHeader, setAuthHeader] = useState('');
  const [clearAuth, setClearAuth] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isOk, setIsOk] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedPreset = TERMINOLOGY_PRESETS.find(p => p.id === presetId);

  function buildInput() {
    return {
      presetId,
      customEclUrl: presetId === 'custom' ? customEclUrl : undefined,
      customOpsUrl: presetId === 'custom' ? customOpsUrl : undefined,
      useAuth: presetId === 'custom' && useAuth,
      authHeader: authHeader.trim() || undefined,
      clearAuth: presetId === 'custom' && clearAuth,
    };
  }

  function onTest() {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await testTerminologyConnection(buildInput());
        setIsOk(result.ok);
        setMessage(result.message);
      } catch (e) {
        setIsOk(false);
        setMessage((e as Error).message);
      }
    });
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveTerminologyConfig(buildInput());
        setIsOk(result.ok);
        setMessage(result.ok ? `Saved. ${result.message}` : result.message);
        if (result.ok) {
          setAuthHeader('');
          setClearAuth(false);
          window.location.reload();
        }
      } catch (err) {
        setIsOk(false);
        setMessage((err as Error).message);
      }
    });
  }

  return (
    <form onSubmit={onSave} className="space-y-4 text-[13px]">
      <p className="text-[12px] text-ink-500">
        Active: <span className="font-medium text-ink-700">{initial.label}</span>
        {initial.eclBaseUrl && (
          <span className="block mt-1 space-y-0.5">
            <span className="block text-[11px] text-ink-500">ECL expand</span>
            <code className="font-mono text-[11px] truncate block">{initial.eclBaseUrl}</code>
            <span className="block text-[11px] text-ink-500 mt-1">Validate / lookup</span>
            <code className="font-mono text-[11px] truncate block">{initial.opsBaseUrl}</code>
          </span>
        )}
      </p>

      <div>
        <label className="block text-xs text-ink-500 mb-1.5">Terminology server</label>
        <select
          className={inputClass}
          value={presetId}
          onChange={e => setPresetId(e.target.value as TerminologyPresetId)}
        >
          {TERMINOLOGY_PRESETS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
        {selectedPreset && (
          <p className="text-[11px] text-ink-500 mt-1">{selectedPreset.description}</p>
        )}
      </div>

      {presetId === 'custom' && (
        <>
          <div>
            <label className="block text-xs text-ink-500 mb-1.5">ECL $expand base URL</label>
            <input
              className={inputClass}
              value={customEclUrl}
              onChange={e => setCustomEclUrl(e.target.value)}
              placeholder="https://snowstorm.example.com/fhir"
              required
            />
            <p className="text-[11px] text-ink-500 mt-1">
              Used for implicit SNOMED value set expansion (ECL queries).
            </p>
          </div>
          <div>
            <label className="block text-xs text-ink-500 mb-1.5">
              Validate / lookup base URL <span className="text-ink-400">(optional)</span>
            </label>
            <input
              className={inputClass}
              value={customOpsUrl}
              onChange={e => setCustomOpsUrl(e.target.value)}
              placeholder="Defaults to ECL URL when empty"
            />
            <p className="text-[11px] text-ink-500 mt-1">
              Used for $validate-code and $lookup. Leave blank to use the ECL server.
            </p>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useAuth}
                onChange={e => {
                  setUseAuth(e.target.checked);
                  if (!e.target.checked) setClearAuth(true);
                }}
                className="rounded border-ink-100"
              />
              <span>Send Authorization header</span>
            </label>
            {useAuth && (
              <input
                type="password"
                className={inputClass}
                value={authHeader}
                onChange={e => {
                  setAuthHeader(e.target.value);
                  setClearAuth(false);
                }}
                placeholder={
                  initial.hasAuthHeader
                    ? 'Leave blank to keep current header'
                    : 'Bearer eyJ… or Basic …'
                }
                autoComplete="off"
              />
            )}
            {initial.hasAuthHeader && useAuth && (
              <label className="flex items-center gap-2 text-[12px] text-ink-500">
                <input
                  type="checkbox"
                  checked={clearAuth}
                  onChange={e => setClearAuth(e.target.checked)}
                  className="rounded border-ink-100"
                />
                Remove stored authorization header
              </label>
            )}
          </div>
        </>
      )}

      {presetId === 'env' && (
        <p className="text-[12px] text-ink-500 rounded-md bg-ink-50 border border-ink-100 p-3">
          Uses <code className="text-[11px]">TERMINOLOGY_ECL_BASE_URL</code>,{' '}
          <code className="text-[11px]">TERMINOLOGY_BASE_URL</code>, and{' '}
          <code className="text-[11px]">TERMINOLOGY_AUTH_HEADER</code> from{' '}
          <code className="text-[11px]">.env.local</code>.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTest}
          disabled={pending}
          className="px-4 py-2 text-[12px] border border-ink-100 rounded-md bg-white hover:bg-ink-50 disabled:opacity-50"
        >
          {pending ? 'Testing…' : 'Test connection'}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 bg-ink-900 text-white text-[12px] rounded-md hover:bg-ink-700 disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save & apply'}
        </button>
      </div>

      {message && (
        <p className={`text-[12px] ${isOk ? 'text-accent' : 'text-danger'}`} role="status">
          {message}
        </p>
      )}
    </form>
  );
}
