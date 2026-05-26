import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedItem, User, Page, Idea } from '../types';
import api from '../services/backendApiService';
import { IdeaCard } from './IdeaCard';
import { AchievementPostCard } from './AchievementPostCard';
import { MilestonePostCard } from './MilestonePostCard';
import { SECTORS, REGIONS, SKILLS } from '../constants';
import { Search, Sparkles, TrendingUp, Heart, Clock, Users, Target, X, Filter, Lightbulb } from 'lucide-react';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Tooltip } from './ui/Tooltip';
import { EmptyState } from './ui/EmptyState';
import { PageLoader } from './ui/Spinner';
import { preloadImages } from '../utils/preloadImages';
import { cn } from '../utils/cn';
import { useDebounce } from '../hooks/useDebounce';
import { RecentlyViewed } from './RecentlyViewed';
import { StreakBadge } from './StreakBadge';
import { DailyPrompt } from './DailyPrompt';
import { ProfileCompletionBanner } from './ProfileCompletionBanner';
import { greeting } from '../hooks/useTimeOfDay';

type SortOrder =
  | 'relevant'
  | 'trending'
  | 'likes'
  | 'newest'
  | 'collaboration'
  | 'skillMatch';

/* ---------------- SCORING (unchanged logic) ---------------- */

const calculateRelevanceScore = (idea: Idea, user: User | null): number => {
  if (!user) return 0;
  const ideaRequiredSkills = idea.requiredSkills || [];
  const ideaTags = idea.tags || [];
  const userSkills = new Set((user.skills || []).map(s => s.skillName));
  const userInterests = new Set(user.interests || []);
  let score = 0;
  ideaRequiredSkills.forEach(skill => { if (userSkills.has(skill)) score += 15; });
  ideaTags.forEach(tag => { if (userInterests.has(tag)) score += 5; });
  if (idea.sector && userInterests.has(idea.sector)) score += 10;
  return score;
};

const calculateTrendingScore = (idea: Idea): number => {
  const createdAt = idea.createdAt ? new Date(idea.createdAt).getTime() : Date.now();
  const hoursAgo = (Date.now() - createdAt) / (1000 * 60 * 60);
  const engagement = (idea.likesCount || 0) + (idea.commentsCount || 0) * 2;
  return engagement / Math.pow(Math.max(hoursAgo, 0) + 2, 1.8);
};

const calculateCollaborationScore = (idea: Idea): number => {
  const skills = idea.requiredSkills || [];
  const collaborators = idea.collaborators || [];
  let score = skills.length * 5 + (idea.commentsCount || 0) * 2;
  score += collaborators.length === 0 ? 25 : 10 / collaborators.length;
  if (idea.questionnaire?.skillsLooking?.trim().length) score += 15;
  return score;
};

const calculateSkillMatchScore = (idea: Idea, user: User | null): number => {
  if (!user?.skills?.length) return 0;
  const required = idea.requiredSkills || [];
  const userSkills = new Set(user.skills.map(s => s.skillName));
  return required.filter(skill => userSkills.has(skill)).length;
};

/**
 * Sort options.
 *
 * `requiresUser: true` options are hidden for guests because the underlying
 * score function returns 0 for `user === null`, which made the button
 * silently behave identically to "Newest" — looked broken.
 */
const SORT_OPTIONS: {
  value: SortOrder; label: string; icon: React.ElementType; requiresUser?: boolean;
}[] = [
  { value: 'relevant',      label: 'For you',     icon: Sparkles,   requiresUser: true  },
  { value: 'trending',      label: 'Trending',    icon: TrendingUp                      },
  { value: 'likes',         label: 'Most liked',  icon: Heart                           },
  { value: 'newest',        label: 'Newest',      icon: Clock                           },
  { value: 'collaboration', label: 'Open collab', icon: Users                           },
  { value: 'skillMatch',    label: 'Skill match', icon: Target,     requiresUser: true  },
];

/**
 * Score a feed item (idea / achievement / milestone) for a given sort order.
 * Returns 0 for sort orders that don't apply to a non-idea post — the comparator
 * then falls back to date, so achievement/milestone posts still get a sensible
 * order rather than being frozen wherever the API returned them.
 */
function scoreFeedItem(item: FeedItem, sortOrder: SortOrder, user: User | null): number {
  if (item.type === 'idea') {
    const idea = item.data;
    switch (sortOrder) {
      case 'likes':         return idea.likesCount || 0;
      case 'trending':      return calculateTrendingScore(idea);
      case 'relevant':      return calculateRelevanceScore(idea, user);
      case 'skillMatch':    return calculateSkillMatchScore(idea, user);
      case 'collaboration': return calculateCollaborationScore(idea);
    }
  }
  // Achievement / milestone posts can still participate in "Most liked" if their
  // payload exposes a count; otherwise fall through to date tie-break.
  if (sortOrder === 'likes') {
    return (item.data as any).likesCount || 0;
  }
  return 0;
}

