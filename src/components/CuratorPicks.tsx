import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Crown, RefreshCw, Filter } from 'lucide-react';
import { Page, Idea } from '../types';
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
}

/**
 * Curator Picks — weekly editorial selection.
 *
 * Currently approximates "picks" by ranking ideas with the most signal: high
 * likes per follower, late-stage progress, and active comment threads.
 * When backend ships /api/curator-picks, swap the client-side compute for a
 * fetch — render shape stays the same.
 */
const THEMES = [
  { id: 'all',    label: 'All picks',         hint: 'Editor\'s overall picks' },
  { id: 'rising', label: 'Rising fast',       hint: 'Ideas with the most momentum this week' },
  { id: 'deep',   label: 'Deep tech',         hint: 'AI, robotics, infra, hardcore engineering' },
  { id: 'social', label: 'Social impact',     hint: 'Climate, health, education, equity' },
  { id: 'fun',    label: 'Just fun',          hint: 'Indie, experimental, weird-in-a-good-way' },
] as const;

type ThemeId = typeof THEMES[number]['id'];

function pickTheme(idea: Idea): ThemeId[] {
  const sector = (idea.sector || '').toLowerCase();
  const tags = (idea.tags || []).map((t) => t.toLowerCase()).join(' ');
  const text = `${sector} ${tags} ${idea.title || ''} ${idea.description || ''}`.toLowerCase();
  const themes: ThemeId[] = ['all'];

  if (/(ai|ml|robot|llm|infrastructure|compute|gpu|kernel|database|systems)/.test(text)) themes.push('deep');
  if (/(climate|carbon|health|education|equity|community|nonprofit|accessibility)/.test(text)) themes.push('social');
  if (/(game|toy|art|music|fun|indie|hobby)/.test(text)) themes.push('fun');

  return themes;
}

function scoreIdea(i: Idea): number {
  const likes = i.likesCount ?? 0;
  const comments = i.commentsCount ?? 0;
  const stageBoost =
      i.progressStage === 'in-development' ? 1.2
    : i.progressStage === 'launched'       ? 1.4
    : i.progressStage === 'team-building'  ? 1.1
    : 1.0;
  return (likes * 1.0 + comments * 2.5) * stageBoost;
}

export const CuratorPicks: React.FC<Props> = ({ setPage }) => {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<ThemeId>('all');

  const load = async () => {
    setError(null);
    setIdeas(null);
    try {
      const all = await api.getAllIdeas();
      const arr = Array.isArray(all) ? all : [];
      setIdeas(arr);
    } catch (e) {
      setError('Could not load curator picks.');
      setIdeas([]);
    }
  };

  useEffect(() => { load(); }, []);

  const picks = useMemo(() => {
    if (!ideas) return [];
    const filtered = activeTheme === 'all'
      ? ideas
      : ideas.filter((i) => pickTheme(i).includes(activeTheme));
    return filtered
      .map((i) => ({ idea: i, score: scoreIdea(i) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, activeTheme === 'all' ? 12 : 8)
      .map((x) => x.idea);
  }, [ideas, activeTheme]);

  const themeLabel = THEMES.find((t) => t.id === activeTheme);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-5xl py-6 md:py-10 px-4"
    >
      <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('feed')} className="mb-4">Back</Button>

      <header className="mb-6 md:mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-purple-600 text-white shadow-md">
                <Crown className="h-5 w-5" />
              </span>
              Curator Picks
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Hand-selected highlights from the community — the ideas worth your attention this week.
            </p>
          </div>
          <Button variant="outline" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={load}>Refresh</Button>
        </div>
      </header>

      {/* Theme chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin mb-2">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTheme(t.id)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all inline-flex items-center gap-1.5',
              activeTheme === t.id ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-secondary/40 hover:border-primary/40',
            )}
          >
            {t.id === 'all' && <Sparkles className="h-3 w-3" />}
            {t.id !== 'all' && <Filter className="h-3 w-3" />}
            {t.label}
          </button>
        ))}
      </div>
      {themeLabel?.hint && (
        <p className="text-xs text-muted-foreground italic mb-5">{themeLabel.hint}</p>
      )}

      {/* Body */}
      {ideas === null ? (
        <PageLoader label="Loading picks…" />
      ) : error ? (
        <EmptyState
          icon={<Crown className="h-10 w-10" />}
          title="Could not load picks"
          description={error}
          action={{ label: 'Try again', onClick: load, icon: <RefreshCw className="h-4 w-4" /> }}
        />
      ) : picks.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-10 w-10" />}
          title="No picks in this theme yet"
          description="Check back next week, or try a different theme."
        />
      ) : (
        <>
          {/* Editor's note */}
          <Card className="mb-5 bg-gradient-to-br from-amber-500/5 to-purple-500/5 border-amber-500/20">
            <CardContent className="p-4 flex gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/60 text-amber-700 shrink-0">
                <Crown className="h-4 w-4" />
              </span>
              <div>
                <Badge variant="ghost" size="sm" className="mb-1">Editor's note</Badge>
                <p className="text-sm leading-relaxed">
                  This week we focused on ideas with serious momentum and active collaboration threads. If something here resonates, jump in — most are actively recruiting.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {picks.map((idea, i) => (
              <div key={idea.ideaId} className="relative">
                {i < 3 && (
                  <span className="absolute -top-2 -left-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold shadow-lg ring-2 ring-background">
                    {i + 1}
                  </span>
                )}
                <IdeaCard idea={idea} setPage={setPage} />
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
};
