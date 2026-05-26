import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, TrendingUp, Star, Users, MessageSquare, Calendar, Sparkles, ArrowRight } from 'lucide-react';
import { Page, User, Idea } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageLoader } from './ui/Spinner';
import { Avatar } from './ui/Avatar';
import api from '../services/backendApiService';
import { useXP } from '../hooks/useXP';
import { useStreak } from '../hooks/useStreak';

interface Props {
  setPage: (page: Page, id?: string) => void;
  currentUser: User | null;
}

/**
 * Weekly digest preview — what the Monday email would look like for you.
 *
 * Pure read-only assembly from existing API + local hooks. Stand-in for the
 * email-rendering pipeline we haven't built yet; useful as a "Sunday catch-up"
 * page in its own right.
 */
function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function scoreForDigest(i: Idea): number {
  return (i.likesCount ?? 0) * 1 + (i.commentsCount ?? 0) * 2.5;
}

export const DigestPreview: React.FC<Props> = ({ setPage, currentUser }) => {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const { totalXP, levelInfo, log } = useXP();
  const { currentStreak, streakLevel } = useStreak();

  useEffect(() => {
    let alive = true;
    api.getAllIdeas()
      .then((all) => { if (alive) setIdeas(Array.isArray(all) ? all : []); })
      .catch(() => { if (alive) setIdeas([]); });
    return () => { alive = false; };
  }, []);

  const weekStart = useMemo(() => startOfWeek(), []);
  const topIdeas = useMemo(() => {
    if (!ideas) return [];
    const cutoff = weekStart.getTime();
    return ideas
      .filter((i) => new Date(i.createdAt).getTime() >= cutoff)
      .sort((a, b) => scoreForDigest(b) - scoreForDigest(a))
      .slice(0, 5);
  }, [ideas, weekStart]);

  const weekXP = useMemo(() => {
    const cutoff = weekStart.getTime();
    return (log ?? [])
      .filter((e) => new Date(e.at).getTime() >= cutoff)
      .reduce((sum, e) => sum + e.xp, 0);
  }, [log, weekStart]);

  const friendlyDate = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-3xl py-6 md:py-10 px-4"
    >
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

      <header className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </span>
            Your weekly digest
          </h1>
          <p className="text-sm text-muted-foreground mt-2">A preview of what would land in your inbox this Monday — {friendlyDate}.</p>
        </div>
        <Badge variant="ghost" size="sm" className="inline-flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          Preview only
        </Badge>
      </header>

      {ideas === null ? (
        <PageLoader label="Building your digest…" />
      ) : (
        <Card className="overflow-hidden">
          {/* Email-style header */}
          <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-6 border-b border-border">
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Synapse Weekly</div>
                <div className="text-sm text-muted-foreground">to: {currentUser?.email ?? 'you'}</div>
              </div>
            </div>
            <h2 className="text-xl md:text-2xl font-bold mt-3">
              Hey {currentUser?.displayName?.split(' ')[0] || currentUser?.username || 'there'}, here's what you missed.
            </h2>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Stats row */}
            <section>
              <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">Your week in numbers</h3>
              <div className="grid grid-cols-3 gap-3">
                <StatTile icon={<TrendingUp className="h-4 w-4" />} label="XP earned" value={`+${weekXP}`} hint={`Level ${levelInfo.level}`} />
                <StatTile icon={<Star className="h-4 w-4" />} label="Streak" value={`${currentStreak}d ${streakLevel.emoji}`} hint={streakLevel.label} />
                <StatTile icon={<TrendingUp className="h-4 w-4" />} label="Total XP" value={`${totalXP}`} hint="All-time" />
              </div>
            </section>

            {/* Top ideas */}
            <section>
              <h3 className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">Trending ideas you missed</h3>
              {topIdeas.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No new ideas this week yet — be the first to post.</p>
              ) : (
                <div className="space-y-2">
                  {topIdeas.map((i) => (
                    <button
                      key={i.ideaId}
                      onClick={() => setPage('ideaDetail', i.ideaId)}
                      className="w-full text-left p-3 rounded-lg hover:bg-secondary/40 transition-colors flex items-start gap-3 border border-transparent hover:border-border"
                    >
                      <Avatar src={i.ownerAvatarUrl} name={i.ownerDisplayName || i.ownerUsername} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{i.title}</div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{i.summary}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Star className="h-3 w-3" />{i.likesCount ?? 0}</span>
                          <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{i.commentsCount ?? 0}</span>
                          {i.ownerDisplayName && <span className="truncate">by {i.ownerDisplayName}</span>}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Suggested next action */}
            <section className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                  <Users className="h-4 w-4" />
                </span>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">Find your co-founder</h4>
                  <p className="text-xs text-muted-foreground mt-1">Take a 90-second quiz and we'll rank the community by who'd complement you best.</p>
                </div>
                <Button size="sm" variant="outline" rightIcon={<ArrowRight className="h-4 w-4" />} onClick={() => setPage('coFounderMatch')}>Start</Button>
              </div>
            </section>

            {/* Footer-ish */}
            <div className="pt-4 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                You're seeing this preview because you opened it manually. Real digests go out Monday at 9am local time.
              </p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => setPage('notificationSettings')}>
                Manage email preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

const StatTile: React.FC<{ icon: React.ReactNode; label: string; value: string; hint?: string }> = ({ icon, label, value, hint }) => (
  <div className="rounded-xl border border-border bg-secondary/30 p-3">
    <div className="text-muted-foreground mb-1">{icon}</div>
    <div className="text-lg font-bold leading-tight">{value}</div>
    <div className="text-[11px] text-muted-foreground">{label}</div>
    {hint && <div className="text-[10px] text-muted-foreground italic mt-0.5">{hint}</div>}
  </div>
);
