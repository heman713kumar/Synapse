import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Idea, User, Page, ProgressStage, ReactionEmoji, ReactionSummary } from '../types';
import api from '../services/backendApiService';
import { PROGRESS_STAGES } from '../constants';
import { Heart, MessageSquare, Bookmark, Share2, MoreHorizontal, Users, Sparkles } from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/DropdownMenu';
import { Reactions } from './Reactions';
import { ShareDialog } from './ShareDialog';
import { toast } from './ui/Toaster';
import { timeAgo, userName, compactNumber, truncate } from '../utils/format';
import { cn } from '../utils/cn';

interface IdeaCardProps {
  idea: Idea;
  setPage: (page: Page, id?: string) => void;
}

const STAGE_COLORS: Record<string, string> = {
  'idea-stage': 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30',
  'team-building': 'bg-violet-500/15 text-violet-600 dark:text-violet-300 border-violet-500/30',
  'in-development': 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
  'launched': 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
};

const IdeaProgressTracker: React.FC<{ currentStageId?: ProgressStage }> = ({ currentStageId }) => {
  const stageId = currentStageId || 'idea-stage';
  const currentIndex = Math.max(0, PROGRESS_STAGES.findIndex((s) => s.id === stageId));
  const progress = ((currentIndex + 1) / PROGRESS_STAGES.length) * 100;

  return (
    <div className="mt-4">
      <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
        {PROGRESS_STAGES.map((stage, index) => (
          <span key={stage.id} className={cn(index === currentIndex && 'font-semibold text-foreground')}>
            {stage.name}
          </span>
        ))}
      </div>
    </div>
  );
};

