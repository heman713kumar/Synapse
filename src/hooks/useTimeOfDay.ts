import { useEffect, useState } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(d = new Date()): TimeOfDay {
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export function greeting(d = new Date()): string {
  const t = getTimeOfDay(d);
  if (t === 'morning') return 'Good morning';
  if (t === 'afternoon') return 'Good afternoon';
  if (t === 'evening') return 'Good evening';
  return 'Working late?';
}

/**
 * Adds a subtle warm/cool tint to <html> based on time of day.
 * Doesn't change the theme — just shifts the accent very slightly.
 */
export function useTimeOfDayTint(enabled = true) {
  const [tod, setTod] = useState<TimeOfDay>(getTimeOfDay());

  useEffect(() => {
    if (!enabled) {
      document.documentElement.removeAttribute('data-time-of-day');
      return;
    }
    const apply = () => {
      const next = getTimeOfDay();
      setTod(next);
      document.documentElement.dataset.timeOfDay = next;
    };
    apply();
    // Recheck every 15 minutes — cheap enough
    const id = window.setInterval(apply, 15 * 60_000);
    return () => window.clearInterval(id);
  }, [enabled]);

  return tod;
}
