import { useCallback, useEffect, useState } from 'react';

/**
 * useState wrapper that persists to localStorage with cross-tab sync.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const read = useCallback((): T => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  }, [key, initialValue]);

  const [value, setValue] = useState<T>(read);

  const set = useCallback(
    (val: T | ((prev: T) => T)) => {
      try {
        setValue((prev) => {
          const next = typeof val === 'function' ? (val as (p: T) => T)(prev) : val;
          window.localStorage.setItem(key, JSON.stringify(next));
          return next;
        });
      } catch (e) {
        console.warn(`useLocalStorage: failed to write "${key}"`, e);
      }
    },
    [key]
  );

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setValue(initialValue);
    } catch {/* noop */}
  }, [key, initialValue]);

  // Cross-tab sync
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try { setValue(JSON.parse(e.newValue) as T); } catch {/* noop */}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [key]);

  return [value, set, remove] as const;
}
