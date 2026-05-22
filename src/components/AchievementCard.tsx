import React from 'react';
import { Achievement } from '../types';
import { Trophy, Lock, CheckCircle2 } from 'lucide-react';
import { Progress } from './ui/Progress';
import { cn } from '../utils/cn';

interface AchievementCardProps {
  achievement: Achievement & { progress: number; unlockedAt: string | null };
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement }) => {
  const isUnlocked = !!achievement.unlockedAt;
  const progressPercent = Math.min((achievement.progress / achievement.goal) * 100, 100);

  return (
    <div
      className={cn(
        'surface p-5 text-center transition-all',
        isUnlocked ? 'border-amber-500/40 shadow-card-hover' : 'opacity-90'
      )}
    >
      <div
        className={cn(
          'mx-auto h-16 w-16 rounded-2xl flex items-center justify-center mb-3 transition-all',
          isUnlocked
            ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-glow-sm'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUnlocked ? <Trophy className="h-8 w-8" /> : <Lock className="h-6 w-6" />}
      </div>
      <h3 className={cn('font-semibold', isUnlocked ? 'text-foreground' : 'text-muted-foreground')}>
        {achievement.name}
      </h3>
      <p className="text-xs text-muted-foreground mt-1 min-h-[2.4em] line-clamp-2">
        {achievement.description}
      </p>

      <div className="mt-4">
        {isUnlocked ? (
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-success bg-success/10 py-1.5 rounded-lg">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Unlocked {new Date(achievement.unlockedAt!).toLocaleDateString()}
          </div>
        ) : (
          <>
            <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5 font-medium">
              <span>Progress</span>
              <span className="tabular-nums">{achievement.progress}/{achievement.goal}</span>
            </div>
            <Progress value={progressPercent} gradient className="h-1.5" />
          </>
        )}
      </div>
    </div>
  );
};
