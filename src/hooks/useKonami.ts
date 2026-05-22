import { useEffect } from 'react';

const SEQ = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];

/** Triggers handler when the Konami code is entered (↑ ↑ ↓ ↓ ← → ← → B A) */
export function useKonami(handler: () => void) {
  useEffect(() => {
    let idx = 0;
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === SEQ[idx]) {
        idx++;
        if (idx === SEQ.length) {
          handler();
          idx = 0;
        }
      } else {
        idx = key === SEQ[0] ? 1 : 0;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [handler]);
}
