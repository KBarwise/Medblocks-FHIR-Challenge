'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { tabFromTrendsParam, type TrendsTabId } from '@/lib/clinical/trends-navigation';

type PatientTrendsContextValue = {
  patientId: string;
  isOpen: boolean;
  tab: TrendsTabId;
  openTrends: (tab?: TrendsTabId) => void;
  closeTrends: () => void;
  setTrendsTab: (tab: TrendsTabId) => void;
};

const PatientTrendsContext = createContext<PatientTrendsContextValue | null>(null);

export function PatientTrendsProvider({
  patientId,
  children,
}: {
  patientId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isOpen = searchParams.get('trends') === '1';
  const tab = tabFromTrendsParam(searchParams.get('tab'));

  const buildUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString());
      mutate(params);
      const q = params.toString();
      return q ? `${pathname}?${q}` : pathname;
    },
    [pathname, searchParams],
  );

  const openTrends = useCallback(
    (nextTab?: TrendsTabId) => {
      const url = buildUrl(params => {
        params.set('trends', '1');
        params.set('tab', nextTab ?? params.get('tab') ?? 'vitals');
      });
      router.push(url, { scroll: false });
    },
    [buildUrl, router],
  );

  const closeTrends = useCallback(() => {
    const url = buildUrl(params => {
      params.delete('trends');
      params.delete('tab');
    });
    router.push(url, { scroll: false });
  }, [buildUrl, router]);

  const setTrendsTab = useCallback(
    (nextTab: TrendsTabId) => {
      const url = buildUrl(params => {
        params.set('trends', '1');
        params.set('tab', nextTab);
      });
      router.replace(url, { scroll: false });
    },
    [buildUrl, router],
  );

  const value = useMemo(
    () => ({
      patientId,
      isOpen,
      tab,
      openTrends,
      closeTrends,
      setTrendsTab,
    }),
    [patientId, isOpen, tab, openTrends, closeTrends, setTrendsTab],
  );

  return (
    <PatientTrendsContext.Provider value={value}>{children}</PatientTrendsContext.Provider>
  );
}

export function usePatientTrends() {
  const ctx = useContext(PatientTrendsContext);
  if (!ctx) {
    throw new Error('usePatientTrends must be used within PatientTrendsProvider');
  }
  return ctx;
}

export function usePatientTrendsOptional() {
  return useContext(PatientTrendsContext);
}
