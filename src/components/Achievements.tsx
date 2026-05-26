import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, Sparkles } from 'lucide-react';
import { User, Achievement, AchievementId, UserAchievement } from '../types';
import { ACHIEVEMENTS } from '../constants';
import { AchievementCard } from './AchievementCard';
import { Card, CardContent } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Badge } from './ui/Badge';

interface AchievementsProps {
  currentUser: User | null;
}

/**
 * Browse-all-achievements page.
 *
 * For every achievement defined in `ACHIEVEMENTS` we look up the user's
 * matching `UserAchievement` (if any) and pass progress + unlockedAt to the
 * shared AchievementCard. Achievements the user hasn't started yet still
 * appear in a locked state so the user can see what they're working toward.
 */
export const Achievements: React.FC<AchievementsProps> = ({ currentUser }) => {
  // Build a quick lookup of the user's progress per achievement id, defensively
  // accepting both camelCase and snake_case from the backend payload.
  const userProgressById = useMemo(() => {
    const map = new Map<AchievementId, { progress: number; unlockedAt: string | null }>();
    const list = currentUser?.achievements || [];
    for (const ua of list as UserAchievement[]) {
      const id = (ua.achievementId ?? ua.achievement_id) as AchievementId | undefined;
      if (!id) continue;
      map.set(id, {
        progress: ua.progress ?? 0,
        unlockedAt: ua.unlockedAt ?? ua.unlocked_at ?? null,
      });
    }
    return map;
  }, [currentUser]);

  // Hydrate every defined achievement with the user's progress (or zeros).
  const hydrated = useMemo(() => {
    return Object.values(ACHIEVEMENTS)
      .filter((a): a is Achievement => !!a)
      .map((a) => {
        const p = userProgressById.get(a.id);
        return {
          ...a,
          progress: p?.progress ?? 0,
          unlockedAt: p?.unlockedAt ?? null,
        };
      });
  }, [userProgressById]);

  const unlocked = hydrated.filter((a) => !!a.unlockedAt);
  const inProgress = hydrated.filter((a) => !a.unlockedAt && a.progress > 0);
  const locked = hydrated.filter((a) => !a.unlockedAt && a.progress === 0);

  const total = hydrated.length;
  const completionPct = total > 0 ? Math.round((unlocked.length / total) * 100) : 0;

  if (!currentUser) {
    return (
      <div className="container max-w-4xl py-10 px-4">
        <EmptyState
          icon={<Trophy className="h-8 w-8" />}
          title="Sign in to track achievements"
          description="Your progress, unlocks, and milestones live with your account."
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-5xl py-6 md:py-10 px-4"
    >
      {/* Hero */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 text-white shadow-glow-sm">
            <Trophy className="h-5 w-5" />
          </span>
          Achievements
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Earn badges as you contribute, collaborate, and shape the community.
        </p>
      </header>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Unlocked</p>
            <p className="text-2xl font-bold mt-1">{unlocked.length} <span className="text-sm font-normal text-muted-foreground">/ {total}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">In progress</p>
            <p className="text-2xl font-bold mt-1">{inProgress.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Locked</p>
            <p className="text-2xl font-bold mt-1">{locked.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Completion</p>
            <p className="text-2xl font-bold mt-1">{completionPct}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Sections */}
      {unlocked.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-amber-500" /> Unlocked
            <Badge variant="default" size="sm">{unlocked.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </section>
      )}

      {inProgress.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-primary" /> In progress
            <Badge variant="soft" size="sm">{inProgress.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </section>
      )}

      {locked.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2 mb-4">
            <Lock className="h-4 w-4 text-muted-foreground" /> Locked
            <Badge variant="soft" size="sm">{locked.length}</Badge>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
};
