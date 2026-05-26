import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Type, Maximize2, Minimize2 } from 'lucide-react';
import { Page, Idea } from '../types';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { PageLoader } from './ui/Spinner';
import { Avatar } from './ui/Avatar';
import api from '../services/backendApiService';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { cn } from '../utils/cn';
import { NotFound } from './NotFound';

interface Props {
  setPage: (page: Page, id?: string) => void;
  ideaId: string | null;
}

interface ReadingPrefs {
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  theme: 'paper' | 'sepia' | 'night';
  width: 'narrow' | 'comfortable';
}

const SIZE_CLASS: Record<ReadingPrefs['fontSize'], string> = {
  sm: 'text-[15px] leading-[1.7]',
  md: 'text-[17px] leading-[1.75]',
  lg: 'text-[19px] leading-[1.8]',
  xl: 'text-[21px] leading-[1.85]',
};

const THEME_CLASS: Record<ReadingPrefs['theme'], string> = {
  paper: 'bg-[#fafaf7] text-[#1f1f1f]',
  sepia: 'bg-[#f4ecd8] text-[#3a2f1d]',
  night: 'bg-[#0d1117] text-[#d4d4d4]',
};

/**
 * Reading mode — distraction-free view of an idea. No sidebar, no reactions,
 * just the content. Reader controls font size, paper theme, and column width.
 */
export const ReadingMode: React.FC<Props> = ({ setPage, ideaId }) => {
  const [idea, setIdea] = useState<Idea | null | 'missing'>(null);
  const [prefs, setPrefs] = useLocalStorage<ReadingPrefs>('synapse-reading-prefs', {
    fontSize: 'md', theme: 'paper', width: 'comfortable',
  });

  useEffect(() => {
    if (!ideaId) { setIdea('missing'); return; }
    let alive = true;
    setIdea(null);
    api.getIdeaById(ideaId)
      .then((data) => { if (alive) setIdea(data ?? 'missing'); })
      .catch(() => { if (alive) setIdea('missing'); });
    return () => { alive = false; };
  }, [ideaId]);

  if (idea === 'missing') {
    return <NotFound setPage={setPage} message="This idea was deleted or never existed." />;
  }

  if (idea === null) {
    return <PageLoader label="Loading…" />;
  }

  const cycleFontSize = () => {
    const order: ReadingPrefs['fontSize'][] = ['sm', 'md', 'lg', 'xl'];
    const next = order[(order.indexOf(prefs.fontSize) + 1) % order.length];
    setPrefs({ ...prefs, fontSize: next });
  };

  const cycleTheme = () => {
    const order: ReadingPrefs['theme'][] = ['paper', 'sepia', 'night'];
    const next = order[(order.indexOf(prefs.theme) + 1) % order.length];
    setPrefs({ ...prefs, theme: next });
  };

  const toggleWidth = () => {
    setPrefs({ ...prefs, width: prefs.width === 'narrow' ? 'comfortable' : 'narrow' });
  };

  const ThemeIcon = prefs.theme === 'night' ? Moon : Sun;

  return (
    <div className={cn('min-h-[calc(100vh-4rem)] transition-colors', THEME_CLASS[prefs.theme])}>
      {/* Floating toolbar */}
      <div className="sticky top-16 z-10 flex items-center justify-between gap-2 px-4 py-2 backdrop-blur-md bg-black/5">
        <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => setPage('ideaDetail', idea.ideaId)}>
          Exit reading
        </Button>
        <div className="flex items-center gap-1">
          <button
            onClick={cycleFontSize}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-black/10 transition-colors"
            title="Cycle font size"
          >
            <Type className="h-3.5 w-3.5" />
            <span className="uppercase">{prefs.fontSize}</span>
          </button>
          <button
            onClick={cycleTheme}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-black/10 transition-colors capitalize"
            title="Cycle paper theme"
          >
            <ThemeIcon className="h-3.5 w-3.5" />
            {prefs.theme}
          </button>
          <button
            onClick={toggleWidth}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-semibold hover:bg-black/10 transition-colors"
            title="Toggle column width"
          >
            {prefs.width === 'narrow' ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
            {prefs.width === 'narrow' ? 'Wide' : 'Narrow'}
          </button>
        </div>
      </div>

      {/* Article */}
      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'mx-auto px-6 py-10 md:py-16',
          prefs.width === 'narrow' ? 'max-w-[640px]' : 'max-w-[760px]',
          SIZE_CLASS[prefs.fontSize],
          'font-serif',
        )}
        style={{ fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif' }}
      >
        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight mb-4">{idea.title}</h1>

        {/* Byline */}
        <div className="flex items-center gap-3 mb-8 pb-6 border-b border-current/10 text-sm">
          <Avatar src={idea.ownerAvatarUrl} name={idea.ownerDisplayName || idea.ownerUsername} size="md" />
          <div className="flex-1">
            <div className="font-semibold">{idea.ownerDisplayName || idea.ownerUsername || 'Anonymous'}</div>
            <div className="opacity-70 text-xs">
              {new Date(idea.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              {idea.sector && <> · {idea.sector}</>}
            </div>
          </div>
        </div>

        {/* Lede */}
        {idea.summary && <p className="text-xl md:text-2xl opacity-80 font-medium mb-8 leading-relaxed">{idea.summary}</p>}

        {/* Body */}
        {idea.description && (
          <div className="whitespace-pre-wrap">{idea.description}</div>
        )}

        {/* Questionnaire as sections */}
        {idea.questionnaire && (
          <div className="space-y-8 mt-12">
            {idea.questionnaire.problemStatement && (
              <Section title="The problem" body={idea.questionnaire.problemStatement} />
            )}
            {idea.questionnaire.targetAudience && (
              <Section title="Who it's for" body={idea.questionnaire.targetAudience} />
            )}
            {idea.questionnaire.resourcesNeeded && (
              <Section title="What we need" body={idea.questionnaire.resourcesNeeded} />
            )}
            {idea.questionnaire.timeline && (
              <Section title="Timeline" body={idea.questionnaire.timeline} />
            )}
            {idea.questionnaire.skillsLooking && (
              <Section title="People we're looking for" body={idea.questionnaire.skillsLooking} />
            )}
            {idea.questionnaire.visionForSuccess && (
              <Section title="What success looks like" body={idea.questionnaire.visionForSuccess} />
            )}
          </div>
        )}

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="mt-12 pt-6 border-t border-current/10">
            <div className="text-xs uppercase tracking-wider opacity-60 mb-2">Tags</div>
            <div className="flex flex-wrap gap-1.5">
              {idea.tags.map((t) => (
                <Badge key={t} variant="ghost" size="sm">#{t}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Bottom return */}
        <div className="mt-16 text-center">
          <Button variant="outline" onClick={() => setPage('ideaDetail', idea.ideaId)}>Back to discussion</Button>
        </div>
      </motion.article>
    </div>
  );
};

const Section: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <section>
    <h2 className="text-2xl font-bold mb-3 border-l-4 border-current/20 pl-3">{title}</h2>
    <p className="whitespace-pre-wrap opacity-90">{body}</p>
  </section>
);
