import React from 'react';
import { Flame } from 'lucide-react';
import { useStreak } from '../hooks/useStreak';
import { Tooltip } from './ui/Tooltip';
import { cn } from '../utils/cn';

interface Props {
  variant?: 'compact' | 'full';
  className?: string;
}

export const StreakBadge: React.FC<Props> = ({ variant = 'compact', className }) => {
  const { currentStreak, longestStreak, streakLevel } = useStreak();

  if (variant === 'compact') {
    return (
      <Tooltip content={`${currentStreak}-day streak · ${streakLevel.label}${longestStreak > currentStreak ? ` · longest ${longestStreak}` : ''}`}>
        <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-xs font-semibold', className)}>
          <Flame className="h-3 w-3 text-amber-500" />
          <span className="tabular-nums">{currentStreak}</span>
        </div>
      </Tooltip>
    );
  }

  return (
    <div className={cn('flex items-center gap-3 p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10', className)}>
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center text-2xl shadow-glow-sm">
        {streakLevel.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold tabular-nums">{currentStreak} day{currentStreak === 1 ? '' : 's'}</p>
        <p className="text-xs text-muted-foreground">{streakLevel.label} · Longest: {longestStreak}</p>
      </div>
    </div>
  );
};
