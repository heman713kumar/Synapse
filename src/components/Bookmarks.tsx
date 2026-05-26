import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Idea, Page } from '../types';
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { Bookmark, Search, X, CheckSquare, Square, GitCompare } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { SkeletonList } from './ui/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { toast } from './ui/Toaster';
import { cn } from '../utils/cn';

const MAX_COMPARE = 3;

interface BookmarksProps {
  currentUser: User;
  setPage: (page: Page, id?: string) => void;
}

export const Bookmarks: React.FC<BookmarksProps> = ({ currentUser, setPage }) => {
  const [bookmarkedIdeas, setBookmarkedIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 200);
  const isMountedRef = useRef(true);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_COMPARE) {
        toast.error(`You can compare up to ${MAX_COMPARE} ideas`);
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    setSelectedIds([]);
  }, []);

  const goCompare = useCallback(() => {
    if (selectedIds.length < 2) return;
    try { localStorage.setItem('synapse-compare-ideas', JSON.stringify(selectedIds)); } catch {/* noop */}
    exitSelectMode();
    setPage('compare');
  }, [selectedIds, exitSelectMode, setPage]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const ids = currentUser.bookmarkedIdeas || [];

    // Short-circuit empty state without firing any network requests.
    if (ids.length === 0) {
      setBookmarkedIdeas([]);
      setIsLoading(false);
      return;
    }

    // Fetch only the bookmarked ideas in parallel instead of downloading
    // every idea in the system and filtering client-side. Tolerates per-id
    // failures (e.g. a deleted idea) so one bad bookmark doesn't blank the
    // whole page.
    Promise.all(
      ids.map((id) =>
        api.getIdeaById(id).catch(() => null as Idea | null)
      )
    )
      .then((results) => {
        if (!isMountedRef.current) return;
        setBookmarkedIdeas(results.filter((r): r is Idea => r !== null));
      })
      .catch((err) => console.error('Failed to load bookmarks:', err))
      .finally(() => { if (isMountedRef.current) setIsLoading(false); });
  }, [currentUser.bookmarkedIdeas]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return bookmarkedIdeas;
    const q = debouncedQuery.toLowerCase();
    return bookmarkedIdeas.filter(
      (i) => (i.title || '').toLowerCase().includes(q) || (i.summary || '').toLowerCase().includes(q)
    );
  }, [bookmarkedIdeas, debouncedQuery]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-3xl py-6 px-4">
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Bookmark className="h-6 w-6 text-primary fill-current" />
            <h1 className="text-3xl font-bold tracking-tight font-space-grotesk">Bookmarks</h1>
          </div>
          <p className="text-sm text-muted-foreground">Ideas you've saved for later.</p>
        </header>

        {bookmarkedIdeas.length > 0 && (
          <div className="flex gap-2 mb-5">
            <Input
              placeholder="Search bookmarks…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              rightIcon={query && (
                <button onClick={() => setQuery('')}><X className="h-4 w-4 hover:text-foreground" /></button>
              )}
              className="flex-1"
            />
            {bookmarkedIdeas.length >= 2 && (
              <Button
                variant={selectMode ? 'default' : 'outline'}
                size="default"
                leftIcon={selectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                onClick={() => (selectMode ? exitSelectMode() : setSelectMode(true))}
              >
                {selectMode ? 'Cancel' : 'Select'}
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <SkeletonList count={3} />
        ) : filtered.length > 0 ? (
          <div className={cn('space-y-5', selectMode && 'pb-24')}>
            {filtered.map((idea) => {
              const isSelected = selectedIds.includes(idea.ideaId);
              if (!selectMode) return <IdeaCard key={idea.ideaId} idea={idea} setPage={setPage} />;
              return (
                <div
                  key={idea.ideaId}
                  onClick={() => toggleSelected(idea.ideaId)}
                  className={cn(
                    'relative rounded-2xl transition-all cursor-pointer',
                    isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                  )}
                >
                  <div className="pointer-events-none">
                    <IdeaCard idea={idea} setPage={setPage} />
                  </div>
                  <span className={cn(
                    'absolute top-3 right-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-md transition-all',
                    isSelected ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border',
                  )}>
                    {isSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={<Bookmark className="h-8 w-8" />}
            title={debouncedQuery ? 'No bookmarks match' : 'No bookmarks yet'}
            description={debouncedQuery ? 'Try a different search.' : "Save ideas you want to come back to with the bookmark icon — they'll show up here."}
            action={!debouncedQuery ? { label: 'Browse ideas', onClick: () => setPage('feed') } : { label: 'Clear search', onClick: () => setQuery('') }}
          />
        )}
      </div>

      <AnimatePresence>
        {selectMode && selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 px-4 max-w-md w-full pointer-events-none"
          >
            <div className="pointer-events-auto rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-2xl px-3 py-2 flex items-center gap-2">
              <Badge variant="default" size="sm" className="shrink-0">{selectedIds.length}/{MAX_COMPARE}</Badge>
              <span className="text-xs text-muted-foreground flex-1">selected</span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>Clear</Button>
              <Button
                variant="default"
                size="sm"
                leftIcon={<GitCompare className="h-4 w-4" />}
                onClick={goCompare}
                disabled={selectedIds.length < 2}
              >
                Compare
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
