import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, Users as UsersIcon, Wrench, Rocket, Layers } from 'lucide-react';
import { Page, Idea, ProgressStage } from '../types';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { PageLoader } from './ui/Spinner';
import { EmptyState } from './ui/EmptyState';
import { IdeaCard } from './IdeaCard';
import api from '../services/backendApiService';
import { cn } from '../utils/cn';

interface Props {
  setPage: (page: Page, id?: string) => void;
  /** When set via hash routing (#stage/<stage>), pre-select this stage. */
  initialStage?: ProgressStage;
}

const STAGE_META: Record<ProgressStage, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  'idea-stage':     { label: 'Idea stage',     icon: Lightbulb, color: 'text-amber-500',   description: 'Just thinking. Looking for early reactions or co-founders.' },
  'team-building':  { label: 'Team building',  icon: UsersIcon, color: 'text-violet-500',  description: 'Forming a founding team. Often the first roles being filled.' },
  'in-development': { label: 'In development', icon: Wrench,    color: 'text-blue-500',    description: 'Actively building. Engineers, designers, and operators wanted.' },
  'launched':       { label: 'Launched',       icon: Rocket,    color: 'text-emerald-500', description: 'Live with real users. Scaling and growing the team.' },
};

const ORDER: ProgressStage[] = ['idea-stage', 'team-building', 'in-development', 'launched'];

/**
 * Browse by Stage — group ideas by progressStage with stage-as-tabs UX.
 *
 * Routed via #stage/<stage> for shareable links. Falls back to no filter.
 */
export const BrowseByStage: React.FC<Props> = ({ setPage, initialStage }) => {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<ProgressStage | 'all'>(initialStage ?? 'all');

  useEffect(() => {
    if (initialStage) setActive(initialStage);
  }, [initialStage]);

  useEffect(() => {
    let alive = true;
    api.getAllIdeas()
      .then((all) => { if (alive) setIdeas(Array.isArray(all) ? all : []); })
      .catch(() => { if (alive) { setError('Could not load ideas.'); setIdeas([]); } });
    return () => { alive = false; };
  }, []);

  const counts = useMemo(() => {
    const c: Record<ProgressStage | 'all', number> = { all: 0, 'idea-stage': 0, 'team-building': 0, 'in-development': 0, launched: 0 };
    (ideas ?? []).forEach((i) => {
      c.all++;
      const s = i.progressStage as ProgressStage | undefined;
      if (s && c[s] !== undefined) c[s]++;
    });
    return c;
  }, [ideas]);

  const filtered = useMemo(() => {
    if (!ideas) return [];
    if (active === 'all') return ideas;
    return ideas.filter((i) => i.progressStage === active);
  }, [ideas, active]);

  const setStage = (s: ProgressStage | 'all') => {
    setActive(s);
    if (s === 'all') {
      if (window.location.hash.startsWith('#stage/')) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    } else {
      window.history.replaceState(null, '', `#stage/${s}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-5xl py-6 md:py-10 px-4"
    >
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

      <header className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="h-5 w-5" />
          </span>
          Browse by Stage
        </h1>
        <p className="text-sm text-muted-foreground mt-2">From "just a thought" to "live in the wild" — find ideas at the stage you want to join.</p>
      </header>

      {/* Stage tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin mb-5">
        <button
          onClick={() => setStage('all')}
          className={cn(
            'shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-all',
            active === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40 hover:border-primary/40',
          )}
        >
          All <span className="text-[10px] opacity-70">({counts.all})</span>
        </button>
        {ORDER.map((s) => {
          const m = STAGE_META[s];
          const Icon = m.icon;
          const isActive = active === s;
          return (
            <button
              key={s}
              onClick={() => setStage(s)}
              className={cn(
                'shrink-0 px-3 py-2 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 transition-all',
                isActive ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40 hover:border-primary/40',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', !isActive && m.color)} />
              {m.label}
              <span className="text-[10px] opacity-70">({counts[s]})</span>
            </button>
          );
        })}
      </div>

      {/* Stage description */}
      {active !== 'all' && (
        <Card className="mb-5 bg-secondary/30">
          <CardContent className="p-4 flex items-center gap-3">
            {(() => {
              const m = STAGE_META[active];
              const Icon = m.icon;
              return (
                <>
                  <Icon className={cn('h-5 w-5 shrink-0', m.color)} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{m.label}</div>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                  <Badge variant="ghost" size="sm" className="ml-auto shrink-0">{counts[active]} {counts[active] === 1 ? 'idea' : 'ideas'}</Badge>
                </>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {ideas === null ? (
        <PageLoader label="Loading ideas…" />
      ) : error ? (
        <EmptyState icon={<Layers className="h-10 w-10" />} title="Could not load" description={error} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-10 w-10" />}
          title="Nothing in this stage yet"
          description="Try a different stage, or share an idea to populate it."
          action={{ label: 'Browse all ideas', onClick: () => setPage('feed') }}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((idea) => (
            <IdeaCard key={idea.ideaId} idea={idea} setPage={setPage} />
          ))}
        </div>
      )}
    </motion.div>
  );
};
