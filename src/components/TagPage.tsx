import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Hash, ArrowLeft } from 'lucide-react';
import { Idea, User, Page } from '../types';
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { PageLoader } from './ui/Spinner';
import { preloadImages } from '../utils/preloadImages';

interface TagPageProps {
  tag: string;                                       // raw tag from URL (e.g. "ai", "Climate Tech")
  currentUser: User | null;
  setPage: (page: Page, id?: string) => void;
}

/**
 * Browse all ideas matching a single tag.
 *
 * Routed by App.tsx from URL hash `#tag/<name>` so the URL is shareable and
 * survives page refresh. The page filters client-side from getAllIdeas — when
 * a `/api/tags/:slug/ideas` endpoint exists, swap to that for fewer bytes.
 */
export const TagPage: React.FC<TagPageProps> = ({ tag, currentUser, setPage }) => {
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    setIsLoading(true);
    api
      .getAllIdeas()
      .then(async (ideas) => {
        if (!isMountedRef.current) return;
        const list = ideas || [];
        setAllIdeas(list);
        // Preload owner avatars so cards render fully before we hide the spinner.
        await preloadImages(list.map((i: any) => i.ownerAvatarUrl ?? i.owner?.avatarUrl));
      })
      .catch((err) => console.error('Tag page load error:', err))
      .finally(() => { if (isMountedRef.current) setIsLoading(false); });
  }, [tag]);

  // Case-insensitive match against tags AND required-skills so a search for
  // "AI" finds ideas tagged "ai" OR with "AI" listed as a required skill.
  const matching = useMemo(() => {
    const needle = tag.trim().toLowerCase();
    if (!needle) return [];
    return allIdeas.filter((idea) => {
      const tags = (idea.tags || []).map((t) => (t || '').toLowerCase());
      const skills = (idea.requiredSkills || []).map((s) => (s || '').toLowerCase());
      return tags.includes(needle) || skills.includes(needle);
    });
  }, [allIdeas, tag]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-4xl py-6 md:py-10 px-4"
    >
      <Button
        variant="ghost"
        size="sm"
        leftIcon={<ArrowLeft className="h-4 w-4" />}
        onClick={() => setPage('feed')}
        className="mb-4"
      >
        Back to feed
      </Button>

      <header className="mb-6 flex items-center gap-3">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Hash className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-space-grotesk">
            {tag}
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
            {!isLoading && (
              <>
                <Badge variant="soft" size="sm">{matching.length}</Badge>
                idea{matching.length === 1 ? '' : 's'} tagged with
                <span className="font-mono">#{tag}</span>
              </>
            )}
          </p>
        </div>
      </header>

      {isLoading ? (
        <PageLoader label={`Finding ideas tagged #${tag}…`} minHeight="50vh" />
      ) : matching.length > 0 ? (
        <motion.div
          className="space-y-4"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {matching.map((idea) => (
            <motion.div
              key={idea.ideaId}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            >
              <IdeaCard idea={idea} setPage={setPage} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <EmptyState
          icon={<Hash className="h-8 w-8" />}
          title={`No ideas tagged #${tag} yet`}
          description={
            currentUser
              ? `Be the first to share an idea on this topic.`
              : `Sign in to be the first.`
          }
          action={
            currentUser
              ? { label: 'Share an idea', onClick: () => setPage('newIdea') }
              : undefined
          }
        />
      )}
    </motion.div>
  );
};
