import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Idea, User, Page } from '../types';
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { SECTORS } from '../constants';
import { Search, Sparkles, TrendingUp, Grid3X3, Compass, Lightbulb, X } from 'lucide-react';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { EmptyState } from './ui/EmptyState';
import { SkeletonList } from './ui/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { cn } from '../utils/cn';

interface ExploreProps {
  currentUser: User | null;
  setPage: (page: Page, id?: string) => void;
}

export const Explore: React.FC<ExploreProps> = ({ currentUser, setPage }) => {
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [trendingIdeas, setTrendingIdeas] = useState<Idea[]>([]);
  const [recommendedIdeas, setRecommendedIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 200);
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const ideas = await api.getAllIdeas();
        if (!isMountedRef.current) return;
        setAllIdeas(ideas || []);
        const sorted = [...(ideas || [])].sort((a, b) =>
          ((b.likesCount || 0) + (b.commentsCount || 0)) -
          ((a.likesCount || 0) + (a.commentsCount || 0))
        );
        setTrendingIdeas(sorted.slice(0, 12));
        if (currentUser) {
          const userInterests = new Set(currentUser.interests || []);
          const userSkills = new Set((currentUser.skills || []).map((s) => s?.skillName).filter(Boolean));
          const recommended = [...(ideas || [])]
            .filter((idea) =>
              (idea.tags || []).some((t) => userInterests.has(t)) ||
              (idea.requiredSkills || []).some((s) => userSkills.has(s))
            )
            .slice(0, 12);
          setRecommendedIdeas(recommended);
        }
      } catch (err: any) {
        if (isMountedRef.current) {
          setError(err?.message || 'Could not load ideas. Please try again.');
        }
      } finally {
        if (isMountedRef.current) setIsLoading(false);
      }
    };
    fetch();
  }, [currentUser]);

  const filteredIdeas = useMemo(() => {
    let list = allIdeas;
    if (selectedSector !== 'All') list = list.filter((i) => i.sector === selectedSector);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (i) =>
          (i.title || '').toLowerCase().includes(q) ||
          (i.summary || '').toLowerCase().includes(q) ||
          (i.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [allIdeas, debouncedSearch, selectedSector]);

  if (error && !isLoading) {
    return (
      <div className="container max-w-3xl py-10">
        <EmptyState
          title="Couldn't load ideas"
          description={error}
          action={{ label: 'Try again', onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="container max-w-6xl py-6 px-4">
        {/* Hero */}
        <header className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Compass className="h-6 w-6 text-primary" />
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk">
              Explore <span className="text-gradient">ideas</span>
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">Discover ideas from thinkers around the world.</p>
        </header>

        {/* Search */}
        <Input
          placeholder="Search ideas, tags, or keywords…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={
            searchQuery && (
              <button onClick={() => setSearchQuery('')} className="hover:text-foreground"><X className="h-4 w-4" /></button>
            )
          }
          className="mb-5"
        />

        <Tabs defaultValue="sectors">
          <TabsList variant="underline" className="mb-5">
            <TabsTrigger variant="underline" value="sectors" className="gap-2">
              <Grid3X3 className="h-4 w-4" /> By sector
            </TabsTrigger>
            <TabsTrigger variant="underline" value="trending" className="gap-2">
              <TrendingUp className="h-4 w-4" /> Trending
            </TabsTrigger>
            {currentUser && (
              <TabsTrigger variant="underline" value="recommended" className="gap-2">
                <Sparkles className="h-4 w-4" /> For you
              </TabsTrigger>
            )}
          </TabsList>

          {/* SECTORS */}
          <TabsContent value="sectors" className="space-y-6 mt-0">
            {/* Sector pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
              {(['All', ...SECTORS] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSector(s)}
                  className={cn(
                    'shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                    selectedSector === s
                      ? 'bg-primary text-primary-foreground border-primary shadow-glow-sm'
                      : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {isLoading ? (
              <SkeletonList count={3} />
            ) : filteredIdeas.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {filteredIdeas.map((idea) => (
                  <motion.div key={idea.ideaId} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}>
                    <IdeaCard idea={idea} setPage={setPage} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <EmptyState
                icon={<Lightbulb className="h-8 w-8" />}
                title={debouncedSearch || selectedSector !== 'All' ? 'No ideas match' : 'No ideas yet'}
                description={debouncedSearch || selectedSector !== 'All' ? 'Try clearing filters or searching differently.' : 'Be the first to share an idea.'}
                action={debouncedSearch || selectedSector !== 'All'
                  ? { label: 'Clear filters', onClick: () => { setSearchQuery(''); setSelectedSector('All'); } }
                  : currentUser
                    ? { label: 'Share an idea', onClick: () => setPage('newIdea') }
                    : undefined}
              />
            )}
          </TabsContent>

          {/* TRENDING */}
          <TabsContent value="trending" className="mt-0">
            {isLoading ? (
              <SkeletonList count={3} />
            ) : trendingIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {trendingIdeas.map((idea, idx) => (
                  <div key={idea.ideaId} className="relative">
                    {idx < 3 && (
                      <Badge variant="gradient" size="sm" className="absolute -top-2 -left-2 z-10 shadow-glow-sm">
                        #{idx + 1} Trending
                      </Badge>
                    )}
                    <IdeaCard idea={idea} setPage={setPage} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<TrendingUp className="h-8 w-8" />} title="Nothing trending yet" />
            )}
          </TabsContent>

          {/* RECOMMENDED */}
          {currentUser && (
            <TabsContent value="recommended" className="mt-0">
              {isLoading ? (
                <SkeletonList count={3} />
              ) : recommendedIdeas.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ideas matched to your skills and interests.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {recommendedIdeas.map((idea) => (
                      <IdeaCard key={idea.ideaId} idea={idea} setPage={setPage} />
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<Sparkles className="h-8 w-8" />}
                  title="No personalized recommendations yet"
                  description="Add more skills and interests to your profile so we can find better matches."
                  action={{ label: 'Update profile', onClick: () => setPage('settings') }}
                />
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </motion.div>
  );
};
