import 'server-only';

import { cookies } from 'next/headers';
import {
  TERMINOLOGY_COOKIE,
  isTerminologyPresetId,
  resolveTerminologyConfig,
  type TerminologyConfig,
  type TerminologyPresetId,
} from './servers';

export function getTerminologyConfig(): TerminologyConfig {
  const jar = cookies();
  const presetRaw = jar.get(TERMINOLOGY_COOKIE.preset)?.value;
  const presetId: TerminologyPresetId = isTerminologyPresetId(presetRaw) ? presetRaw : 'env';
  const customEclUrl = jar.get(TERMINOLOGY_COOKIE.eclUrl)?.value ?? '';
  const customOpsUrl = jar.get(TERMINOLOGY_COOKIE.opsUrl)?.value ?? '';
  const customAuthHeader = jar.get(TERMINOLOGY_COOKIE.auth)?.value ?? '';

  return resolveTerminologyConfig({
    presetId,
    customEclUrl,
    customOpsUrl,
    customAuthHeader: presetId === 'custom' ? customAuthHeader : undefined,
  });
}

export function getTerminologyConfigForAdmin(): TerminologyConfig & { hasAuthHeader: boolean } {
  const config = getTerminologyConfig();
  return {
    ...config,
    hasAuthHeader: Boolean(config.authHeader),
  };
}
