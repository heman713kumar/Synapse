import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, Idea, Page } from '../types';
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { Bookmark, Search, X } from 'lucide-react';
import { Input } from './ui/Input';
import { EmptyState } from './ui/EmptyState';
import { SkeletonList } from './ui/Skeleton';
import { useDebounce } from '../hooks/useDebounce';

interface BookmarksProps {
  currentUser: User;
  setPage: (page: Page, id?: string) => void;
}

export const Bookmarks: React.FC<BookmarksProps> = ({ currentUser, setPage }) => {
  const [bookmarkedIdeas, setBookmarkedIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    api.getAllIdeas()
      .then((allIdeas) => {
        if (!isMountedRef.current) return;
        const bookmarkedIds = new Set(currentUser.bookmarkedIdeas || []);
        setBookmarkedIdeas((allIdeas || []).filter((i) => bookmarkedIds.has(i.ideaId)));
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
          <Input
            placeholder="Search bookmarks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            rightIcon={query && (
              <button onClick={() => setQuery('')}><X className="h-4 w-4 hover:text-foreground" /></button>
            )}
            className="mb-5"
          />
        )}

        {isLoading ? (
          <SkeletonList count={3} />
        ) : filtered.length > 0 ? (
          <div className="space-y-5">
            {filtered.map((idea) => <IdeaCard key={idea.ideaId} idea={idea} setPage={setPage} />)}
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
    </motion.div>
  );
};
