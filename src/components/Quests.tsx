import React from 'react';
import { motion } from 'framer-motion';
import { Target, ArrowLeft, Flame, Trophy, CheckCircle2, Clock } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { Badge } from './ui/Badge';
import { useQuests } from '../hooks/useQuests';
import { useStreak } from '../hooks/useStreak';
import { useXP, titleForLevel } from '../hooks/useXP';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

export const Quests: React.FC<Props> = ({ setPage }) => {
  const { quests, progress, completed, completionPct, weekEndsAt } = useQuests();
  const { currentStreak, longestStreak, streakLevel } = useStreak();
  const { totalXP, levelInfo } = useXP();

  const daysLeft = Math.max(0, Math.ceil((new Date(weekEndsAt).getTime() - Date.now()) / 86400000));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-3xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">
          Back
        </Button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Quests &amp; Streaks</h1>
          </div>
          <p className="text-sm text-muted-foreground">Weekly challenges, daily streaks, and level progression — all in one place.</p>
        </header>

        {/* Level + Streak summary */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardContent className="p-5">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Your level</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-bold tracking-tight font-space-grotesk">{titleForLevel(levelInfo.level)}</p>
                <Badge variant="gradient">Lv {levelInfo.level}</Badge>
              </div>
              <Progress value={levelInfo.pct} gradient className="h-1.5 mt-3" />
              <p className="text-xs text-muted-foreground mt-2">{levelInfo.current} / {levelInfo.needed} XP · Total: {totalXP}</p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <CardContent className="p-5">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Daily streak</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-2xl font-bold tracking-tight font-space-grotesk">{currentStreak} {currentStreak === 1 ? 'day' : 'days'}</p>
                <span className="text-2xl">{streakLevel.emoji}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{streakLevel.label} · Longest: {longestStreak}</p>
            </CardContent>
          </Card>
        </div>

        {/* Weekly progress */}
        <Card className="mb-6">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-semibold flex items-center gap-1.5"><Flame className="h-4 w-4 text-warning" /> This week's quests</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{completed.length} of {quests.length} complete · {daysLeft}d {daysLeft === 1 ? 'day' : 'days'} left</p>
              </div>
              <Badge variant={completionPct === 100 ? 'success' : 'soft'}>{completionPct}%</Badge>
            </div>
            <Progress value={completionPct} gradient className="h-2" />
          </CardContent>
        </Card>

        {/* Quest list */}
        <ul className="space-y-3">
          {quests.map((q, i) => {
            const done = completed.includes(q.id);
            const cur = progress[q.id] ?? 0;
            const pct = Math.min(100, Math.round((cur / q.goal) * 100));
            return (
              <motion.li
                key={q.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn(done && 'border-success/40')}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={cn(
                      'h-12 w-12 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md',
                      done ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-indigo-500 to-violet-500'
                    )}>
                      {done ? <CheckCircle2 className="h-6 w-6" /> : <Target className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 justify-between">
                        <p className="font-semibold text-sm">{q.title}</p>
                        <Badge variant={done ? 'success' : 'gradient'} size="sm">+{q.xp} XP</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{q.description}</p>
                      <Progress value={pct} className="h-1 mt-2" />
                      <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">{cur} / {q.goal}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.li>
            );
          })}
        </ul>

        <Card className="mt-6 border-dashed">
          <CardContent className="p-5 text-center">
            <Trophy className="h-8 w-8 text-amber-500 mx-auto mb-2" />
            <p className="font-semibold">Complete all weekly quests</p>
            <p className="text-xs text-muted-foreground mt-1">Earn a bonus 250 XP and a rare "Quest Master" badge</p>
            <Button variant="ghost" size="sm" className="mt-3" leftIcon={<Clock className="h-3.5 w-3.5" />}>
              Resets in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