const IdeaCardComponent: React.FC<IdeaCardProps> = ({ idea, setPage }) => {
  const [owner, setOwner] = useState<User | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(idea.likesCount ?? 0);
  const [reactions, setReactions] = useState<ReactionSummary[]>([
    { emoji: '👍', count: 0, hasReacted: false },
    { emoji: '🔥', count: 0, hasReacted: false },
    { emoji: '💡', count: 0, hasReacted: false },
  ]);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchOwner = async () => {
      setLoadingOwner(true);
      if (!idea.ownerId) {
        setLoadingOwner(false);
        return;
      }
      try {
        const user = await api.getUserById(idea.ownerId);
        if (mounted) setOwner(user);
      } catch {
        if (mounted) setOwner(null);
      } finally {
        if (mounted) setLoadingOwner(false);
      }
    };
    fetchOwner();
    return () => { mounted = false; };
  }, [idea.ownerId]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((p) => {
      setLikeCount((c) => (p ? c - 1 : c + 1));
      return !p;
    });
    try {
      api.castVote(idea.ideaId, liked ? 'down' : 'up').catch(() => {});
    } catch {}
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarked((b) => {
      toast.success(b ? 'Removed from bookmarks' : 'Saved to bookmarks');
      return !b;
    });
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowShare(true);
  };

  const handleReact = (emoji: ReactionEmoji) => {
    setReactions((prev) => {
      const existing = prev.find((r) => r.emoji === emoji);
      if (existing) {
        return prev.map((r) =>
          r.emoji === emoji
            ? { ...r, count: r.hasReacted ? r.count - 1 : r.count + 1, hasReacted: !r.hasReacted }
            : r
        );
      }
      return [...prev, { emoji, count: 1, hasReacted: true }];
    });
  };

  const tags = idea.tags ?? [];
  const requiredSkills = idea.requiredSkills ?? [];
  const collaboratorCount = idea.collaborators?.length ?? 0;
  const stageBadgeClass = idea.progressStage ? STAGE_COLORS[idea.progressStage] : STAGE_COLORS['idea-stage'];

  return (
    <motion.article
      className="surface surface-hover overflow-hidden group cursor-pointer"
      onClick={() => setPage('ideaDetail', idea.ideaId)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {loadingOwner ? (
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); if (owner) setPage('profile', owner.userId); }}
                disabled={!owner}
                className="rounded-full focus-ring"
                aria-label={`View ${userName(owner)}'s profile`}
              >
                <Avatar src={owner?.avatarUrl} name={userName(owner)} size="md" />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); if (owner) setPage('profile', owner.userId); }}
                  className="text-sm font-semibold truncate hover:text-primary transition-colors"
                >
                  {loadingOwner ? <span className="inline-block h-4 w-32 bg-muted rounded animate-pulse" /> : userName(owner)}
                </button>
                {owner?.isVerified && <span className="text-primary" title="Verified">✓</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {timeAgo(idea.createdAt)}
                {idea.sector && <span className="ml-1.5">· {idea.sector}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {idea.progressStage && (
              <span className={cn('hidden sm:inline-flex items-center text-[10px] font-semibold rounded-full border px-2 py-0.5', stageBadgeClass)}>
                {PROGRESS_STAGES.find(s => s.id === idea.progressStage)?.name}
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  onClick={(e) => e.stopPropagation()}
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={handleShare}><Share2 className="h-4 w-4" /> Share</DropdownMenuItem>
                <DropdownMenuItem onClick={handleBookmark}><Bookmark className="h-4 w-4" /> {bookmarked ? 'Remove bookmark' : 'Bookmark'}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem destructive onClick={() => toast('Report flow coming soon', { icon: '🚩' })}>Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Title + summary */}
        <h2 className="mt-4 text-lg font-semibold tracking-tight leading-snug group-hover:text-primary transition-colors">
          {idea.title}
        </h2>
        {idea.summary && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{truncate(idea.summary, 240)}</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="soft" size="sm">#{tag}</Badge>
            ))}
            {tags.length > 4 && <Badge variant="ghost" size="sm">+{tags.length - 4}</Badge>}
          </div>
        )}

        {/* Skills needed */}
        {requiredSkills.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-muted-foreground">Looking for:</span>
            <div className="flex flex-wrap gap-1.5">
              {requiredSkills.slice(0, 3).map((s) => (
                <span key={s} className="text-foreground font-medium">{s}</span>
              )).reduce<React.ReactNode[]>((acc, el, i) => acc.concat(i > 0 ? [<span key={`sep-${i}`} className="text-muted-foreground">,</span>, el] : [el]), [])}
              {requiredSkills.length > 3 && <span className="text-muted-foreground">+{requiredSkills.length - 3}</span>}
            </div>
          </div>
        )}

        {/* Progress */}
        <IdeaProgressTracker currentStageId={idea.progressStage} />
      </div>

      {/* Footer actions */}
      <div className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip content={liked ? 'Unlike' : 'Like'}>
            <button
              onClick={handleLike}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm transition-all',
                liked ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Heart className={cn('h-4 w-4 transition-transform', liked && 'fill-current scale-110')} />
              <span className="tabular-nums font-medium">{compactNumber(likeCount)}</span>
            </button>
          </Tooltip>
          <Tooltip content="Comments">
            <button
              onClick={(e) => { e.stopPropagation(); setPage('ideaDetail', idea.ideaId); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="tabular-nums font-medium">{compactNumber(idea.commentsCount ?? 0)}</span>
            </button>
          </Tooltip>
          {collaboratorCount > 0 && (
            <Tooltip content={`${collaboratorCount} collaborator${collaboratorCount === 1 ? '' : 's'}`}>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="tabular-nums font-medium">{compactNumber(collaboratorCount)}</span>
              </div>
            </Tooltip>
          )}
          <Reactions reactions={reactions} onReact={handleReact} size="sm" layout="picker-only" />
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
            <button
              onClick={handleBookmark}
              className={cn(
                'p-2 rounded-md transition-colors',
                bookmarked ? 'text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              )}
            >
              <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />
            </button>
          </Tooltip>
          <Tooltip content="Share">
            <button
              onClick={handleShare}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setPage('ideaDetail', idea.ideaId); }}>
            View
          </Button>
        </div>
      </div>
      <ShareDialog
        open={showShare}
        onOpenChange={setShowShare}
        title={idea.title}
        description={idea.summary}
        url={`${window.location.pathname}#/idea/${idea.ideaId}`}
      />
    </motion.article>
  );
};

export const IdeaCard = React.memo(IdeaCardComponent);
