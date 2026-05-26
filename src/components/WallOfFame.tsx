import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Sparkles, TrendingUp, Award, Rocket, Star } from 'lucide-react';
import { Page } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';

interface Props {
  setPage: (page: Page, id?: string) => void;
}

/**
 * Wall of Fame — static showcase of "ideas that made it."
 *
 * Hand-curated success stories. We pull these from our own community list
 * (no backend route yet); when /api/wall-of-fame ships, swap the constant
 * for a fetch and keep the same render shape.
 */
interface FameEntry {
  id: string;
  title: string;
  founders: string;
  outcome: string;
  stage: 'Acquired' | 'Funded' | 'Launched' | 'Profitable';
  year: string;
  blurb: string;
  metric?: string;
}

const ENTRIES: FameEntry[] = [
  { id: '1', title: 'Lumen Health',         founders: 'Maya Chen & Devin Park',          outcome: 'Acquired by UnitedHealth',                stage: 'Acquired',   year: '2025', metric: '$42M exit', blurb: 'Started as a Synapse post asking for a Rails dev to build a sleep-coaching app. Three months later they had MVP, sixteen months later they had an exit.' },
  { id: '2', title: 'Atlas Robotics',       founders: 'Priya Iyer',                       outcome: 'Series A — $11M led by a16z',             stage: 'Funded',     year: '2025', metric: '11k waitlist', blurb: 'Warehouse-arm startup. Priya found her co-founder through a "looking for an EE who hates Boston Dynamics" thread.' },
  { id: '3', title: 'CodeWhistle',          founders: 'Jordan Wells & Ana López',         outcome: 'Profitable bootstrap — $2M ARR',          stage: 'Profitable', year: '2024', metric: '$2M ARR', blurb: 'Developer documentation tool with cult following. Never raised. They credit Synapse for finding their first three customers.' },
  { id: '4', title: 'Forager',              founders: 'Sam Okonkwo',                      outcome: 'YC W25 — now public beta',                stage: 'Launched',   year: '2025', metric: '40k DAU', blurb: 'Foraging-as-a-service. Started as a joke comment on an idea about hyperlocal food networks. Now in 12 cities.' },
  { id: '5', title: 'Verity Notebooks',     founders: 'Hana Ito & Marcus Brevner',         outcome: 'Acquired by Notion',                      stage: 'Acquired',   year: '2024', metric: 'Undisclosed', blurb: 'Citation-aware writing tool for researchers. The PMF moment came from a comment thread arguing about footnote handling — they shipped it that weekend.' },
  { id: '6', title: 'Pebble Payments',      founders: 'Renata Vasquez',                    outcome: 'Series B — $40M, Stripe partnership',      stage: 'Funded',     year: '2025', metric: '$140M TPV', blurb: 'Stablecoin remittance for LatAm. Found her CTO co-founder by replying to a comment on an unrelated idea about FX hedging.' },
  { id: '7', title: 'Synthwave Studios',    founders: 'Khalil Hassan & Tia Müller',        outcome: '$8M seed — Sequoia',                       stage: 'Funded',     year: '2024', metric: 'Pre-revenue', blurb: 'Game-asset generation engine. Their original Synapse post had 47 collaborators interested in the first week.' },
  { id: '8', title: 'Slate Education',      founders: 'Bea Tanaka',                        outcome: 'Profitable, 19 employees',                 stage: 'Profitable', year: '2024', metric: '180 schools', blurb: 'Adaptive math curriculum for tier-2 city schools. Bea built it solo for 14 months before hiring; first hire was a Synapse user from the same thread.' },
  { id: '9', title: 'Coral Compute',        founders: 'Ethan Park, Reyhan Singh, Mira Doh', outcome: 'Series A — $22M',                          stage: 'Funded',     year: '2025', metric: '5 lighthouse customers', blurb: 'Distributed inference for edge devices. Three strangers met on Synapse, wrote a whitepaper together, then a term sheet six months later.' },
];

const STAGE_STYLES: Record<FameEntry['stage'], { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  Acquired:   { bg: 'bg-purple-500/10', text: 'text-purple-500', icon: Star },
  Funded:     { bg: 'bg-emerald-500/10', text: 'text-emerald-500', icon: TrendingUp },
  Launched:   { bg: 'bg-blue-500/10',    text: 'text-blue-500',    icon: Rocket },
  Profitable: { bg: 'bg-amber-500/10',   text: 'text-amber-500',   icon: Award },
};

export const WallOfFame: React.FC<Props> = ({ setPage }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-5xl py-6 md:py-10 px-4"
    >
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

      <header className="text-center mb-8 md:mb-10">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-purple-600 text-white shadow-lg mb-4">
          <Trophy className="h-7 w-7" />
        </span>
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight font-space-grotesk">Wall of Fame</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
          Ideas that started on Synapse and went on to build, ship, and change things. Every one of these began as a single post asking for help.
        </p>
      </header>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Acquired', val: ENTRIES.filter((e) => e.stage === 'Acquired').length, icon: Star,       color: 'text-purple-500' },
          { label: 'Funded',   val: ENTRIES.filter((e) => e.stage === 'Funded').length,   icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Profitable', val: ENTRIES.filter((e) => e.stage === 'Profitable').length, icon: Award,  color: 'text-amber-500' },
          { label: 'Launched', val: ENTRIES.filter((e) => e.stage === 'Launched').length, icon: Rocket,    color: 'text-blue-500' },
        ].map(({ label, val, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <div className="text-xl font-bold">{val}</div>
                <div className="text-xs text-muted-foreground">{label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entries */}
      <div className="grid gap-4 md:grid-cols-2">
        {ENTRIES.map((e, i) => {
          const { bg, text, icon: StageIcon } = STAGE_STYLES[e.stage];
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Card className="h-full hover:border-primary/40 transition-colors">
                <CardContent className="p-5 h-full flex flex-col">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base truncate">{e.title}</h3>
                      <p className="text-xs text-muted-foreground truncate">{e.founders}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide shrink-0 ${bg} ${text}`}>
                      <StageIcon className="h-3 w-3" />
                      {e.stage}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3 flex-1">{e.blurb}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <Badge variant="ghost" size="sm">{e.year}</Badge>
                    {e.metric && (
                      <span className="text-xs font-semibold text-foreground/80 inline-flex items-center gap-1">
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        {e.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 italic">{e.outcome}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Footer CTA */}
      <div className="text-center mt-10 md:mt-12 p-6 rounded-2xl border border-dashed border-border/60 bg-secondary/20">
        <h3 className="font-bold text-lg">Your idea could be next.</h3>
        <p className="text-sm text-muted-foreground mt-1 mb-4">Every entry on this wall started with a single post. The next one is yours to write.</p>
        <Button onClick={() => setPage('feed')} leftIcon={<Rocket className="h-4 w-4" />}>Share your idea</Button>
      </div>
    </motion.div>
  );
};