interface FeedProps {
  currentUser: User | null;
  setPage: (page: Page, id?: string) => void;
}

export const Feed: React.FC<FeedProps> = ({ currentUser, setPage }) => {
  const [allFeedItems, setAllFeedItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 200);
  const [sortOrder, setSortOrder] = useState<SortOrder>(currentUser ? 'relevant' : 'trending');

  const [filters, setFilters] = useState({
    sector: '',
    region: '',
    skills: [] as string[],
  });

  // If the user logs out while sitting on the Feed, drop any sort that needs
  // a profile to score against — otherwise the active pill silently produces
  // a date-ordered list and looks broken.
  useEffect(() => {
    if (!currentUser && (sortOrder === 'relevant' || sortOrder === 'skillMatch')) {
      setSortOrder('trending');
    }
  }, [currentUser, sortOrder]);

  useEffect(() => {
    let isMounted = true;
    const loadFeed = async () => {
      try {
        const data = await api.getFeedItems();
        if (!isMounted) return;
        setAllFeedItems(data || []);

        // Keep the loader up until every avatar / cover image referenced by
        // the feed has been decoded by the browser. Without this, the cards
        // render immediately but pictures "pop in" one by one over the next
        // few hundred ms — looks broken on slow connections.
        const imageUrls: Array<string | undefined> = [];
        (data || []).forEach((item: any) => {
          const d = item?.data || {};
          imageUrls.push(d.ownerAvatarUrl);                 // some FeedItems
          imageUrls.push(d.owner?.avatarUrl);               // ideas
          imageUrls.push(d.user?.avatarUrl);                // achievement / milestone posts
          imageUrls.push(d.coverImageUrl);                  // ideas with cover banners
        });
        await preloadImages(imageUrls);
      } catch (err) {
        console.error('Feed load error:', err);
        if (isMounted) setAllFeedItems([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    setIsLoading(true);
    loadFeed();
    return () => { isMounted = false; };
  }, []);

  const filteredItems = useMemo(() => {
    let items = [...allFeedItems];
    items = items.filter(item => {
      if (item.type !== 'idea') return true;
      const idea = item.data;
      if (!idea) return false;
      const title = idea.title || '';
      const summary = idea.summary || '';
      const skills = idea.requiredSkills || [];

      if (debouncedQuery && !title.toLowerCase().includes(debouncedQuery.toLowerCase()) && !summary.toLowerCase().includes(debouncedQuery.toLowerCase())) {
        return false;
      }
      if (filters.sector && idea.sector !== filters.sector) return false;
      if (filters.region && idea.region !== filters.region) return false;
      if (filters.skills.length > 0) {
        return filters.skills.some(skill => skills.includes(skill));
      }
      return true;
    });

    // Sort with a uniform scorer so achievement/milestone posts also respect the
    // active sort instead of always slotting in by date. Every sort falls back
    // to newest-first when scores tie, so identical-score items don't appear
    // in arbitrary input order.
    items.sort((a, b) => {
      const dateA = new Date(a.data.createdAt || 0).getTime();
      const dateB = new Date(b.data.createdAt || 0).getTime();
      if (sortOrder === 'newest') return dateB - dateA;

      const scoreDiff =
        scoreFeedItem(b, sortOrder, currentUser) -
        scoreFeedItem(a, sortOrder, currentUser);
      return scoreDiff !== 0 ? scoreDiff : dateB - dateA;
    });
    return items;
  }, [allFeedItems, debouncedQuery, filters, sortOrder, currentUser]);

  const activeFilterCount =
    (filters.sector ? 1 : 0) + (filters.region ? 1 : 0) + filters.skills.length;

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ sector: '', region: '', skills: [] });
  };

  const toggleSkill = (skill: string) => {
    setFilters((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill],
    }));
  };

  return (
    <div className="container max-w-6xl py-6 md:py-10 px-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
      <div className="min-w-0">
      {/* Hero */}
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-space-grotesk">
            {currentUser
              ? <>{greeting()}, <span className="text-gradient">{currentUser.displayName?.split(' ')[0] || currentUser.name?.split(' ')[0] || 'friend'}</span></>
              : <>Discover <span className="text-gradient">brilliant ideas</span></>}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentUser ? 'Ideas curated for your skills and interests.' : 'Sign in to personalize your feed.'}
          </p>
        </div>
        {currentUser && <StreakBadge variant="compact" />}
      </header>

      {/* Profile completion nudge — dismissible, hides at 80%+ */}
      {currentUser && <ProfileCompletionBanner currentUser={currentUser} setPage={setPage} />}

      {/* Daily prompt — dismissible per day */}
      {currentUser && <div className="mb-4"><DailyPrompt setPage={setPage} /></div>}

      {/* Search + filter toggle */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Search ideas, tags, or skills…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={searchQuery && (
            <button onClick={() => setSearchQuery('')} className="hover:text-foreground"><X className="h-4 w-4" /></button>
          )}
        />
        <Button
          variant={activeFilterCount ? 'gradient' : 'outline'}
          size="default"
          onClick={() => setShowFilters((v) => !v)}
          leftIcon={<Filter className="h-4 w-4" />}
        >
          Filters {activeFilterCount > 0 && <Badge variant="default" size="sm" className="ml-1 bg-white/20">{activeFilterCount}</Badge>}
        </Button>
      </div>

      {/* Sort pills — hide options that require a logged-in user. Avoids the
          UX trap where a guest taps "For you" and gets the same result as
          "Newest" because the relevance score has nothing to personalize against. */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
        {SORT_OPTIONS
          .filter((opt) => !opt.requiresUser || currentUser)
          .map((opt) => {
            const Icon = opt.icon;
            const isActive = sortOrder === opt.value;
            return (
              <Tooltip key={opt.value} content={opt.label === 'For you' ? 'Personalized to your skills + interests' : ''}>
                <button
                  onClick={() => setSortOrder(opt.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border focus-ring',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-glow-sm'
                      : 'bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              </Tooltip>
            );
          })}
      </div>

      {/* Filter drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="p-5 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sector</label>
                  <select
                    value={filters.sector}
                    onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-ring"
                  >
                    <option value="">All sectors</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Region</label>
                  <select
                    value={filters.region}
                    onChange={e => setFilters(f => ({ ...f, region: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-ring"
                  >
                    <option value="">All regions</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Skills {filters.skills.length > 0 && <span className="text-primary normal-case ml-1">({filters.skills.length} selected)</span>}
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin pr-1">
                  {SKILLS.slice(0, 40).map(skill => {
                    const active = filters.skills.includes(skill);
                    return (
                      <button
                        key={skill}
                        onClick={() => toggleSkill(skill)}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                          active ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-border hover:border-primary/40'
                        )}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <div className="flex justify-end mt-4">
                  <Button variant="ghost" size="sm" onClick={clearFilters} leftIcon={<X className="h-3.5 w-3.5" />}>
                    Clear all
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed — keep the branded loader visible until both data and all
          referenced images (avatars, covers) have been preloaded. */}
      {isLoading ? (
        <PageLoader
          label={currentUser ? 'Curating ideas for you…' : 'Discovering brilliant ideas…'}
          minHeight="60vh"
        />
      ) : filteredItems.length > 0 ? (
        <motion.div className="space-y-5" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.04 } } }}>
          {filteredItems.map((item, idx) => {
            if (!item.data) return null;
            return (
              <motion.div
                key={`${item.type}-${(item.data as any).ideaId || (item.data as any).postId || idx}`}
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
              >
                {item.type === 'idea' && <IdeaCard idea={item.data} setPage={setPage} />}
                {item.type === 'achievement' && <AchievementPostCard post={item.data} setPage={setPage} />}
                {item.type === 'milestone' && <MilestonePostCard post={item.data} setPage={setPage} />}
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <EmptyState
          icon={<Lightbulb className="h-8 w-8" />}
          title={searchQuery || activeFilterCount > 0 ? 'No matching ideas' : 'Your feed is empty'}
          description={searchQuery || activeFilterCount > 0
            ? "Try widening your filters or searching with different keywords."
            : currentUser
              ? "Be the first to share an idea, or explore what others are working on."
              : "Sign in to see personalized ideas, or browse the public feed."}
          action={searchQuery || activeFilterCount > 0
            ? { label: 'Clear filters', onClick: clearFilters }
            : currentUser
              ? { label: 'Share an idea', onClick: () => setPage('newIdea'), icon: <Sparkles className="h-4 w-4" /> }
              : { label: 'Explore ideas', onClick: () => setPage('explore') }}
          secondaryAction={!searchQuery && !activeFilterCount ? { label: 'See trending', onClick: () => setPage('trending') } : undefined}
        />
      )}
      </div>

      {/* Sidebar (desktop only) */}
      <aside className="hidden lg:block space-y-4 sticky top-20 self-start">
        {currentUser && <StreakBadge variant="full" />}
        <RecentlyViewed setPage={setPage} />
      </aside>
    </div>
  );
};
