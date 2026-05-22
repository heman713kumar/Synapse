import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Hash, TrendingUp, Sparkles } from 'lucide-react';
import { Page } from '../types';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Input } from './ui/Input';
import { compactNumber } from '../utils/format';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

// Demo data — replace with /api/tags/trending when ready
const TRENDING = [
  { tag: 'ai', count: 1240, growth: '+42%', color: 'from-indigo-500 to-violet-500' },
  { tag: 'climate', count: 890, growth: '+28%', color: 'from-emerald-500 to-teal-500' },
  { tag: 'web3', count: 410, growth: '-12%', color: 'from-fuchsia-500 to-pink-500' },
  { tag: 'agents', count: 720, growth: '+88%', color: 'from-violet-500 to-fuchsia-500' },
  { tag: 'remote', count: 320, growth: '+5%', color: 'from-sky-500 to-blue-500' },
  { tag: 'edtech', count: 250, growth: '+34%', color: 'from-amber-500 to-orange-500' },
  { tag: 'healthtech', count: 480, growth: '+18%', color: 'from-rose-500 to-red-500' },
  { tag: 'opensource', count: 670, growth: '+22%', color: 'from-slate-500 to-zinc-600' },
  { tag: 'fintech', count: 540, growth: '+8%', color: 'from-emerald-500 to-cyan-500' },
  { tag: 'design', count: 380, growth: '+15%', color: 'from-pink-500 to-rose-500' },
  { tag: 'devtools', count: 290, growth: '+11%', color: 'from-slate-500 to-zinc-700' },
  { tag: 'creator', count: 220, growth: '+9%', color: 'from-violet-500 to-purple-500' },
  { tag: 'mobile', count: 410, growth: '+3%', color: 'from-blue-500 to-indigo-500' },
  { tag: 'saas', count: 870, growth: '+19%', color: 'from-teal-500 to-emerald-500' },
  { tag: 'startup', count: 1610, growth: '+25%', color: 'from-amber-500 to-orange-500' },
  { tag: 'mentorship', count: 180, growth: '+50%', color: 'from-violet-500 to-fuchsia-500' },
];

export const TrendingTags: React.FC<Props> = ({ setPage }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return TRENDING;
    return TRENDING.filter((t) => t.tag.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.count - a.count), [filtered]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-4xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Trending tags</h1>
          </div>
          <p className="text-sm text-muted-foreground">What's getting talked about on Synapse this week.</p>
        </header>

        <Input
          placeholder="Search tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Hash className="h-4 w-4" />}
          className="mb-5"
        />

        {/* Tag cloud — sized by popularity */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Tag cloud
            </h2>
            <div className="flex flex-wrap gap-2 items-center">
              {sorted.map((t) => {
                const size = Math.min(2.2, Math.max(0.85, t.count / 800));
                return (
                  <button
                    key={t.tag}
                    onClick={() => setPage('feed')}
                    className={cn(
                      'inline-block rounded-full font-bold transition-all hover:scale-110 hover:shadow-glow-sm',
                      'bg-gradient-to-r text-white px-3 py-1',
                      t.color
                    )}
                    style={{ fontSize: `${size}rem` }}
                  >
                    #{t.tag}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Ranked list */}
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {sorted.map((t, i) => (
              <motion.button
                key={t.tag}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setPage('feed')}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
              >
                <span className="w-6 text-center text-xs font-bold text-muted-foreground tabular-nums">#{i + 1}</span>
                <div className={cn('h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold', t.color)}>
                  #
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">#{t.tag}</p>
                  <p className="text-xs text-muted-foreground">{compactNumber(t.count)} ideas this week</p>
                </div>
                <Badge variant={t.growth.startsWith('+') ? 'success' : 'destructive'} size="sm">{t.growth}</Badge>
              </motion.button>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
