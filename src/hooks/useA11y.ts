import { useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';

export interface A11yPrefs {
  highContrast: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  dyslexiaFont: boolean;
}

const DEFAULT: A11yPrefs = {
  highContrast: false,
  reducedMotion: false,
  largeText: false,
  dyslexiaFont: false,
};

/**
 * Applies accessibility preferences globally by toggling classes on <html>.
 * Respects the OS `prefers-reduced-motion` automatically as a default.
 */
export function useA11y() {
  const [prefs, setPrefs] = useLocalStorage<A11yPrefs>('synapse-a11y', DEFAULT);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-high-contrast', prefs.highContrast);
    root.classList.toggle('a11y-large-text', prefs.largeText);
    root.classList.toggle('a11y-dyslexia', prefs.dyslexiaFont);
    // Reduced-motion: honor explicit override OR system preference
    const osReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    root.classList.toggle('a11y-reduce-motion', prefs.reducedMotion || osReduce);
  }, [prefs]);

  return { prefs, setPrefs };
}

/** Read once for non-React contexts (e.g. Framer Motion transition props) */
export function isReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('synapse-a11y');
    if (raw) {
      const p = JSON.parse(raw) as A11yPrefs;
      if (p.reducedMotion) return true;
    }
  } catch {/* noop */}
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
