import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Megaphone, Sparkles, Wrench, Bug, Zap, Rocket } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card, CardContent } from './ui/Card';
import { cn } from '../utils/cn';

interface Props { setPage: (page: Page) => void; }

type EntryKind = 'feature' | 'improvement' | 'fix' | 'perf' | 'release';

const KIND_META: Record<EntryKind, { label: string; color: string; icon: React.ElementType }> = {
  feature:     { label: 'New',         color: 'from-indigo-500 to-violet-500',   icon: Sparkles },
  improvement: { label: 'Improved',    color: 'from-sky-500 to-blue-500',        icon: Zap },
  fix:         { label: 'Fixed',       color: 'from-emerald-500 to-teal-500',    icon: Bug },
  perf:        { label: 'Performance', color: 'from-amber-500 to-orange-500',    icon: Wrench },
  release:     { label: 'Release',     color: 'from-rose-500 to-fuchsia-500',    icon: Rocket },
};

const RELEASES: { date: string; version: string; entries: { kind: EntryKind; title: string; desc: string }[] }[] = [
  {
    date: '2026-05-22',
    version: 'v0.18',
    entries: [
      { kind: 'feature', title: 'Bounties + Job Board', desc: 'Post tasks for cash or hire collaborators on your idea.' },
      { kind: 'feature', title: 'Rich-text editor', desc: 'Tiptap-powered editor with auto-embeds (YouTube, Loom, Figma, etc).' },
      { kind: 'feature', title: 'Compare ideas tool', desc: 'Pick up to 3 ideas to compare side-by-side.' },
      { kind: 'feature', title: 'Trending tags', desc: 'See what topics are heating up on Synapse.' },
      { kind: 'feature', title: 'Cookie consent + Data export + Account deletion', desc: 'GDPR-friendly compliance flows.' },
      { kind: 'feature', title: 'Status page', desc: 'Live uptime monitoring.' },
    ],
  },
  {
    date: '2026-05-12',
    version: 'v0.17',
    entries: [
      { kind: 'feature', title: 'Stripe checkout + 2FA + LinkedIn import', desc: 'Premium plans, two-factor auth, and one-click profile import.' },
      { kind: 'feature', title: 'Polls, Anonymous posts, Idea Remix', desc: 'New ways to discuss, share, and iterate.' },
      { kind: 'feature', title: 'Smart Inbox triage', desc: 'AI labels for collab requests, questions, networking, and spam.' },
      { kind: 'improvement', title: 'Embed code + Markdown export', desc: 'Share any idea anywhere.' },
      { kind: 'feature', title: 'Mentorship & Office Hours', desc: 'Book 30-min sessions with verified founders.' },
      { kind: 'feature', title: 'Developer API & Webhooks', desc: 'API keys, signed webhooks, and SDKs.' },
    ],
  },
  {
    date: '2026-05-01',
    version: 'v0.16',
    entries: [
      { kind: 'feature', title: 'Leaderboard, Spaces, Events', desc: 'Three new community pages.' },
      { kind: 'feature', title: 'Premium tier + Investor mode', desc: 'Pricing page, deal-flow dashboard.' },
      { kind: 'feature', title: 'XP / Levels / Quests / Streaks', desc: 'New gamification system.' },
      { kind: 'feature', title: 'Onboarding tour + PWA install prompt', desc: 'Smoother first-run experience.' },
      { kind: 'feature', title: 'Pitch deck generator', desc: 'AI-assisted 10-slide deck from your idea.' },
    ],
  },
  {
    date: '2026-04-22',
    version: 'v0.15',
    entries: [
      { kind: 'feature', title: 'AI Idea Coach', desc: 'Refine summary, analyze idea, suggest tags, draft pitch.' },
      { kind: 'feature', title: 'Command palette (⌘K)', desc: 'Jump anywhere instantly.' },
      { kind: 'feature', title: 'Reactions, ShareDialog, RecentlyViewed', desc: 'New interactions across cards.' },
      { kind: 'perf', title: 'Route-based code splitting', desc: 'Initial bundle 30% smaller.' },
    ],
  },
  {
    date: '2026-04-12',
    version: 'v0.14',
    entries: [
      { kind: 'release', title: 'Complete design system overhaul', desc: 'Tokens, primitives, dark/light theme, Framer Motion polish across every page.' },
    ],
  },
];

export const Changelog: React.FC<Props> = ({ setPage }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-3xl py-6 px-4">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

        <header className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Megaphone className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Changelog</h1>
          </div>
          <p className="text-sm text-muted-foreground">What's new on Synapse.</p>
        </header>

        <ol className="relative space-y-10 pl-6 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-px before:bg-border">
          {RELEASES.map((r) => (
            <li key={r.version} className="relative">
              <span className="absolute -left-6 top-1.5 h-4 w-4 rounded-full bg-primary ring-4 ring-background" />
              <div className="flex items-baseline gap-2 mb-3">
                <Badge variant="gradient">{r.version}</Badge>
                <span className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <ul className="space-y-2.5">
                {r.entries.map((entry, i) => {
                  const meta = KIND_META[entry.kind];
                  const Icon = meta.icon;
                  return (
                    <Card key={i}>
                      <CardContent className="p-4 flex items-start gap-3">
                        <div className={cn('h-8 w-8 rounded-lg bg-gradient-to-br text-white flex items-center justify-center shrink-0', meta.color)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{entry.title}</p>
                            <Badge variant="ghost" size="sm">{meta.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{entry.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </ul>
            </li>
          ))}
        </ol>

        <p className="text-xs text-center text-muted-foreground mt-12">
          Subscribe to changelog updates: <a href="#" className="text-primary hover:underline">RSS</a> · <a href="#" className="text-primary hover:underline">Email</a>
        </p>
      </div>
    </motion.div>
  );
};
