import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, Sparkles, Users, ArrowLeft, Crown } from 'lucide-react';
import { Page, User } from '../types';
import api from '../services/backendApiService';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { SkeletonList } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { userName, compactNumber } from '../utils/format';
import { cn } from '../utils/cn';

interface Props {
  currentUser: User | null;
  setPage: (page: Page, id?: string) => void;
}

type LeaderRow = User & { score: number; rank: number; label?: string };

function rankRow(user: User, score: number, rank: number, label?: string): LeaderRow {
  return { ...user, score, rank, label };
}

function podiumColor(rank: number): string {
  if (rank === 1) return 'from-amber-400 to-orange-500';
  if (rank === 2) return 'from-slate-300 to-slate-500';
  if (rank === 3) return 'from-amber-600 to-orange-700';
  return 'from-secondary to-secondary';
}

export const Leaderboard: React.FC<Props> = ({ currentUser, setPage }) => {
  const [loading, setLoading] = useState(true);
  const [contributors, setContributors] = useState<LeaderRow[]>([]);
  const [streaks, setStreaks] = useState<LeaderRow[]>([]);
  const [connectors, setConnectors] = useState<LeaderRow[]>([]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Fallback: derive from /api/users with sorting by various proxies
    api.searchUsers({})
      .then((users) => {
        if (!mounted) return;
        const all = users || [];
        // Top contributors: by reputation/ideas
        setContributors(
          [...all]
            .map((u) => ({ ...u, _s: u.reputationScore ?? (u.skills?.length ?? 0) * 5 + (u.connections?.length ?? 0) }))
            .sort((a: any, b: any) => b._s - a._s)
            .slice(0, 10)
            .map((u: any, i) => rankRow(u, u._s, i + 1, 'rep'))
        );
        // Top streaks
        setStreaks(
          [...all]
            .filter((u) => (u.streakDays ?? 0) > 0)
            .sort((a, b) => (b.streakDays ?? 0) - (a.streakDays ?? 0))
            .slice(0, 10)
            .map((u, i) => rankRow(u, u.streakDays ?? 0, i + 1, 'days'))
        );
        // Top connectors
        setConnectors(
          [...all]
            .sort((a, b) => (b.connections?.length ?? 0) - (a.connections?.length ?? 0))
            .slice(0, 10)
            .map((u, i) => rankRow(u, u.connections?.length ?? 0, i + 1, 'connections'))
        );
      })
      .catch(() => {
        if (mounted) {
          setContributors([]);
          setStreaks([]);
          setConnectors([]);
        }
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  const renderList = (rows: LeaderRow[], unitLabel: string, icon: React.ElementType) => {
    if (loading) return <SkeletonList count={5} />;
    if (rows.length === 0) return <EmptyState icon={React.createElement(icon, { className: 'h-8 w-8' })} title="No leaderboard data yet" description="Be the first to climb the ranks." />;
    const top3 = rows.slice(0, 3);
    const rest = rows.slice(3);
    return (
      <div className="space-y-6">
        {/* Podium */}
        <div className="grid grid-cols-3 gap-3 items-end">
          {[1, 0, 2].map((i) => {
            const row = top3[i];
            if (!row) return <div key={i} />;
            const isFirst = row.rank === 1;
            return (
              <motion.button
                key={row.userId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setPage('profile', row.userId)}
                className={cn(
                  'flex flex-col items-center text-center group cursor-pointer',
                  isFirst && 'order-2'
                )}
              >
                <div className={cn('mb-2 relative', isFirst && 'scale-110')}>
                  <Avatar src={row.avatarUrl} name={userName(row)} size={isFirst ? 'xl' : 'lg'} ring />
                  {row.rank === 1 && (
                    <Crown className="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 text-amber-500 fill-current drop-shadow" />
                  )}
                </div>
                <p className="text-sm font-semibold truncate w-full">{userName(row)}</p>
                <div className={cn('mt-2 inline-flex h-12 w-full rounded-t-xl bg-gradient-to-b text-white items-center justify-center font-bold tabular-nums', podiumColor(row.rank))}
                  style={{ height: isFirst ? '4.5rem' : row.rank === 2 ? '3.5rem' : '2.5rem' }}
                >
                  #{row.rank}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Rest */}
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {rest.map((row) => {
              const isMe = currentUser?.userId === row.userId;
              return (
                <motion.button
                  key={row.userId}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setPage('profile', row.userId)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors text-left',
                    isMe && 'bg-primary/5'
                  )}
                >
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground tabular-nums">#{row.rank}</span>
                  <Avatar src={row.avatarUrl} name={userName(row)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{userName(row)}{isMe && <span className="ml-1 text-xs text-primary">(you)</span>}</p>
                    {row.headline && <p className="text-xs text-muted-foreground truncate">{row.headline}</p>}
                  </div>
                  <Badge variant="soft" size="sm">{compactNumber(row.score)} {unitLabel}</Badge>
                </motion.button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-3xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">
          Back
        </Button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-6 w-6 text-amber-500" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Leaderboard</h1>
          </div>
          <p className="text-sm text-muted-foreground">The community's most active builders, this season.</p>
        </header>

        <Tabs defaultValue="contributors">
          <TabsList variant="pills" className="mb-5">
            <TabsTrigger variant="pills" value="contributors" className="gap-2"><Sparkles className="h-4 w-4" /> Top contributors</TabsTrigger>
            <TabsTrigger variant="pills" value="streaks" className="gap-2"><Flame className="h-4 w-4" /> Longest streaks</TabsTrigger>
            <TabsTrigger variant="pills" value="connectors" className="gap-2"><Users className="h-4 w-4" /> Best connectors</TabsTrigger>
          </TabsList>
          <TabsContent value="contributors" className="mt-0">{renderList(contributors, 'rep', Sparkles)}</TabsContent>
          <TabsContent value="streaks" className="mt-0">{renderList(streaks, 'days', Flame)}</TabsContent>
          <TabsContent value="connectors" className="mt-0">{renderList(connectors, 'conns', Users)}</TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};
