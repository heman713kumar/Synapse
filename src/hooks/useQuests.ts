import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import api from '../services/backendApiService';

export interface Quest {
  id: string;
  title: string;
  description: string;
  goal: number;
  xp: number;
  expiresAt: string; // YYYY-MM-DD (week end)
}

interface QuestProgress {
  weekKey: string; // YYYY-Www
  progress: Record<string, number>;
  completed: string[];
}

function isoWeek(): string {
  const d = new Date();
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + yearStart.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function weekEnd(): string {
  const d = new Date();
  const day = d.getDay();
  const diffToSun = 7 - day;
  const end = new Date(d);
  end.setDate(d.getDate() + diffToSun);
  return end.toISOString().slice(0, 10);
}

// Weekly quest catalog. Rotates per week.
const QUEST_CATALOG: Omit<Quest, 'expiresAt'>[] = [
  { id: 'comment_5', title: 'Conversation starter', description: 'Comment on 5 ideas', goal: 5, xp: 100 },
  { id: 'connect_3', title: 'Network builder', description: 'Connect with 3 people', goal: 3, xp: 75 },
  { id: 'react_10', title: 'Hype machine', description: 'React to 10 ideas', goal: 10, xp: 50 },
  { id: 'post_1', title: 'New spark', description: 'Share 1 new idea', goal: 1, xp: 150 },
  { id: 'msg_5', title: 'Stay in touch', description: 'Send 5 messages', goal: 5, xp: 60 },
];

export function useQuests() {
  const week = isoWeek();
  const [state, setState] = useLocalStorage<QuestProgress>('synapse-quests', { weekKey: week, progress: {}, completed: [] });

  // Reset progress on new week
  if (state.weekKey !== week) {
    setState({ weekKey: week, progress: {}, completed: [] });
  }

  const quests: Quest[] = useMemo(
    () => QUEST_CATALOG.map((q) => ({ ...q, expiresAt: weekEnd() })),
    []
  );

  const increment = useCallback(
    (questId: string, by = 1) => {
      setState((prev) => {
        if (prev.completed.includes(questId)) return prev;
        const cur = (prev.progress[questId] ?? 0) + by;
        const quest = QUEST_CATALOG.find((q) => q.id === questId);
        const done = quest && cur >= quest.goal;
        return {
          ...prev,
          progress: { ...prev.progress, [questId]: cur },
          completed: done ? [...prev.completed, questId] : prev.completed,
        };
      });
      // Mirror to backend so quest progress survives across devices. Each
      // backend tick increments by 1, so call N times for a multi-step bump.
      // Fire-and-forget — local already updated, network failure is fine.
      for (let i = 0; i < by; i++) {
        api.incrementQuest(questId).catch(() => { /* silent */ });
      }
    },
    [setState]
  );

  const completionPct = useMemo(() => {
    if (quests.length === 0) return 0;
    return Math.round((state.completed.length / quests.length) * 100);
  }, [quests.length, state.completed.length]);

  return {
    quests,
    progress: state.progress,
    completed: state.completed,
    completionPct,
    increment,
    weekEndsAt: weekEnd(),
  };
}
