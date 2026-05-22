import { useEffect } from 'react';

type HotkeyHandler = (e: KeyboardEvent) => void;

/**
 * Bind keyboard shortcuts (Mousetrap-lite).
 * Example: useHotkeys('?', () => setShowHelp(true))
 *          useHotkeys('mod+k', () => setOpen(true))   // ⌘K or Ctrl+K
 *          useHotkeys('g f', () => navigate('/feed')) // "g" then "f"
 *
 * Ignores when target is INPUT/TEXTAREA/contenteditable (unless allowInInput=true).
 */
export function useHotkeys(
  combo: string,
  handler: HotkeyHandler,
  options: { allowInInput?: boolean; preventDefault?: boolean; enabled?: boolean } = {}
) {
  const { allowInInput = false, preventDefault = true, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const keys = combo.toLowerCase().trim().split(/\s+/);
    const isSequence = keys.length > 1 && !keys[0].includes('+');

    let sequenceIndex = 0;
    let sequenceTimer: ReturnType<typeof setTimeout> | null = null;

    const resetSequence = () => {
      sequenceIndex = 0;
      if (sequenceTimer) { clearTimeout(sequenceTimer); sequenceTimer = null; }
    };

    const matchCombo = (e: KeyboardEvent, comboStr: string): boolean => {
      const parts = comboStr.toLowerCase().split('+');
      const key = parts[parts.length - 1];
      const mods = new Set(parts.slice(0, -1));
      const isMod = mods.has('mod') ? (e.metaKey || e.ctrlKey) : (!e.metaKey && !e.ctrlKey || mods.has('meta') || mods.has('ctrl'));
      if (mods.has('mod') && !isMod) return false;
      if (mods.has('shift') !== e.shiftKey) return false;
      if (mods.has('alt') !== e.altKey) return false;
      return e.key.toLowerCase() === key;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!allowInInput && t) {
        const tag = t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t as any).isContentEditable) {
          return;
        }
      }

      if (isSequence) {
        const expected = keys[sequenceIndex];
        if (e.key.toLowerCase() === expected) {
          sequenceIndex++;
          if (sequenceIndex === keys.length) {
            if (preventDefault) e.preventDefault();
            handler(e);
            resetSequence();
          } else {
            if (sequenceTimer) clearTimeout(sequenceTimer);
            sequenceTimer = setTimeout(resetSequence, 800);
          }
        } else {
          resetSequence();
        }
      } else {
        if (matchCombo(e, combo)) {
          if (preventDefault) e.preventDefault();
          handler(e);
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (sequenceTimer) clearTimeout(sequenceTimer);
    };
  }, [combo, handler, allowInInput, preventDefault, enabled]);
}
