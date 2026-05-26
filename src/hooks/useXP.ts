import { useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { celebrate, playSound } from '../utils/effects';
import { toast } from '../components/ui/Toaster';
import api from '../services/backendApiService';

export type XPAction =
  | 'post_idea'
  | 'post_comment'
  | 'react'
  | 'connect'
  | 'message_sent'
  | 'collab_accepted'
  | 'profile_completed'
  | 'first_login'
  | 'daily_visit'
  | 'achievement_unlocked';

export const XP_VALUES: Record<XPAction, number> = {
  post_idea: 50,
  post_comment: 5,
  react: 1,
  connect: 10,
  message_sent: 2,
  collab_accepted: 100,
  profile_completed: 25,
  first_login: 10,
  daily_visit: 5,
  achievement_unlocked: 30,
};

interface XPState {
  totalXP: number;
  log: { action: XPAction; xp: number; at: string }[];
}

const MAX_LOG = 50;

/** Level curve: level N requires N*100 XP cumulative (1→100, 2→300, 3→600...) */
export function levelFromXP(xp: number): { level: number; current: number; needed: number; pct: number } {
  let level = 1;
  let cumulative = 0;
  while (cumulative + level * 100 <= xp) {
    cumulative += level * 100;
    level++;
  }
  const current = xp - cumulative;
  const needed = level * 100;
  return { level, current, needed, pct: Math.round((current / needed) * 100) };
}

export const LEVEL_TITLES: Record<number, string> = {
  1: 'Spark',
  2: 'Tinkerer',
  3: 'Builder',
  4: 'Maker',
  5: 'Architect',
  6: 'Innovator',
  7: 'Visionary',
  8: 'Pioneer',
  9: 'Trailblazer',
  10: 'Luminary',
};

export function titleForLevel(level: number): string {
  if (level >= 10) return LEVEL_TITLES[10];
  return LEVEL_TITLES[level] ?? 'Legend';
}

export function useXP() {
  const [state, setState] = useLocalStorage<XPState>('synapse-xp', { totalXP: 0, log: [] });

  const levelInfo = useMemo(() => levelFromXP(state.totalXP), [state.totalXP]);

  // On mount, try to pull authoritative XP total from the backend. If it's
  // higher than what we have locally (e.g. user awarded XP on another device),
  // adopt the backend value. Backend errors are silently ignored so the hook
  // keeps working when the API is offline.
  useEffect(() => {
    let alive = true;
    api.getMyXP()
      .then((data) => {
        if (!alive) return;
        const serverXP = Number(data?.total_xp ?? 0);
        if (Number.isFinite(serverXP) && serverXP > state.totalXP) {
          setState({ totalXP: serverXP, log: state.log });
        }
      })
      .catch(() => { /* silent — offline-tolerant */ });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const award = useCallback((action: XPAction, multiplier = 1, options: { silent?: boolean } = {}) => {
    const xp = XP_VALUES[action] * multiplier;
    const prevLevel = levelFromXP(state.totalXP).level;
    const nextTotal = state.totalXP + xp;
    const newLevel = levelFromXP(nextTotal).level;

    setState({
      totalXP: nextTotal,
      log: [{ action, xp, at: new Date().toISOString() }, ...state.log].slice(0, MAX_LOG),
    });

    // Mirror the award to the backend so progress survives across devices.
    // Fire-and-forget: a network failure here doesn't undo the local update.
    api.awardXP({ reason: action, amount: xp }).catch(() => { /* silent */ });

    if (!options.silent) {
      if (newLevel > prevLevel) {
        celebrate('large');
        playSound('unlock');
        toast.success(`🎉 Level up! You're a ${titleForLevel(newLevel)} (Lv ${newLevel})`);
      } else {
        toast(`+${xp} XP`, { icon: '✨', duration: 1500 });
      }
    }
  }, [state, setState]);

  return { ...state, levelInfo, title: titleForLevel(levelInfo.level), award };
}
