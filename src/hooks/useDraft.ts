import { useEffect, useRef } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useDebounce } from './useDebounce';

/**
 * Persists arbitrary form state to localStorage with debounce,
 * so users don't lose drafts on refresh or accidental nav.
 */
export function useDraft<T>(key: string, value: T, delayMs = 500) {
  const [draft, setDraft, clearDraft] = useLocalStorage<T | null>(`synapse-draft-${key}`, null);
  const debounced = useDebounce(value, delayMs);
  const initialLoaded = useRef(false);

  // Save debounced changes
  useEffect(() => {
    if (!initialLoaded.current) {
      initialLoaded.current = true;
      return; // skip first save
    }
    setDraft(debounced);
  }, [debounced, setDraft]);

  return { draft, clearDraft };
}

/** Read a draft once (e.g. on form mount), then clear */
export function readDraftOnce<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`synapse-draft-${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function clearDraftByKey(key: string) {
  try { localStorage.removeItem(`synapse-draft-${key}`); } catch {/* noop */}
}
