import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, Users, MessageSquare, Sparkles, Globe, TrendingUp, Heart } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { compactNumber } from '../utils/format';
import { cn } from '../utils/cn';

interface Props { setPage: (page: Page) => void; }

interface Stat { label: string; value: number; suffix?: string; icon: React.ElementType; color: string }

// Demo numbers — swap with /api/public/stats when ready
const STATS: Stat[] = [
  { label: 'Ideas shared',      value: 12_481, icon: Lightbulb,    color: 'from-amber-500 to-orange-500' },
  { label: 'Active members',    value: 4_120,  icon: Users,        color: 'from-indigo-500 to-violet-500' },
  { label: 'Collaborations formed', value: 891,  icon: Sparkles,   color: 'from-emerald-500 to-teal-500' },
  { label: 'Messages exchanged', value: 138_000, icon: MessageSquare, color: 'from-sky-500 to-blue-500' },
  { label: 'Countries represented', value: 87,  icon: Globe,        color: 'from-fuchsia-500 to-pink-500' },
  { label: 'Reactions given',   value: 312_700, icon: Heart,       color: 'from-rose-500 to-red-500' },
];

function useCountUp(target: number, duration = 1200): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return n;
}

const Counter: React.FC<{ value: number }> = ({ value }) => {
  const n = useCountUp(value);
  return <span className="tabular-nums">{compactNumber(n)}</span>;
};

export const PublicStats: React.FC<Props> = ({ setPage }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-4xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="text-center mb-10">
          <Badge variant="soft" size="sm" className="mb-3">Live counters</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-space-grotesk">
            Synapse in <span className="text-gradient">numbers</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
            A community of builders, thinkers, and investors turning ideas into shipped projects.
          </p>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-10">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring' }}
              >
                <Card>
                  <CardContent className="p-5 text-center">
                    <div className={cn('mx-auto h-10 w-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center mb-2 shadow-md', s.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-3xl font-bold"><Counter value={s.value} />{s.suffix}</p>
                    <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{s.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Top sectors */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Most active sectors</h2>
            <div className="space-y-2.5">
              {[
                { sector: 'AI / ML', share: 32 },
                { sector: 'Climate Tech', share: 18 },
                { sector: 'Healthtech', share: 12 },
                { sector: 'Edtech', share: 9 },
                { sector: 'Fintech', share: 8 },
                { sector: 'Other', share: 21 },
              ].map((s, i) => (
                <div key={s.sector} className="flex items-center gap-3">
                  <span className="w-24 text-sm font-medium truncate">{s.sector}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${s.share}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className={cn('h-full bg-gradient-to-r', i % 2 === 0 ? 'from-indigo-500 to-violet-500' : 'from-violet-500 to-fuchsia-500')}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{s.share}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Stats updated hourly. <a href="#" className="text-primary hover:underline">View raw data</a>
        </p>
      </div>
    </motion.div>
  );
};
