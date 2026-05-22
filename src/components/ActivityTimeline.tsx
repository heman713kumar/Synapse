import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, MessageSquare, Heart, UserPlus, Trophy, Send, Activity as ActivityIcon } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { useXP, XPAction } from '../hooks/useXP';
import { timeAgo } from '../utils/format';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

const ACTION_META: Record<XPAction, { icon: React.ElementType; label: string; color: string }> = {
  post_idea:            { icon: Lightbulb, label: 'Shared an idea', color: 'from-amber-500 to-orange-500' },
  post_comment:         { icon: MessageSquare, label: 'Commented', color: 'from-sky-500 to-blue-500' },
  react:                { icon: Heart, label: 'Reacted', color: 'from-rose-500 to-pink-500' },
  connect:              { icon: UserPlus, label: 'Made a connection', color: 'from-violet-500 to-fuchsia-500' },
  message_sent:         { icon: Send, label: 'Sent a message', color: 'from-indigo-500 to-violet-500' },
  collab_accepted:      { icon: Trophy, label: 'Collab accepted', color: 'from-emerald-500 to-teal-500' },
  profile_completed:    { icon: Trophy, label: 'Completed profile', color: 'from-amber-500 to-orange-500' },
  first_login:          { icon: ActivityIcon, label: 'Joined Synapse', color: 'from-indigo-500 to-violet-500' },
  daily_visit:          { icon: ActivityIcon, label: 'Visited Synapse', color: 'from-slate-500 to-zinc-600' },
  achievement_unlocked: { icon: Trophy, label: 'Unlocked achievement', color: 'from-amber-500 to-rose-500' },
};

export const ActivityTimeline: React.FC<Props> = ({ setPage }) => {
  const { log, totalXP, levelInfo, title } = useXP();

  const grouped = useMemo(() => {
    const byDay: Record<string, typeof log> = {};
    log.forEach((e) => {
      const day = new Date(e.at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(e);
    });
    return Object.entries(byDay);
  }, [log]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-2xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">
          Back
        </Button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <ActivityIcon className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Activity</h1>
          </div>
          <p className="text-sm text-muted-foreground">Your contributions over time.</p>
        </header>

        {/* XP card */}
        <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Level {levelInfo.level}</p>
                <p className="text-2xl font-bold tracking-tight font-space-grotesk">{title}</p>
              </div>
              <Badge variant="gradient">{totalXP} XP</Badge>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-all" style={{ width: `${levelInfo.pct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{levelInfo.current} / {levelInfo.needed} XP to next level</p>
          </CardContent>
        </Card>

        {/* Timeline */}
        {grouped.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon className="h-8 w-8" />}
            title="No activity yet"
            description="Start posting, commenting, and connecting — your timeline lights up here."
          />
        ) : (
          <div className="space-y-6">
            {grouped.map(([day, entries]) => (
              <div key={day}>
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">{day}</p>
                <ul className="relative space-y-3 pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-border">
                  {entries.map((entry, i) => {
                    const meta = ACTION_META[entry.action] ?? { icon: ActivityIcon, label: entry.action, color: 'from-slate-500 to-zinc-500' };
                    const Icon = meta.icon;
                    return (
                      <motion.li
                        key={`${entry.at}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="relative"
                      >
                        <span className={cn('absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-gradient-to-br flex items-center justify-center text-white ring-4 ring-background', meta.color)}>
                          <Icon className="h-2.5 w-2.5" />
                        </span>
                        <div className="rounded-lg border border-border bg-card px-3 py-2 flex items-center justify-between gap-3">
                          <p className="text-sm">{meta.label}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-muted-foreground">{timeAgo(entry.at)}</span>
                            <Badge variant="soft" size="sm">+{entry.xp}</Badge>
                          </div>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
