import { useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import api from '../services/backendApiService';

interface StreakState {
  lastVisitDate: string; // YYYY-MM-DD
  currentStreak: number;
  longestStreak: number;
}

const dateKey = (d = new Date()) => d.toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.round((db - da) / (24 * 3600 * 1000));
};

/**
 * Tracks consecutive days the user has opened the app.
 * - Same-day visits: no change
 * - Consecutive day: streak++ (and update longest if needed)
 * - Skipped day: reset to 1
 */
export function useStreak() {
  const [state, setState] = useLocalStorage<StreakState>('synapse-streak', {
    lastVisitDate: dateKey(),
    currentStreak: 1,
    longestStreak: 1,
  });

  useEffect(() => {
    const today = dateKey();
    if (state.lastVisitDate === today) return; // already counted today

    const diff = daysBetween(state.lastVisitDate, today);
    const newStreak = diff === 1 ? state.currentStreak + 1 : 1;
    setState({
      lastVisitDate: today,
      currentStreak: newStreak,
      longestStreak: Math.max(state.longestStreak, newStreak),
    });

    // Mirror to backend so streak persists across devices. Fire-and-forget;
    // backend response (if any) might bump our local longest streak.
    api.tickStreak()
      .then((res) => {
        const serverLongest = Number(res?.longest_streak ?? 0);
        if (Number.isFinite(serverLongest) && serverLongest > state.longestStreak) {
          setState({
            lastVisitDate: today,
            currentStreak: Math.max(newStreak, Number(res?.current_streak ?? 0)),
            longestStreak: serverLongest,
          });
        }
      })
      .catch(() => { /* silent — works offline */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const streakLevel = useMemo(() => {
    const s = state.currentStreak;
    if (s >= 365) return { tier: 'legend', emoji: '👑', label: 'Legendary' };
    if (s >= 100) return { tier: 'master', emoji: '🌟', label: 'Master' };
    if (s >= 30) return { tier: 'pro', emoji: '🔥', label: 'On fire' };
    if (s >= 7) return { tier: 'consistent', emoji: '⚡', label: 'Consistent' };
    if (s >= 3) return { tier: 'building', emoji: '✨', label: 'Building' };
    return { tier: 'starting', emoji: '🌱', label: 'Just starting' };
  }, [state.currentStreak]);

  return { ...state, streakLevel };
}
