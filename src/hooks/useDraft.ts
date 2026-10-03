import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'gelectra-application-draft-v1';

export type DraftState<T> = {
  data: T;
  step: number;
  updatedAt: number;
};

export function loadDraft<T>(_fallback: T): DraftState<T> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DraftState<T>;
    if (!parsed || typeof parsed.data !== 'object' || parsed.data === null) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function useDraft<T extends Record<string, unknown>>(initial: T) {
  const initialRef = useRef(initial);
  const restored = useMemo(() => loadDraft<T>(initialRef.current), []);
  const [data, setData] = useState<T>(restored?.data ?? initialRef.current);
  const [step, setStep] = useState<number>(restored?.step ?? 0);
  const [lastSaved, setLastSaved] = useState<number | null>(restored?.updatedAt ?? null);
  const saveTimer = useRef<number | null>(null);

  const persist = useCallback((nextData: T, nextStep: number) => {
    if (typeof window === 'undefined') return;
    try {
      const payload: DraftState<T> = {
        data: nextData,
        step: nextStep,
        updatedAt: Date.now(),
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setLastSaved(payload.updatedAt);
    } catch {
      // Storage may be unavailable
    }
  }, []);

  const goToStep = useCallback(
    (nextStep: number) => {
      setStep(nextStep);
      persist(data, nextStep);
    },
    [data, persist],
  );

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
  }, []);

  return { data, setData, step, setStep: goToStep, lastSaved, persist, clearDraft };
}
