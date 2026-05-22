import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import en from '../locales/en.json';
import es from '../locales/es.json';
import hi from '../locales/hi.json';

export type Locale = 'en' | 'es' | 'hi';
export const AVAILABLE_LOCALES: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English',  flag: '🇺🇸' },
  { code: 'es', name: 'Español',  flag: '🇪🇸' },
  { code: 'hi', name: 'हिन्दी',    flag: '🇮🇳' },
];

const LOCALES: Record<Locale, Record<string, any>> = { en, es, hi };

function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  const code = navigator.language.split('-')[0];
  return (['en', 'es', 'hi'].includes(code) ? code : 'en') as Locale;
}

export function useI18n() {
  const [locale, setLocale] = useLocalStorage<Locale>('synapse-locale', detectLocale());
  const [strings, setStrings] = useState<Record<string, any>>(LOCALES[locale] ?? en);

  useEffect(() => {
    setStrings(LOCALES[locale] ?? en);
    document.documentElement.lang = locale;
    document.documentElement.dir = (LOCALES[locale]._meta?.rtl ? 'rtl' : 'ltr');
  }, [locale]);

  const t = useCallback((path: string, vars?: Record<string, string | number>) => {
    const parts = path.split('.');
    let cur: any = strings;
    for (const p of parts) {
      if (cur && typeof cur === 'object') cur = cur[p];
      else return path;
    }
    if (typeof cur !== 'string') return path;
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => { cur = cur.replace(`{${k}}`, String(v)); });
    }
    return cur;
  }, [strings]);

  return { locale, setLocale, t };
}
