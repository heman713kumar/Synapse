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
    // Filter by category/sector - check both fields for compatibility
    if (selectedSector !== 'All') {
      list = list.filter((i) => {
        const ideaCategory = i.category || i.sector;
        return ideaCategory === selectedSector;
      });
    }
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
        {/* Hero Section with Gradient Background - Light/Dark Mode Compatible */}
        <header className="mb-8 rounded-2xl bg-gradient-to-br from-primary/8 via-purple-500/5 to-blue-500/5 dark:from-primary/15 dark:via-purple-600/10 dark:to-blue-600/10 border border-primary/15 dark:border-primary/25 p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-primary/15 dark:bg-primary/25 rounded-lg">
              <Compass className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-space-grotesk bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Explore Ideas
            </h1>
          </div>
          <p className="text-base text-muted-foreground ml-11">Discover innovative ideas from thinkers around the world. Search, filter, and connect with inspiring concepts.</p>
        </header>

        {/* Enhanced Search */}
        <div className="mb-8">
          <div className="relative">
            <Input
              placeholder="Search ideas, tags, or keywords…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="h-5 w-5 text-primary/70" />}
              rightIcon={
                searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground dark:hover:text-primary/80 hover:text-primary transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                )
              }
              className="!pl-12 !pr-12 !py-3 !text-base !shadow-lg !shadow-primary/10 dark:!shadow-primary/20 !border !border-primary/30 dark:!border-primary/30 focus:!border-primary/60 dark:focus:!border-primary/60 !bg-white dark:!bg-slate-950/50 !text-foreground dark:!text-foreground placeholder:!text-foreground/50 dark:placeholder:!text-foreground/60"
            />
          </div>
        </div>

        <Tabs defaultValue="sectors">
          <TabsList variant="underline" className="mb-8 border-b border-primary/20 dark:border-primary/20 bg-white dark:bg-transparent rounded-none px-0">
            <TabsTrigger 
              variant="underline" 
              value="sectors" 
              className="gap-2 text-base font-semibold py-3 px-4 relative data-[state=active]:text-primary data-[state=active]:shadow-glow-sm text-foreground/60 dark:text-foreground/70"
            >
              <Grid3X3 className="h-5 w-5" /> By sector
            </TabsTrigger>
            <TabsTrigger 
              variant="underline" 
              value="trending" 
              className="gap-2 text-base font-semibold py-3 px-4 relative data-[state=active]:text-primary data-[state=active]:shadow-glow-sm text-foreground/60 dark:text-foreground/70"
            >
              <TrendingUp className="h-5 w-5" /> Trending
            </TabsTrigger>
            {currentUser && (
              <TabsTrigger 
                variant="underline" 
                value="recommended" 
                className="gap-2 text-base font-semibold py-3 px-4 relative data-[state=active]:text-primary data-[state=active]:shadow-glow-sm text-foreground/60 dark:text-foreground/70"
              >
                <Sparkles className="h-5 w-5" /> For you
              </TabsTrigger>
            )}
          </TabsList>

          {/* SECTORS */}
          <TabsContent value="sectors" className="space-y-8 mt-0">
            {/* Sector pills */}
            <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-3 pl-1">
              {(['All', ...SECTORS] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSector(s)}
                  className={cn(
                    'shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 whitespace-nowrap hover:scale-105',
                    selectedSector === s
                      ? 'bg-purple-600 text-white border-purple-700 shadow-lg'
                      : 'bg-gray-100 text-purple-600 border-purple-300 hover:bg-gray-200'
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
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
              >
                {filteredIdeas.map((idea) => (
                  <motion.div 
                    key={idea.ideaId} 
                    variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <IdeaCard idea={idea} setPage={setPage} />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="py-12">
                <EmptyState
                  icon={<Lightbulb className="h-12 w-12 text-primary/25 dark:text-primary/30" />}
                  title={debouncedSearch || selectedSector !== 'All' ? 'No ideas match' : 'No ideas yet'}
                  description={debouncedSearch || selectedSector !== 'All' ? 'Try clearing filters or searching for something else.' : 'Be the first to share an innovative idea.'}
                  action={debouncedSearch || selectedSector !== 'All'
                    ? { label: 'Clear filters', onClick: () => { setSearchQuery(''); setSelectedSector('All'); } }
                    : currentUser
                      ? { label: 'Share an idea', onClick: () => setPage('newIdea') }
                      : undefined}
                />
              </div>
            )}
          </TabsContent>

          {/* TRENDING */}
          <TabsContent value="trending" className="mt-0">
            {isLoading ? (
              <SkeletonList count={3} />
            ) : trendingIdeas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trendingIdeas.map((idea, idx) => (
                  <motion.div 
                    key={idea.ideaId} 
                    className="relative"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    {idx < 3 && (
                      <Badge 
                        variant="gradient" 
                        size="sm" 
                        className="absolute -top-3 -left-2 z-10 shadow-lg shadow-primary/50 bg-gradient-to-r from-primary to-purple-600"
                      >
                        #{idx + 1} Trending
                      </Badge>
                    )}
                    <IdeaCard idea={idea} setPage={setPage} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-12">
                <EmptyState 
                  icon={<TrendingUp className="h-12 w-12 text-primary/25 dark:text-primary/30" />} 
                  title="Nothing trending yet" 
                  description="Ideas will appear here as they gain traction."
                />
              </div>
            )}
          </TabsContent>

          {/* RECOMMENDED */}
          {currentUser && (
            <TabsContent value="recommended" className="mt-0">
              {isLoading ? (
                <SkeletonList count={3} />
              ) : recommendedIdeas.length > 0 ? (
                <>
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-primary/8 dark:from-primary/15 to-purple-600/8 dark:to-purple-600/10 border border-primary/15 dark:border-primary/25 backdrop-blur-sm">
                    <p className="text-sm font-medium text-primary dark:text-primary/90 flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Ideas matched to your skills and interests.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {recommendedIdeas.map((idea) => (
                      <motion.div 
                        key={idea.ideaId}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                      >
                        <IdeaCard idea={idea} setPage={setPage} />
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-12">
                  <EmptyState
                    icon={<Sparkles className="h-12 w-12 text-primary/25 dark:text-primary/30" />}
                    title="No personalized recommendations yet"
                    description="Add more skills and interests to your profile so we can find better matches for you."
                    action={{ label: 'Update profile', onClick: () => setPage('settings') }}
                  />
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </motion.div>
  );
};
